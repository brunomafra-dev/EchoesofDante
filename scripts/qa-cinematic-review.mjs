import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const plan = JSON.parse(await readFile('docs/cinematic-opening/shots.json', 'utf8'));
const landingSeconds = plan.shots.find(s => s.id === 'landing').seconds;
const base = process.env.QA_BASE ?? 'http://localhost:5184';
const out = process.env.QA_OUT ?? 'docs/cinematic-opening/revision-02/qa/review';
await mkdir(out, { recursive: true });
const report = { base, passed: false, checks: [], errors: [], humanApproval: 'pending', media: [] };
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  await context.addInitScript(() => {
    localStorage.setItem('cinematic-sentinel', 'preserve'); sessionStorage.setItem('cinematic-sentinel', 'preserve');
    window.qaPad = { connected: false, buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.qaPad.connected ? [window.qaPad] : [] });
  });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
  const video = page.locator('video');
  const ready = async () => page.waitForFunction(() => document.querySelector('video')?.readyState >= 2 && !document.querySelector('video').seeking);
  for (const [take, duration] of [['film', plan.targetSeconds], ['landing', landingSeconds], ['voices', 12]]) {
    await page.goto(`${base}/cinematic-review.html?take=${take}&v=${version}`);
    await ready();
    const media = await video.evaluate(v => ({ width: v.videoWidth, height: v.videoHeight, seconds: v.duration, src: new URL(v.currentSrc).pathname,
      paused: v.paused, autoplay: v.autoplay, inline: v.playsInline, controls: v.controls, loop: v.loop }));
    assert.deepEqual([media.width, media.height, media.seconds], [1280, 720, duration]);
    assert.ok(media.paused && !media.autoplay && media.inline && media.controls && !media.loop);
    assert.equal(await page.locator(`[data-take=${take}]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#download').getAttribute('href'), new URL(media.src, base).href);
    report.media.push({ take, ...media });
    if (take !== 'film') {
      await page.locator('#play').tap();
      await page.waitForFunction(() => document.querySelector('video').ended, null, { timeout: 20000 });
      assert.match(await page.locator('#playback-status').innerText(), /Fim d/);
    }
  }
  report.checks.push('Three direct routes decode 720p24; plan durations; no autoplay/loop; both short films play naturally to end');

  for (const [width, height] of [[1280,720],[1366,768],[1920,1080],[844,390]]) {
    await page.setViewportSize({ width, height });
    for (const take of ['film', 'landing', 'voices']) {
      await page.locator(`[data-take=${take}]`).tap(); await ready();
      await page.evaluate(() => scrollTo(0,0));
      const rect = await video.boundingBox();
      assert.ok(rect && rect.x >= 0 && rect.y >= 0 && rect.x+rect.width <= width+1 && rect.y+rect.height <= height, JSON.stringify({take,width,height,rect}));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    if (width === 1280 || width === 844) await page.screenshot({ path: `${out}/review-${width}.png` });
  }
  report.checks.push('All three modes fit four resolutions, touch selection and complete frame, without horizontal overflow');
  const counts = await page.evaluate(() => ({ dom: document.querySelectorAll('*').length, videos: document.querySelectorAll('video').length }));
  for (let i=0; i<8; i++) {
    await page.locator(`[data-take=${i%2 ? 'landing' : 'voices'}]`).click(); await ready();
    await page.locator('#replay').click();
    await page.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').currentTime > .05);
    await page.locator('#play').click();
  }
  assert.deepEqual(await page.evaluate(() => ({ dom: document.querySelectorAll('*').length, videos: document.querySelectorAll('video').length })), counts);
  assert.equal(await page.locator('canvas').count(), 0);
  await page.locator('#production-info > summary').tap();
  await page.waitForFunction(() => [...document.querySelectorAll('.comparisons img')].every(i => i.complete && i.naturalWidth > 0));
  report.checks.push('Eight mode/replay cycles keep one video and stable DOM; before/after images load; no game/canvas');

  await page.evaluate(() => { window.qaPad.connected = true; window.dispatchEvent(new Event('gamepadconnected')); });
  async function pad(index) {
    await page.evaluate(i => { window.qaPad.buttons[i].pressed = true; }, index); await page.waitForTimeout(120);
    await page.evaluate(i => { window.qaPad.buttons[i].pressed = false; }, index); await page.waitForTimeout(120);
  }
  await pad(2); await page.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').currentTime < 2);
  for (let i=0;i<4;i++) await pad(15);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.take), 'voices');
  await pad(0); await ready();
  assert.equal(await page.locator('[data-take=voices]').getAttribute('aria-pressed'), 'true');
  assert.ok(await video.evaluate(v => v.paused));
  await Promise.all([page.waitForURL('**/test-library.html'), page.evaluate(() => { window.qaPad.buttons[1].pressed = true; })]);
  assert.equal(await page.locator(`a.launch[href="cinematic-review.html?take=voices&v=${version}"]`).count(), 1);
  assert.deepEqual(await page.evaluate(() => ({ local:{...localStorage}, session:{...sessionStorage} })), {
    local:{'cinematic-sentinel':'preserve'}, session:{'cinematic-sentinel':'preserve'} });
  report.checks.push('Gamepad X replay, directional mode selection, A activate, B library; save sentinels preserved');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) { report.failure = String(error); throw error; }
finally { await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report,null,2)+'\n'); }
console.log(JSON.stringify(report,null,2));
