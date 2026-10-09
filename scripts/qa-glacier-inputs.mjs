import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out = process.argv[2] ?? 'docs/glacier-expansion/input-qa'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { method: 'Chrome CDP touch gestures and generic Gamepad API mock; DEV chapter setup. No physical device claims.', errors: [] };
const watch = p => { p.on('pageerror', e => report.errors.push(e.message)); p.on('response', r => { if (r.status() >= 400) report.errors.push(r.url()); }); };
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const seed = async (p, area) => { await p.evaluate(async area => {
  const s = window.__danteGame.scene.getScene('Game'), { JOURNEY_FLAGS } = await import('/src/systems/LocalJourney.ts');
  for (const f of JOURNEY_FLAGS) s[f] = !f.startsWith('vesper');
  s.progression.restore({ xp: 1000, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'], sourceLocated: true, passageOpen: true, rewardedHollows: [], rewardedRoutes: [], bossRewards: ['soterrado'] });
  for (const id of ['saberArc','saberReach','chargeWidth','chargePower','dashCooldown','dashDuration']) while(s.progression.investUpgrade(id)) {}
  s.area = area; s.scene.restart();
}, area); await p.waitForTimeout(650); await ready(p); };
const st = p => p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return { p: { ...s.player.position }, phase: s.charge.phase, method: s.controls.inputMethod, dash: s.player.isDashing, firing: s.attack.pose(s.time.now, s.player.rotation).phase, attack: s.vesper?.attackName }; });
try {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const p = await context.newPage(); watch(p); await p.goto('http://localhost:5184/?qa=play'); await ready(p); await seed(p, 'icecave');
  const cdp = await context.newCDPSession(p);
  const box = await p.locator('.touch-move').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 38, y: cy - 15, id: 1 }] });
  const before = (await st(p)).p;
  await p.waitForTimeout(500); assert.ok((await st(p)).p.x > before.x + 45);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal((await st(p)).method, 'touch'); report.touchMovement = true;
  await p.locator('[data-action="attack"]').tap(); await p.waitForTimeout(100);
  assert.notEqual((await st(p)).firing, 'READY'); report.touchStrike = true;
  await p.waitForTimeout(500); await p.locator('[data-action="dash"]').tap(); await p.waitForTimeout(60);
  assert.ok((await st(p)).dash); report.touchDash = true;
  await p.waitForTimeout(400);
  const charge = await p.locator('[data-action="charge"]').boundingBox(), x = charge.x + charge.width / 2, y = charge.y + charge.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 2 }] });
  await p.waitForTimeout(700); assert.equal((await st(p)).phase, 'CHARGING');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 45, y: y - 30, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(70); assert.equal((await st(p)).phase, 'RELEASE'); report.touchHoldDragRelease = true;
  assert.equal(await p.evaluate(() => visualViewport.scale), 1);
  await p.screenshot({ path: `${out}/gallery-touch-844.png` });
  await seed(p, 'icenest'); await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position, { x: 1090, y: 1050 }); s.player.invulnerableUntil = Infinity; });
  await p.waitForTimeout(3300); await p.screenshot({ path: `${out}/vesper-touch-844.png` });
  report.touchBossVisible = true; await context.close();

  const q = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(q);
  await q.addInitScript(() => { window.qaPad = { mapping: 'standard', connected: true, index: 0, axes: [0,0,0,0], buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })) }; navigator.getGamepads = () => [window.qaPad]; });
  await q.goto('http://localhost:5184/?qa=play'); await ready(q); await seed(q, 'icecave');
  const origin = (await st(q)).p.x;
  await q.evaluate(() => { window.qaPad.axes = [1,0,1,0]; }); await q.waitForTimeout(550);
  assert.ok((await st(q)).p.x > origin + 60); assert.equal((await st(q)).method, 'gamepad'); report.gamepadMovementAim = true;
  await q.evaluate(() => { window.qaPad.axes = [0,0,1,0]; window.qaPad.buttons[7] = { value: 1, pressed: true }; }); await q.waitForTimeout(80);
  assert.notEqual((await st(q)).firing, 'READY'); report.gamepadAttack = true;
  await q.evaluate(() => { window.qaPad.buttons[7] = { value: 0, pressed: false }; }); await q.waitForTimeout(500);
  await q.evaluate(() => { window.qaPad.buttons[6] = { value: 1, pressed: true }; }); await q.waitForTimeout(650); assert.equal((await st(q)).phase, 'CHARGING');
  await q.evaluate(() => { window.qaPad.buttons[6] = { value: 0, pressed: false }; }); await q.waitForTimeout(70); assert.equal((await st(q)).phase, 'RELEASE'); report.gamepadChargeRelease = true;
  await q.waitForTimeout(500); await q.evaluate(() => { window.qaPad.buttons[5] = { value: 1, pressed: true }; }); await q.waitForTimeout(60); assert.ok((await st(q)).dash); report.gamepadDash = true;
  await q.close(); assert.deepEqual(report.errors, []); report.passed = true;
} finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
console.log(report);
