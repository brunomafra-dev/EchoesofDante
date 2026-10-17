import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.QA_BASE ?? 'http://localhost:5190';
const out = process.env.QA_OUT ?? 'docs/whole-body-actors/qa';
await mkdir(out, { recursive: true });
const report = { base, passed: false, checks: [], errors: [], warnings: [], humanApproval: 'pending' };
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
const p = await context.newPage();
p.on('pageerror', e => report.errors.push(e.message));
p.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') report.warnings.push(m.text()); });
await p.addInitScript(() => {
  localStorage.setItem('whole-body-save-sentinel', 'preserve'); sessionStorage.setItem('whole-body-save-sentinel', 'preserve');
  window.qaPad = { connected: false, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  Object.defineProperty(navigator, 'getGamepads', { value: () => [window.qaPad] });
});
const S = (fn, arg) => p.evaluate(({ fn, arg }) => new Function('s', 'arg', `return (${fn})(s,arg)`)(window.__wholeBodyLab.scene, arg), { fn: fn.toString(), arg });
try {
  await p.goto(`${base}/whole-body-playtest.html?v=0.1.110`);
  await p.waitForFunction(() => window.__wholeBodyLab?.scene?.whole?.image.active);
  assert.equal(await S(s => s.mode), 'whole');
  assert.deepEqual(await S(s => ({ rotation: s.whole.image.rotation, scaleX: s.whole.image.scaleX, scaleY: s.whole.image.scaleY, texture: s.whole.image.texture.key })), { rotation: 0, scaleX: .5, scaleY: .5, texture: 'whole-astral' });
  const frames = await S(s => {
    const results = [];
    for (let d = 0; d < 8; d++) for (let a = 0; a < 4; a++) {
      s.fixture = { direction: d, action: a };
      s.update(s.time.now, 16);
      results.push({ direction: d, action: a, frame: Number(s.whole.image.frame.name),
        rotation: s.whole.image.rotation, scaleX: s.whole.image.scaleX, scaleY: s.whole.image.scaleY,
        bottom: s.whole.image.y, feet: s.player.position.y + 39, parent: s.whole.image.parentContainer === null });
    }
    return results;
  });
  for (const f of frames) { assert.equal(f.frame, f.direction * 4 + f.action); assert.equal(f.rotation, 0); assert.equal(f.scaleX, f.scaleY); assert.equal(f.bottom, f.feet); assert.ok(f.parent); }
  report.checks.push('32 complete frames selectable; one upright Image, uniform scale, common foot anchor; no articulated candidate limbs');
  await S(s => { s.fixture = { direction: 1, action: 3 }; });
  await p.waitForTimeout(100);
  await p.screenshot({ path: `${out}/whole-cast-1280.png` });
  await p.locator('[data-mode=current]').click(); await p.waitForTimeout(100);
  assert.deepEqual(await S(s => ({ baseline: s.player.view.visible, whole: s.whole.image.visible })), { baseline: true, whole: false });
  await p.screenshot({ path: `${out}/current-cast-1280.png` });
  await p.locator('[data-mode=whole]').click(); await p.locator('#reset').click();
  const start = await S(s => ({ ...s.player.position }));
  await p.mouse.move(900, 550); await p.keyboard.down('d'); await p.waitForTimeout(280); await p.keyboard.up('d');
  const walked = await S(s => ({ ...s.player.position })); assert.ok(walked.x > start.x + 35 && walked.x < start.x + 110);
  assert.equal(await S(s => s.whole.image.rotation), 0);
  await p.locator('#reset').click();
  await p.mouse.move(900, 400);
  await p.mouse.click(900, 400);
  await p.waitForFunction(() => window.__wholeBodyLab.scene.combat.snapshot().shots.length > 0);
  await p.keyboard.down('q'); await p.waitForTimeout(420);
  assert.equal(await S(s => s.charge.phase), 'CHARGING');
  assert.equal(await S(s => Number(s.whole.image.frame.name) % 4), 3);
  await p.keyboard.up('q'); await p.waitForTimeout(50);
  assert.ok(await S(s => s.combat.energy < 100 && s.combat.snapshot().zones.length === 1));
  await p.waitForFunction(() => window.__wholeBodyLab.scene.charge.phase === 'READY');
  await p.keyboard.press('f', { delay: 90 });
  await p.waitForFunction(() => window.__wholeBodyLab.scene.combat.element === 'fire');
  await p.keyboard.press('Space', { delay: 50 }); await p.waitForFunction(() => window.__wholeBodyLab.scene.player.isDashing);
  report.checks.push('Actual keyboard WASD, continuous mouse aim, basic projectile, Q hold/release with resource/zone, element switch and Dash use existing classes');
  const counts = () => S(s => ({ objects: s.children.length, textures: s.textures.getTextureKeys().length, tweens: s.tweens.getTweens().length, shutdownListeners: s.events.listenerCount('shutdown'), touch: document.querySelectorAll('.touch-controls').length }));
  await p.waitForTimeout(600); const before = await counts();
  for (let i = 0; i < 6; i++) { await p.locator('[data-mode=current]').click(); await p.locator('[data-mode=whole]').click(); await p.locator('#reset').click(); }
  await p.waitForTimeout(600); const after = await counts(); assert.deepEqual(after, before);
  report.stability = { before, after }; report.checks.push('Six A/B/reset cycles preserve objects, textures, tweens, shutdown listeners and one touch root');
  await p.locator('#zoom').click(); assert.equal(await S(s => s.cameras.main.zoom), 1.8);
  await S(s => { s.fixture = { direction: 0, action: 3 }; }); await p.waitForTimeout(100);
  await p.screenshot({ path: `${out}/whole-front-enlarged.png` });
  await p.locator('[data-mode=current]').click(); await p.waitForTimeout(100);
  await p.screenshot({ path: `${out}/current-front-enlarged.png` });
  await p.locator('[data-mode=whole]').click(); await p.locator('#zoom').click(); await p.locator('#reset').click();
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await p.setViewportSize({ width, height }); await p.waitForTimeout(150);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await p.screenshot({ path: `${out}/whole-${width}.png` });
  }
  await S(s => s.reset());
  await p.evaluate(() => { window.qaPad.connected = true; window.qaPad.axes = [1, 0, 0, -1]; });
  const padBefore = await S(s => s.player.position.x); await p.waitForTimeout(250); assert.ok(await S(s => s.player.position.x) > padBefore + 25);
  await p.evaluate(() => { window.qaPad.axes = [0, 0, 0, -1]; window.qaPad.buttons[6].value = 1; });
  await p.waitForTimeout(250); assert.equal(await S(s => s.charge.phase), 'CHARGING');
  await p.evaluate(() => { window.qaPad.buttons[6].value = 0; }); await p.waitForTimeout(80);
  assert.ok(await S(s => s.combat.energy < 100));
  await p.evaluate(() => { window.qaPad.connected = false; });
  // Real browser touch produces a valid pointer capture for the unchanged controls.
  await p.locator('#reset').click();
  await p.touchscreen.tap(420, 230);
  await p.locator('[data-action=attack]').waitFor({ state: 'visible' });
  await p.locator('[data-action=attack]').tap();
  await p.waitForFunction(() => window.__wholeBodyLab.scene.combat.snapshot().shots.length > 0);
  assert.equal(await S(s => s.controls.inputMethod), 'touch');
  report.checks.push('Gamepad mock axes and LT hold/release; existing touch attack gesture; four responsive resolutions');
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.locator('#reset').click(); await p.waitForTimeout(2600); report.observedUpdatesPerSecond = await S(s => s.measuredFps);
  assert.ok(report.observedUpdatesPerSecond > 45);
  assert.deepEqual(await p.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), { local: { 'whole-body-save-sentinel': 'preserve' }, session: { 'whole-body-save-sentinel': 'preserve' } });
  assert.deepEqual(report.errors, []); assert.deepEqual(report.warnings, []);
  report.checks.push('No campaign saves/relay; storage sentinels untouched; zero JS/asset/texture warnings');
  const main = await context.newPage();
  const mainErrors = [], prototypeRequests = [];
  main.on('pageerror', e => mainErrors.push(e.message));
  main.on('request', r => { if (r.url().includes('/experiments/whole-body/') || r.url().includes('/assets/wholeBody-')) prototypeRequests.push(r.url()); });
  await main.goto(`${base}/`);
  await main.locator('.application-shell').waitFor({ state: 'visible' });
  await main.getByRole('button', { name: 'JOGAR', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await main.evaluate(() => window.__wholeBodyLab), undefined);
  assert.deepEqual(mainErrors, []); assert.deepEqual(prototypeRequests, []);
  report.checks.push('Main menu opens in compiled build without lab handle or prototype assets; no main JS errors');
  await main.close();
  report.passed = true;
} catch (e) { report.failure = String(e); report.stateAtFailure = await S(s => ({ phase: s.charge.phase, element: s.combat.element, input: s.controls.inputMethod, activeElement: document.activeElement?.outerHTML.slice(0, 160), keys: Object.fromEntries(Object.entries(s.controls.keys).map(([k,v]) => [k,{down:v.isDown,justDown:v._justDown}])) })).catch(() => undefined); throw e; }
finally { await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
