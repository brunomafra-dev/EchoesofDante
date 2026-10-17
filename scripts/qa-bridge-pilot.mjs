import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE ?? 'http://localhost:5190';
const out = process.env.QA_OUT ?? 'docs/cinematic-pilot/revision-04/qa';
await mkdir(out, { recursive: true });
const report = { base, checks: [], errors: [], humanApproval: 'pending', completeOpening: false };
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const p = await context.newPage();
  p.on('pageerror', e => report.errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
  await p.addInitScript(() => {
    localStorage.setItem('pilot-save-sentinel', 'preserve');
    sessionStorage.setItem('pilot-save-sentinel', 'preserve');
    window.qaPad = { connected: false, buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.qaPad.connected ? [window.qaPad] : [] });
  });
  await p.goto(`${base}/cinematic-bridge-pilot.html?v=0.1.108`);
  await p.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  const video = p.locator('video');
  const media = await video.evaluate(v => ({ width: v.videoWidth, height: v.videoHeight, duration: v.duration,
    controls: v.controls, inline: v.playsInline, autoplay: v.autoplay, loop: v.loop, paused: v.paused }));
  assert.deepEqual([media.width, media.height, media.duration], [1280, 720, 12]);
  assert.ok(media.controls && media.inline && !media.autoplay && !media.loop && media.paused);
  assert.equal(await p.evaluate(() => document.querySelectorAll('canvas').length), 0);
  assert.match(await p.locator('.status').innerText(), /832×480 \/ 16 FPS/);
  assert.match(await p.locator('.status').innerText(), /interpolação/);
  report.media = media;
  report.checks.push('12-second MP4 decodes; native controls, inline, no autoplay/loop; source conversion disclosed');

  await p.locator('#play').focus(); await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.querySelector('video').currentTime > 0.3);
  await p.keyboard.press('Enter');
  const paused = await video.evaluate(v => v.currentTime);
  await p.waitForTimeout(300);
  assert.ok(await video.evaluate(v => v.paused));
  assert.ok(Math.abs(await video.evaluate(v => v.currentTime) - paused) < 0.05);
  await p.locator('#replay').tap();
  await p.waitForFunction(() => document.querySelector('video').currentTime < 1 && !document.querySelector('video').paused);
  await p.waitForFunction(() => document.querySelector('video').ended, null, { timeout: 20000 });
  assert.match(await p.locator('#playback-status').innerText(), /Fim do piloto/);
  report.playbackQuality = await video.evaluate(v => {
    const q = v.getVideoPlaybackQuality(); return { totalFrames: q.totalVideoFrames, droppedFrames: q.droppedVideoFrames };
  });
  assert.ok(report.playbackQuality.totalFrames > 200);
  report.checks.push('Keyboard play/pause; touch replay; entire 12 seconds play to end with status');
  const counts = await p.evaluate(() => ({ dom: document.querySelectorAll('*').length, video: document.querySelectorAll('video').length }));
  for (let i = 0; i < 5; i++) {
    await p.locator('#replay').click();
    await p.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').currentTime < 2);
    await p.locator('#play').click();
  }
  assert.deepEqual(await p.evaluate(() => ({ dom: document.querySelectorAll('*').length, video: document.querySelectorAll('video').length })), counts);
  report.checks.push('Five replays retain one video and stable DOM; no game objects, textures or relay created');

  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await p.setViewportSize({ width, height });
    await p.evaluate(() => scrollTo(0, 0));
    await video.evaluate(v => { v.currentTime = 7.6; });
    await p.waitForFunction(() => !document.querySelector('video').seeking);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const r = await video.boundingBox();
    assert.ok(r && r.x >= 0 && r.y >= 0 && r.x + r.width <= width + 1 && r.y + r.height <= height, JSON.stringify(r));
    await p.screenshot({ path: `${out}/pilot-${width}.png` });
  }
  await p.locator('summary').tap();
  assert.ok(await p.getByText('Água líquida. Atmosfera compatível.', { exact: false }).isVisible());
  report.checks.push('Four resolutions, complete frame in viewport, no horizontal overflow; touch transcript');
  const caption = await p.request.get(`${base}/assets/cinematic-pilot/bridge-whole-scene-pilot.pt-BR.vtt`);
  assert.ok(caption.ok()); assert.match(await caption.text(), /Ninguém desce sozinho/);

  await p.evaluate(() => { window.qaPad.connected = true; window.dispatchEvent(new Event('gamepadconnected')); });
  async function padButton(index) {
    await p.evaluate(i => { window.qaPad.buttons[i].pressed = true; }, index);
    await p.waitForTimeout(120);
    await p.evaluate(i => { window.qaPad.buttons[i].pressed = false; }, index);
    await p.waitForTimeout(120);
  }
  await padButton(2);
  assert.ok(await video.evaluate(v => !v.paused && v.currentTime < 2));
  await padButton(15);
  assert.equal(await p.evaluate(() => document.activeElement.id), 'replay');
  await padButton(0);
  assert.ok(await video.evaluate(v => v.currentTime < 1));
  await padButton(1);
  await p.waitForURL('**/test-library.html');
  assert.equal(await p.locator('a.launch[href="cinematic-bridge-pilot.html?v=0.1.108"]').count(), 1);
  report.checks.push('Gamepad mock X replay, directional focus, A activate, B skip to library');
  assert.deepEqual(await p.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), {
    local: { 'pilot-save-sentinel': 'preserve' }, session: { 'pilot-save-sentinel': 'preserve' },
  });
  assert.deepEqual(report.errors, []);
  report.checks.push('Save sentinels unchanged; library link; zero JavaScript/asset errors');
  report.passed = true;
} catch (e) {
  report.failure = String(e); throw e;
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
