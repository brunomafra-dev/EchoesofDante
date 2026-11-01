import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.QA_BASE ?? 'http://127.0.0.1:5185';
const out = process.env.QA_OUT ?? 'docs/audio-recovery/qa/dev';
const lockedMediaVolume = process.env.QA_LOCK_MEDIA_VOLUME === '1';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
page.setDefaultTimeout(90000);
const report = { at: new Date().toISOString(), base, lockedMediaVolume, method: 'Actual isolated client, normal creation, touch sliders; analyser taps observe output after actual gains. Malformed invitation fixture and real-storage sentinels; no DEV globals or boss/progress simulation. Optional ignored native volume setter is a compatibility simulation, not a physical iPhone.', checks: [], errors: [], samples: {} };
page.on('pageerror', e => report.errors.push(e.message));
const tap = id => page.locator(`[data-shell="${id}"]`).tap();
const cdp = await page.context().newCDPSession(page);

async function drag(key, target) {
  const input = page.locator(`[data-volume="${key}"]`);
  await input.scrollIntoViewIfNeeded();
  const r = await input.boundingBox(), current = Number(await input.inputValue());
  const from = r.x + 8 + (r.width - 16) * current / 100, to = r.x + 8 + (r.width - 16) * target / 100, y = r.y + r.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y, id: 1 }] });
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + (to - from) * i / 6, y, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(Math.abs(Number(await input.inputValue()) - target) <= 1, `${key} touch ${target}`);
}

async function sample(name, kind, expected) {
  await page.waitForFunction(kind => {
    const route = [...window.__audioRecovery.routes].reverse().find(r => r.media.tagName.toLowerCase() === (kind === 'sfx' ? 'audio' : kind));
    return route && route.media.readyState >= 3 && !route.media.paused && route.media.currentTime > .1 && route.gain.context.state === 'running';
  }, kind);
  await page.waitForTimeout(350);
  const value = await page.evaluate(async kind => {
    const q = window.__audioRecovery;
    const route = [...q.routes].reverse().find(r => r.media.tagName.toLowerCase() === (kind === 'sfx' ? 'audio' : kind));
    if (!route) throw new Error(`No ${kind} media route`);
    const bus = kind === 'sfx' ? q.buses.find(b => b.gain.context === route.gain.context && b.gain !== route.gain) : route;
    let peak = 0;
    for (let i = 0; i < 24; i++) {
      const data = new Float32Array(bus.analyser.fftSize); bus.analyser.getFloatTimeDomainData(data);
      for (const n of data) peak = Math.max(peak, Math.abs(n));
      await new Promise(r => setTimeout(r, 50));
    }
    return { gain: bus.gain.gain.value, peak, muted: route.media.muted, volume: route.media.volume, paused: route.media.paused, currentTime: route.media.currentTime, context: bus.gain.context.state };
  }, kind);
  report.samples[name] = value;
  console.log(name, JSON.stringify(value));
  assert.equal(value.context, 'running', `${name} running context`);
  assert.equal(value.muted, false, `${name} no residual native mute`);
  assert.equal(value.volume, 1, `${name} media unity`);
  if (expected === 'silent') { assert.equal(value.gain, 0, name); assert.equal(value.peak, 0, `${name} actual silence`); }
  else assert.ok(value.gain > 0 && value.peak > 0.00001, `${name} actual signal: ${JSON.stringify(value)}`);
  return value;
}

async function gameSettings() { await page.locator('.main-menu-button').tap(); await tap('settings'); }
async function resumeGame() { await tap('back'); await tap('continue'); }

try {
  if (lockedMediaVolume) await page.addInitScript(() => Object.defineProperty(HTMLMediaElement.prototype, 'volume', { configurable: true, get: () => 1, set: () => {} }));
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = undefined;
    const rawSet = Storage.prototype.setItem, rawGet = Storage.prototype.getItem;
    window.__audioRecovery = { routes: [], buses: [], rawGet };
    if (!rawGet.call(sessionStorage, 'audio-recovery-seeded')) {
      rawSet.call(localStorage, 'echoes-of-dante.characters.v1', 'audio-recovery-real-characters');
      rawSet.call(localStorage, 'echoes-of-dante.settings.v1', 'audio-recovery-real-settings');
      rawSet.call(sessionStorage, 'dante-audio-settings-review-v1.local.echoes-of-dante.settings.v1', JSON.stringify({ master: 0, music: .48, sfx: .9 }));
      rawSet.call(sessionStorage, 'dante-audio-settings-review-v1.session.echoes-of-dante.invite-character-once', '{broken');
      rawSet.call(sessionStorage, 'audio-recovery-seeded', '1');
    }
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination, ...args) {
      if (this instanceof GainNode && destination === this.context.destination) {
        const analyser = this.context.createAnalyser(); analyser.fftSize = 2048; connect.call(this, analyser);
        window.__audioRecovery.buses.push({ gain: this, analyser });
      }
      return connect.call(this, destination, ...args);
    };
    const create = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function(media) {
      const source = create.call(this, media), original = source.connect;
      source.connect = function(gain, ...args) {
        const analyser = this.context.createAnalyser(); analyser.fftSize = 2048; connect.call(gain, analyser);
        window.__audioRecovery.routes.push({ media, gain, analyser });
        return original.call(this, gain, ...args);
      };
      return source;
    };
  });
  await page.goto(`${base}/campaign-playtest.html?audio-review=1&v=0.1.179`);
  await tap('settings');
  assert.equal(await page.locator('[data-volume=master]').inputValue(), '0', 'valid settings survive malformed invitation');
  report.checks.push('Malformed invitation does not discard valid persisted zero volume');
  report.worldAtMenu = await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /world-finish|route-identity/.test(e.name)).map(e => e.name));
  assert.deepEqual(report.worldAtMenu, [], 'audio lab defers world textures like the official menu');
  await tap('back'); await tap('play'); await tap('new-game'); await tap('choose-warrior');
  await page.locator('[name=character-name]').fill('Audio recovery QA'); await tap('create'); await tap('difficulty-normal');
  await page.locator('.prologue-video').waitFor();
  await page.waitForFunction(() => window.__audioRecovery.routes.some(r => r.media.tagName === 'VIDEO' && !r.media.paused && r.media.currentTime > .2));
  await sample('filmStartsAtZero', 'video', 'silent');
  assert.equal(await page.locator('[data-shell=prologue-sound]').textContent(), 'VOLUME EM ZERO');
  await page.screenshot({ path: `${out}/film-zero.jpg`, type: 'jpeg', quality: 85 });
  await tap('settings'); await drag('master', 80); await tap('back');
  await sample('filmRestores', 'video', 'audible');
  await tap('settings'); await drag('music', 0); await tap('back');
  await sample('filmMusicMutes', 'video', 'silent');
  assert.equal(await page.locator('[data-shell=prologue-sound]').textContent(), 'VOLUME EM ZERO');
  await tap('settings'); await drag('music', 48); await tap('back');
  await sample('filmMusicRestores', 'video', 'audible');
  await tap('prologue-sound'); await sample('filmManualMute', 'video', 'silent');
  await tap('settings'); await drag('master', 65); await tap('back');
  await sample('filmManualMuteSurvivesSettings', 'video', 'silent');
  await tap('prologue-sound'); await sample('filmManualRestore', 'video', 'audible');
  await tap('settings'); await drag('sfx', 0); await tap('back');
  await sample('filmUnaffectedBySfx', 'video', 'audible');
  await tap('prologue-pause');
  assert.equal(await page.locator('.prologue-video').evaluate(v => v.paused), true);
  await tap('prologue-pause'); await sample('filmPauseResume', 'video', 'audible');
  await tap('settings'); await drag('master', 0); await drag('sfx', 90); await tap('back');
  await sample('filmMasterMutes', 'video', 'silent'); await tap('prologue-skip');
  report.filmContextAfterSkip = await page.evaluate(() => window.__audioRecovery.routes.find(r => r.media.tagName === 'VIDEO').gain.context.state);
  assert.equal(report.filmContextAfterSkip, 'closed', 'skipping film releases its context');
  await page.waitForFunction(() => document.querySelector('.touch-controls') && !document.querySelector('.application-shell')?.open);
  await page.locator('[data-action=attack]').tap();
  await page.waitForFunction(() => window.__audioRecovery.routes.some(r => r.media.tagName === 'AUDIO' && r.gain.context.state === 'running'));
  await sample('musicStartsAtZero', 'audio', 'silent');
  await gameSettings(); await drag('master', 80); await resumeGame();
  await sample('musicRestoresFromZero', 'audio', 'audible');
  report.checks.push('Film and music start at zero, restore measured output, and keep native media unmuted after routing; film manual mute survives settings, pause/resume and SFX changes');
  await gameSettings(); await drag('music', 0); await resumeGame();
  await sample('musicOnlyMute', 'audio', 'silent');
  // Repeated actual attacks produce SFX while the music bus remains silent.
  await page.locator('[data-action=attack]').tap();
  const attackTimer = setInterval(() => page.locator('[data-action=attack]').tap().catch(() => {}), 220);
  try { await sample('sfxWithMusicZero', 'sfx', 'audible'); } finally { clearInterval(attackTimer); }
  await gameSettings(); await drag('music', 48); await drag('sfx', 0); await resumeGame();
  await sample('musicWithSfxZero', 'audio', 'audible');
  await page.locator('[data-action=attack]').tap(); await sample('sfxOnlyMute', 'sfx', 'silent');
  await gameSettings(); await drag('master', 0); await resumeGame();
  await sample('masterMutesMusic', 'audio', 'silent'); await sample('masterMutesSfx', 'sfx', 'silent');
  await gameSettings(); await drag('master', 80); await drag('sfx', 90);
  await page.screenshot({ path: `${out}/settings-touch.jpg`, type: 'jpeg', quality: 85 }); await resumeGame();
  await sample('musicFinalRestore', 'audio', 'audible');
  await page.reload();
  await tap('play'); await tap('continue'); await tap('play-character');
  await page.waitForFunction(() => document.querySelector('.touch-controls') && !document.querySelector('.application-shell')?.open);
  await page.locator('[data-action=attack]').tap();
  await page.waitForFunction(() => window.__audioRecovery.routes.some(r => r.media.tagName === 'AUDIO'));
  await sample('musicAfterReload', 'audio', 'audible');
  await gameSettings();
  report.reloadSettings = await page.locator('[data-volume]').evaluateAll(inputs => Object.fromEntries(inputs.map(i => [i.dataset.volume, i.value])));
  assert.deepEqual(report.reloadSettings, { master: '80', music: '48', sfx: '90' });
  await page.locator('[data-volume=master]').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('[data-volume=master]').inputValue(), '79', 'keyboard range adjustment');
  await page.evaluate(() => {
    window.__audioPad = { connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
    navigator.getGamepads = () => [window.__audioPad];
  });
  await page.evaluate(() => { window.__audioPad.buttons[15] = { pressed: true, value: 1 }; });
  await page.waitForTimeout(160);
  await page.evaluate(() => { window.__audioPad.buttons[15] = { pressed: false, value: 0 }; });
  assert.equal(await page.locator('[data-volume=master]').inputValue(), '84', 'gamepad range adjustment');
  await drag('master', 80);
  report.realStorage = await page.evaluate(() => ({ characters: window.__audioRecovery.rawGet.call(localStorage, 'echoes-of-dante.characters.v1'), settings: window.__audioRecovery.rawGet.call(localStorage, 'echoes-of-dante.settings.v1') }));
  assert.deepEqual(report.realStorage, { characters: 'audio-recovery-real-characters', settings: 'audio-recovery-real-settings' });
  report.checks.push('Music, SFX and master independently silence actual output; repeated restore and reload retain settings and sound; real save/settings sentinels unchanged');
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (e) {
  report.failure = String(e); await page.screenshot({ path: `${out}/failure.jpg`, type: 'jpeg', quality: 85 }).catch(() => {}); throw e;
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n'); await browser.close();
  console.log(JSON.stringify({ passed: report.passed, failure: report.failure, checks: report.checks, samples: report.samples }, null, 2));
}
