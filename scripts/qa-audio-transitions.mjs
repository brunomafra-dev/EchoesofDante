import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.QA_BASE ?? 'http://127.0.0.1:5185', out = 'docs/audio-recovery/qa/transitions';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }), page = await browser.newPage();
const report = { method: 'Real AudioManager imported from DEV in a blank isolated page; public audio methods drive zero/focus/crossfade/suspend/stop/destroy states. This is an audio subsystem fixture, not campaign gameplay.', errors: [], scenarios: [] };
page.on('pageerror', e => report.errors.push(e.message));
async function signal() {
  return page.evaluate(async () => {
    const s = window.__transitionAudio, analyser = s.context.createAnalyser();
    s.musicNodes.get(s.music).gain.connect(analyser); let peak = 0;
    for (let i = 0; i < 16; i++) { const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data); for (const n of data) peak = Math.max(peak, Math.abs(n)); await new Promise(r => setTimeout(r, 50)); }
    analyser.disconnect();
    return { peak, muted: s.music.muted, gain: s.musicNodes.get(s.music).gain.gain.value, context: s.context.state, outgoing: !!s.outgoing };
  });
}
try {
  await page.goto(base + '/test-library.html');
  await page.evaluate(() => { document.body.replaceChildren(); const button = document.createElement('button'); button.id = 'unlock'; button.textContent = 'Unlock'; button.onclick = () => window.__transitionAudio.unlock(); document.body.append(button); });
  for (const initial of ['zero', 'focus-zero', 'normal']) {
    await page.evaluate(async initial => { const { AudioManager } = await import('/src/systems/Sound.ts'); const s = window.__transitionAudio = new AudioManager(); s.setVolumes(initial === 'zero' ? 0 : .8, .48, .9); s.setArea('base'); s.setMusicFocus(initial === 'focus-zero' ? 0 : 1); }, initial);
    await page.locator('#unlock').click(); await page.waitForTimeout(500);
    const before = await signal();
    if (initial !== 'normal') assert.equal(before.peak, 0); else assert.ok(before.peak > 0);
    await page.evaluate(() => { window.__transitionAudio.setVolumes(.8, .48, .9); window.__transitionAudio.setMusicFocus(1); });
    const restored = await signal(); assert.ok(restored.peak > 0); assert.equal(restored.muted, false);
    await page.evaluate(() => window.__transitionAudio.context.suspend());
    await page.locator('#unlock').click(); const resumed = await signal(); assert.equal(resumed.context, 'running'); assert.ok(resumed.peak > 0);
    await page.evaluate(() => { window.__oldMusic = window.__transitionAudio.music; window.__transitionAudio.setArea('warden'); });
    await page.waitForTimeout(1900); const boss = await signal(); assert.ok(boss.peak > 0); assert.equal(boss.outgoing, false); assert.ok(Math.abs(boss.gain - .8 * .48 * .42) < .00001);
    assert.equal(await page.evaluate(() => window.__transitionAudio.musicNodes.has(window.__oldMusic)), false, 'outgoing route released');
    await page.evaluate(() => window.__transitionAudio.stopMusic()); await page.locator('#unlock').click();
    assert.equal(await page.evaluate(() => window.__transitionAudio.music.paused), true, 'unlock preserves explicit stop');
    await page.evaluate(() => window.__transitionAudio.setArea('base')); await page.waitForTimeout(1900);
    const restarted = await signal(); assert.ok(restarted.peak > 0);
    await page.evaluate(() => window.__transitionAudio.destroy());
    assert.equal(await page.evaluate(() => window.__transitionAudio.context.state), 'closed');
    report.scenarios.push({ initial, before, restored, resumed, boss, restarted, destroyed: true });
  }
  // Explicit fallback: no Web Audio. This checks native media state, not output.
  await page.evaluate(async () => { window.AudioContext = undefined; const { AudioManager } = await import('/src/systems/Sound.ts'); const s = window.__transitionAudio = new AudioManager(); s.setVolumes(0, .48, .9); s.setArea('base'); });
  await page.locator('#unlock').click(); await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.__transitionAudio.music.muted), true);
  await page.evaluate(() => window.__transitionAudio.setVolumes(.8, .48, .9));
  assert.equal(await page.evaluate(() => window.__transitionAudio.music.muted), false);
  await page.evaluate(() => window.__transitionAudio.destroy());
  report.nativeFallback = 'Zero mutes, restoring clears native mute; intermediate-volume output not certified on iOS fallback';
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (e) { report.failure = String(e); throw e; }
finally { await writeFile(out + '/report.json', JSON.stringify(report, null, 2) + '\n'); await browser.close(); console.log(JSON.stringify(report)); }
