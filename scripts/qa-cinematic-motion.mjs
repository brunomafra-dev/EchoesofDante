import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE ?? 'http://localhost:5190';
const out = process.env.QA_OUT ?? 'docs/cinematic-pilot/revision-03/qa';
await mkdir(out, { recursive: true });
const report = { base, checks: [], errors: [], visualApproval: 'pending', fullPilotComplete: false };
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const p = await context.newPage();
  p.on('pageerror', e => report.errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
  await p.addInitScript(() => {
    localStorage.setItem('motion-sentinel', 'preserve');
    sessionStorage.setItem('motion-sentinel', 'preserve');
  });
  await p.goto(`${base}/cinematic-motion-test.html?v=0.1.107`);
  await p.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  const video = p.locator('video');
  const media = await video.evaluate(v => ({
    width: v.videoWidth, height: v.videoHeight, duration: v.duration,
    controls: v.controls, playsInline: v.playsInline, autoPlay: v.autoplay, paused: v.paused,
  }));
  assert.deepEqual([media.width, media.height], [832, 480]);
  assert.ok(Math.abs(media.duration - 5.0625) < 0.05);
  assert.ok(media.controls && media.playsInline && !media.autoPlay && media.paused);
  assert.match(await p.locator('figcaption').textContent(), /16 FPS/);
  assert.match(await p.locator('.status').textContent(), /Ainda não é o piloto final/);
  assert.equal(await p.evaluate(() => window.__danteGame === undefined), true);
  report.media = media;
  report.checks.push('Native video decodes real 832x480 / 5.06s clip; 16 FPS label; no autoplay; full pilot explicitly pending');

  await video.focus();
  await p.keyboard.press('Space');
  await p.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').currentTime > 0.3);
  await p.keyboard.press('Space');
  assert.ok(await video.evaluate(v => v.paused));
  const pausedTime = await video.evaluate(v => v.currentTime);
  await p.waitForTimeout(300);
  assert.ok(Math.abs(await video.evaluate(v => v.currentTime) - pausedTime) < 0.05);
  await video.evaluate(v => { v.currentTime = v.duration - 0.2; });
  await video.focus(); await p.keyboard.press('Space');
  await p.waitForFunction(() => document.querySelector('video').ended);
  await p.keyboard.press('Space');
  await p.waitForFunction(() => !document.querySelector('video').paused && document.querySelector('video').currentTime < 2);
  await p.keyboard.press('Space');
  report.checks.push('Keyboard native play, pause holds time, reaches end, replay restarts');

  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await p.setViewportSize({ width, height });
    await p.evaluate(() => scrollTo(0, 0));
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const rect = await video.boundingBox();
    assert.ok(rect && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width + 0.5 && rect.y + rect.height <= height);
    await p.screenshot({ path: `${out}/motion-${width}.png` });
  }
  await p.locator('summary').tap();
  assert.ok(await p.getByText('Uma geração no Space público', { exact: false }).isVisible());
  report.checks.push('Four resolutions keep complete video in frame; touch disclosure works');
  assert.deepEqual(await p.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), {
    local: { 'motion-sentinel': 'preserve' }, session: { 'motion-sentinel': 'preserve' },
  });
  await p.goto(`${base}/test-library.html`);
  assert.equal(await p.locator('a.launch[href="cinematic-motion-test.html?v=0.1.107"]').count(), 1);
  report.checks.push('Library points to clip; no campaign/save mutation; no game, relay or generation runs in the lab');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (e) {
  report.failure = String(e); throw e;
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
