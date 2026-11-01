import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.QA_BASE ?? 'http://127.0.0.1:5193', out = process.env.QA_OUT ?? 'docs/audio-recovery/qa/coop';
await mkdir(out, { recursive: true });
const browsers = [], pages = [], report = { at: new Date().toISOString(), base, method: 'Two separate Chrome mobile browsers; normal original crew creation and actual touch settings. Output sampled after actual music gains, wire observation only. No prerequisites, bosses, missions or rewards simulated.', checks: [], errors: [] };
const tap = (p, id) => p.locator(`[data-shell=${id}]`).tap();
async function createPage(master) {
  const b = await chromium.launch({ channel: 'chrome', args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] }); browsers.push(b);
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true }); pages.push(p); p.setDefaultTimeout(90000);
  await (await p.context().newCDPSession(p)).send('Emulation.setFocusEmulationEnabled', { enabled: true });
  p.on('pageerror', e => report.errors.push(e.message)); p.wire = {};
  p.on('websocket', ws => { for (const direction of ['framereceived', 'framesent']) ws.on(direction, ({ payload }) => { let m; try { m = JSON.parse(payload.toString()); } catch { return; } if (m.type === 'joined') p.wire.protocol = m.protocol; if (m.type === 'world') p.wire.world = m.world; }); });
  await p.addInitScript(master => {
    Element.prototype.requestFullscreen = undefined;
    Object.defineProperty(document, 'hidden', { get: () => false }); Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
    if (!sessionStorage['audio-coop-seeded']) {
      localStorage['echoes-of-dante.characters.v1'] = 'audio-coop-real-characters'; localStorage['echoes-of-dante.settings.v1'] = 'audio-coop-real-settings';
      sessionStorage['dante-audio-settings-review-v1.local.echoes-of-dante.settings.v1'] = JSON.stringify({ master, music: .48, sfx: .9 }); sessionStorage['audio-coop-seeded'] = '1';
    }
    window.__coopAudioRoutes = [];
    const create = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function(media) {
      const source = create.call(this, media), connect = source.connect;
      source.connect = function(gain, ...args) { const analyser = this.context.createAnalyser(); gain.connect(analyser); window.__coopAudioRoutes.push({ media, gain, analyser }); return connect.call(this, gain, ...args); }; return source;
    };
  }, master);
  return p;
}
async function createHero(p, cls, host) {
  await tap(p, `choose-${cls}`); await p.locator('[name=character-name]').fill(host ? 'Audio anfitrião' : 'Audio convidado'); await tap(p, 'create');
  if (host) { await p.locator('[name=party-size]').selectOption('2'); await tap(p, 'choose-difficulty'); await tap(p, 'difficulty-normal'); }
  await p.locator('.prologue-video').waitFor(); await tap(p, 'prologue-skip'); await p.locator('[name=coop-invite]').waitFor(); assert.equal(p.wire.protocol, 16);
}
async function settings(p, key, value) {
  await p.locator('.main-menu-button').tap(); await tap(p, 'settings'); const input = p.locator(`[data-volume=${key}]`); await input.scrollIntoViewIfNeeded();
  const r = await input.boundingBox(), cdp = await p.context().newCDPSession(p), from = r.x + 8 + (r.width - 16) * Number(await input.inputValue()) / 100, to = r.x + 8 + (r.width - 16) * value / 100, y = r.y + r.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y, id: 1 }] });
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + (to - from) * i / 6, y, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); assert.equal(Number(await input.inputValue()), value);
  await tap(p, 'back');
  if (await p.locator('.coop-chat.is-writing [data-chat=cancel]').isVisible()) {
    await p.locator('[data-chat=cancel]').tap(); report.chatDismissals = (report.chatDismissals ?? 0) + 1;
  }
  await tap(p, 'continue');
}
async function signal(p, audible) {
  await p.waitForFunction(() => {
    const r = [...window.__coopAudioRoutes].reverse().find(r => r.media.tagName === 'AUDIO');
    return r && r.media.readyState >= 3 && !r.media.paused && r.media.currentTime > .1 && r.gain.context.state === 'running';
  });
  await p.waitForTimeout(500);
  const result = await p.evaluate(async () => {
    const r = [...window.__coopAudioRoutes].reverse().find(r => r.media.tagName === 'AUDIO'); let peak = 0;
    for (let i = 0; i < 20; i++) { const data = new Float32Array(r.analyser.fftSize); r.analyser.getFloatTimeDomainData(data); for (const n of data) peak = Math.max(peak, Math.abs(n)); await new Promise(r => setTimeout(r, 50)); }
    return { gain: r.gain.gain.value, peak, muted: r.media.muted, context: r.gain.context.state };
  });
  assert.equal(result.context, 'running'); assert.equal(result.muted, false); assert.ok(audible ? result.peak > .00001 : result.peak === 0); return result;
}
try {
  const h = await createPage(0); await h.goto(base + '/campaign-playtest.html?audio-review=1&v=0.1.179'); await tap(h, 'play'); await tap(h, 'coop'); await tap(h, 'coop-new'); await createHero(h, 'warrior', true);
  console.log('Host created');
  const invite = await h.locator('[name=coop-invite]').inputValue(); assert.equal(new URL(invite).searchParams.get('audio-review'), '1');
  const g = await createPage(.65); await g.goto(invite); await createHero(g, 'hunter', false); await tap(h, 'coop-start');
  console.log('Guest joined and crew started');
  for (const p of pages) { await p.waitForFunction(() => document.querySelector('.touch-controls') && !document.querySelector('.application-shell')?.open); await p.locator('[data-action=attack]').tap(); await p.waitForFunction(() => window.__coopAudioRoutes.some(r => r.media.tagName === 'AUDIO')); }
  report.initial = { host: await signal(h, false), guest: await signal(g, true) };
  await settings(h, 'master', 80); report.restoredHost = { host: await signal(h, true), guest: await signal(g, true) };
  await settings(g, 'music', 0); report.mutedGuest = { host: await signal(h, true), guest: await signal(g, false) };
  await settings(g, 'music', 48); report.restoredGuest = await signal(g, true);
  report.checks.push('Host begins in zero, guest remains audible; restoring host and muting/restoring guest do not change the other participant output');
  for (const p of pages) {
    assert.equal(Object.keys(p.wire.world.players).length, 2); assert.deepEqual(p.wire.world.missions.accepted, []);
    assert.equal(await p.evaluate(() => localStorage['echoes-of-dante.characters.v1']), 'audio-coop-real-characters');
    assert.equal(await p.evaluate(() => localStorage['echoes-of-dante.settings.v1']), 'audio-coop-real-settings');
  }
  await h.locator('.main-menu-button').tap(); await tap(h, 'home'); await g.locator('[data-shell=coop-home]').waitFor();
  report.checks.push('Original two-person crew stays synchronized with no accepted missions or real data modified; room ends through host menu');
  report.protocols = pages.map(p => p.wire.protocol); assert.deepEqual(report.errors, []); report.passed = true;
} catch (e) { report.failure = String(e); for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${out}/failure-${i}.jpg`, type: 'jpeg', quality: 80 }).catch(() => {}); throw e; }
finally { await writeFile(out + '/report.json', JSON.stringify(report, null, 2) + '\n'); await Promise.all(browsers.map(b => b.close())); console.log(JSON.stringify(report, null, 2)); }
