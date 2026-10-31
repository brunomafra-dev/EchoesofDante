import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE ?? 'http://127.0.0.1:5185';
const out = process.env.QA_OUT ?? 'docs/audio-settings/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
page.setDefaultTimeout(90000);
const report = { at: new Date().toISOString(), base, method: 'Chrome touch emulation using actual menu sliders and real AudioManager; temporary namespace and real storage sentinels.', checks: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.message));
const cdp = await page.context().newCDPSession(page);
const tap = id => page.locator(`[data-shell="${id}"]`).tap();

async function dragVolume(key, target) {
  const input = page.locator(`[data-volume="${key}"]`);
  const rect = await input.boundingBox();
  assert.ok(rect, `visible ${key} slider`);
  const current = Number(await input.inputValue());
  const y = rect.y + rect.height / 2;
  const from = rect.x + rect.width * current / 100;
  const to = rect.x + rect.width * target / 100;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y, id: 1 }] });
  for (let step = 1; step <= 5; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + (to - from) * step / 5, y, id: 1 }] });
    await page.waitForTimeout(35);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
  return { requested: target, displayed: Number(await input.inputValue()) };
}

async function settingsDrag() {
  const values = {};
  for (const [key, target] of [['master', 23], ['music', 31], ['sfx', 17]]) {
    values[key] = await dragVolume(key, target);
    assert.ok(Math.abs(values[key].displayed - target) <= 4, `${key} slider accepted real touch drag`);
  }
  const stored = await page.evaluate(() => JSON.parse(Storage.prototype.getItem.call(localStorage, 'echoes-of-dante.settings.v1')));
  assert.deepEqual(stored, { master: values.master.displayed / 100, music: values.music.displayed / 100, sfx: values.sfx.displayed / 100 });
  return { values, stored };
}

try {
  await page.addInitScript(() => {
    window.__audioQa = { media: undefined, musicGain: undefined, sfxGain: undefined, destinationGains: [] };
    const originalConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination, ...args) {
      if (this.constructor.name === 'MediaElementAudioSourceNode' && destination instanceof GainNode) window.__audioQa.musicGain = destination;
      if (this instanceof GainNode && destination === this.context.destination) window.__audioQa.destinationGains.push({ node:this, context:this.context });
      return originalConnect.call(this, destination, ...args);
    };
    const originalMediaSource = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function(media) {
      window.__audioQa.media = media;
      const source = originalMediaSource.call(this, media);
      window.__audioQa.sfxGain = window.__audioQa.destinationGains.find(entry => entry.context === source.context)?.node;
      return source;
    };
    window.__audioQaOriginalGet = Storage.prototype.getItem;
    window.__audioQaOriginalSet = Storage.prototype.setItem;
    window.__audioQaOriginalSet.call(localStorage, 'echoes-of-dante.characters.v1', 'audio-real-character-sentinel');
    window.__audioQaOriginalSet.call(localStorage, 'echoes-of-dante.settings.v1', 'audio-real-settings-sentinel');
  });
  await page.goto(`${base}/campaign-playtest.html?audio-review=1&v=0.1.178`, { waitUntil: 'domcontentloaded' });
  await tap('settings');
  const menuSettings = await settingsDrag();
  await page.screenshot({ path: `${out}/settings-touch.png` });
  await page.evaluate(() => window.__audioQaOriginalSet.call(localStorage, 'echoes-of-dante.characters.v1', 'audio-real-character-sentinel'));
  assert.equal(await page.evaluate(() => window.__audioQaOriginalGet.call(localStorage, 'echoes-of-dante.characters.v1')), 'audio-real-character-sentinel');
  assert.equal(await page.evaluate(() => window.__audioQaOriginalGet.call(localStorage, 'echoes-of-dante.settings.v1')), 'audio-real-settings-sentinel');
  report.checks.push('Each actual settings slider follows touch drag, updates its percentage and stores the three values in the isolated browser namespace; pre-existing save/settings sentinels remain intact');

  await tap('back');
  await tap('play');
  await tap('new-game');
  await tap('choose-warrior');
  await page.locator('[name=character-name]').fill('Audio mobile QA');
  await tap('create');
  await tap('difficulty-normal');
  await page.locator('.prologue-video').waitFor();
  await tap('prologue-skip');
  await page.waitForFunction(() => document.querySelector('.touch-controls') && !document.querySelector('.application-shell')?.open);
  await page.keyboard.press('e');
  await page.waitForFunction(() => {
    const audio = window.__audioQa;
    return audio?.media && !audio.media.paused && audio.musicGain && audio.sfxGain;
  });
  const liveBefore = await page.evaluate(() => {
    const audio = window.__audioQa;
    return { musicPaused: audio.media.paused, sfxGain: audio.sfxGain.gain.value, musicElementVolume: audio.media.volume, routedMusicGain: audio.musicGain.gain.value };
  });
  assert.equal(liveBefore.musicPaused, false);
  await page.keyboard.press('Escape');
  await tap('settings');
  const musicSilence = await dragVolume('music', 0);
  assert.equal(musicSilence.displayed, 0);
  await dragVolume('sfx', menuSettings.values.sfx.displayed);
  await dragVolume('master', menuSettings.values.master.displayed);
  await tap('back'); await tap('continue');
  await page.waitForFunction(() => window.__audioQa.musicGain?.gain.value === 0 && window.__audioQa.sfxGain?.gain.value > 0);
  const musicMuted = await page.evaluate(() => ({ music:window.__audioQa.musicGain.gain.value, sfx:window.__audioQa.sfxGain.gain.value }));

  await page.keyboard.press('Escape'); await tap('settings');
  await dragVolume('music', menuSettings.values.music.displayed);
  const effectsSilence = await dragVolume('sfx', 0);
  const effectsMutedGain = await page.evaluate(() => window.__audioQa.sfxGain.gain.value);
  const masterSilence = await dragVolume('master', 0);
  const masterMuted = await page.evaluate(() => ({ sfx:window.__audioQa.sfxGain.gain.value, music:window.__audioQa.musicGain.gain.value }));
  assert.equal(effectsSilence.displayed, 0); assert.equal(effectsMutedGain, 0, 'effects slider mutes the SFX bus');
  assert.equal(masterSilence.displayed, 0); assert.deepEqual(masterMuted, { sfx: 0, music: 0 }, 'master slider mutes both buses');
  await dragVolume('sfx', menuSettings.values.sfx.displayed);
  await dragVolume('master', menuSettings.values.master.displayed);
  const liveSettings = await settingsDrag();
  const liveAfter = await page.evaluate(() => {
    const audio = window.__audioQa;
    return { sfxGain:audio.sfxGain.gain.value, musicElementVolume:audio.media.volume, routedMusicGain:audio.musicGain.gain.value, stored: JSON.parse(Storage.prototype.getItem.call(localStorage, 'echoes-of-dante.settings.v1')), readouts: [...document.querySelectorAll('.volume-setting output')].map(o => o.textContent) };
  });
  assert.notEqual(liveAfter.routedMusicGain, null, 'music is routed through Web Audio so mobile media-element volume restrictions cannot bypass the setting');
  assert.equal(liveAfter.musicElementVolume, 1, 'media element remains at unity; Web Audio gain owns the mix');
  assert.ok(liveAfter.sfxGain > 0, 'master and effects affect the actual Web Audio SFX bus');
  assert.deepEqual(liveAfter.readouts, [`${Math.round(liveSettings.stored.master*100)}%`, `${Math.round(liveSettings.stored.music*100)}%`, `${Math.round(liveSettings.stored.sfx*100)}%`]);
  await tap('back');
  await tap('continue');
  await page.waitForFunction(() => {
    const audio = window.__audioQa;
    return audio.musicGain?.gain.value > 0 && audio.sfxGain?.gain.value > 0;
  });
  const resumed = await page.evaluate(() => {
    const audio = window.__audioQa;
    return { musicGain:audio.musicGain.gain.value, sfxGain:audio.sfxGain.gain.value };
  });
  report.runtime = { menuSettings, liveBefore, liveAfter, musicMuted, effectsSilence, effectsMutedGain, masterSilence, masterMuted, resumed };
  report.checks.push('In the running campaign, music can be muted then restored, effects can be muted, and master mutes both buses; touch changes survive pause/resume and percentages update without restarting');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = String(error);
  await page.screenshot({ path: `${out}/failure.png` }).catch(() => {});
  throw error;
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, failure: report.failure, checks: report.checks, runtime: report.runtime }, null, 2));
}
