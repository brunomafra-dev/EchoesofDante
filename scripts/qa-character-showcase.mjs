import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out = process.argv[2] ?? 'docs/character-showcase/qa'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { method: 'Chrome headless; actual creation/selection; keyboard, touch emulation, standard gamepad mock; controlled DEV dash integration; no physical devices', errors: [] };
const watch = p => { p.on('pageerror', e => report.errors.push(e.message)); p.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); }); };
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const p = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(p);
const snapshot = () => p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return { classId: s.classId, xp: s.progression.xp, paused: s.scene.isPaused(), objects: s.children.list.length, tweens: s.tweens.getTweens().length }; });
const dash = () => p.evaluate(() => {
  const s = window.__danteGame.scene.getScene('Game'), player = s.player, result = {};
  const saved = { p: { ...player.position }, last: player.lastDashAt, invulnerable: player.invulnerableUntil, ranks: player.upgradeRank };
  const sample = (obstacles, bounds) => {
    Object.assign(player.position, { x: 700, y: 800 }); player.lastDashAt = -Infinity; player.startDash(100000, { x: 1, y: 0 });
    for (let t = 0; t < player.dashDuration; t += 5) player.update(100000 + t, .005, { x: 0, y: 0 }, 0, obstacles, s.attack.pose(100000, 0), { phase: 'READY', level: 0, swingProgress: 0 }, bounds);
    player.update(100000 + player.dashDuration, 0, { x: 0, y: 0 }, 0, obstacles, s.attack.pose(100000, 0), { phase: 'READY', level: 0, swingProgress: 0 }, bounds);
    return player.position.x - 700;
  };
  result.duration = player.dashDuration; result.cooldown = player.dashCooldown; result.distance = sample([]);
  result.blockedDistance = sample([{ x: 800, y: 800, radius: 40 }]);
  player.upgradeRank = id => id === 'dashDuration' ? 1 : 0; result.upgradedDuration = player.dashDuration; result.upgradedDistance = sample([]);
  player.upgradeRank = saved.ranks; player.lastDashAt = saved.last; player.invulnerableUntil = saved.invulnerable; player.isDashing = false; Object.assign(player.position, saved.p);
  return result;
});
try {
  await p.goto('http://localhost:5184/'); await ready(p);
  await p.locator('[data-shell="characters"]').click(); assert.equal(await p.locator('[data-shell="new-character"]').isVisible(), true);
  report.warriorDash = await dash(); assert.equal(report.warriorDash.duration, 175); assert.ok(Math.abs(report.warriorDash.distance - 133) < .1);
  await p.locator('[data-shell="new-character"]').click();
  assert.equal(await p.locator('.class-display').count(), 4); assert.equal(await p.locator('.class-future:disabled').count(), 2);
  assert.ok(await p.locator('[data-shell="create"]').isDisabled()); assert.ok(await p.locator('[name="character-name"]').isDisabled());
  await p.locator('[data-class="warrior"]').click(); await p.locator('[name="character-name"]').fill('Luz de Dante');
  await p.locator('[data-class="hunter"]').click(); assert.equal(await p.locator('[name="character-name"]').inputValue(), 'Luz de Dante');
  await p.waitForFunction(() => document.querySelector('[data-class="hunter"] canvas').dataset.demoPhase === 'attack');
  await p.screenshot({ path: `${out}/hunter-attack.png` });
  for (const phase of ['dash', 'charge', 'release', 'idle']) await p.waitForFunction(phase => document.querySelector('[data-class="hunter"] canvas').dataset.demoPhase === phase, phase);
  report.finiteDemo = true;
  for (const [width, height] of [[1280,720], [1366,768], [1920,1080], [844,390], [640,360], [390,844]]) {
    await p.setViewportSize({ width, height }); await p.waitForTimeout(120);
    assert.ok(await p.locator('.class-gallery').evaluate(e => e.getBoundingClientRect().right <= innerWidth));
    if (width > height) assert.ok(await p.locator('[data-shell="create"]').evaluate(e => e.getBoundingClientRect().bottom <= innerHeight), `Create clipped at ${width}x${height}`);
    await p.screenshot({ path: `${out}/creation-${width}x${height}.png` });
  }
  await p.setViewportSize({ width: 1280, height: 720 });
  const before = await snapshot();
  for (let i = 0; i < 3; i++) {
    await p.locator('[data-shell="back"]').click(); await p.locator('[data-shell="new-character"]').click();
    await p.locator('[data-class="hunter"]').click(); await p.waitForTimeout(80);
  }
  assert.deepEqual(await snapshot(), before); report.menuCyclesStable = true;
  await p.locator('[name="character-name"]').fill('Luz de Dante');
  // A rapid double activation must not create two profiles while reloading.
  await p.locator('[data-shell="create"]').evaluate(b => { b.click(); b.click(); });
  await p.waitForTimeout(900); await ready(p); assert.equal((await snapshot()).classId, 'hunter'); assert.equal((await snapshot()).paused, false);
  assert.equal(await p.locator('.application-shell').evaluate(e => e.open), false); report.creationLaunchesDirectly = true;
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters.length),2); report.doubleActivationSafe=true;
  await p.keyboard.press('Escape'); await p.locator('[data-shell="characters"]').click();
  report.hunterDash = await dash(); assert.equal(report.hunterDash.duration, 240); assert.equal(report.hunterDash.cooldown,1450);
  assert.ok(Math.abs(report.hunterDash.distance - 182.4) < .1); assert.equal(report.hunterDash.upgradedDuration,260); assert.ok(report.hunterDash.blockedDistance < 60);
  await p.locator('[data-shell="character-legacy-warrior"]').click(); assert.equal((await snapshot()).classId,'hunter');
  await p.waitForTimeout(450); await p.screenshot({path:`${out}/saved-characters.png`});
  await p.locator('[data-shell="back"]').click(); await p.locator('[data-shell="continue"]').click(); assert.equal((await snapshot()).classId,'hunter'); report.previewDoesNotSwitch = true;
  await p.keyboard.press('Escape'); await p.locator('[data-shell="characters"]').click(); await p.locator('[data-shell="character-legacy-warrior"]').click(); await p.locator('[data-shell="play-character"]').click();
  await p.waitForTimeout(900); await ready(p); assert.equal((await snapshot()).classId,'warrior'); assert.equal((await snapshot()).paused,false); report.confirmedSelection = true;
  await p.keyboard.press('Escape'); await p.locator('[data-shell="characters"]').click(); await p.locator('[data-shell="new-character"]').click();
  await p.evaluate(() => { window.pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))}; navigator.getGamepads=()=>[window.pad]; });
  await p.locator('[data-class="warrior"]').focus(); await p.evaluate(()=>window.pad.buttons[15].value=1); await p.waitForTimeout(100); await p.evaluate(()=>window.pad.buttons[15].value=0);
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.class),'hunter');
  await p.evaluate(()=>window.pad.buttons[0].value=1); await p.waitForTimeout(100); await p.evaluate(()=>window.pad.buttons[0].value=0);
  assert.equal(await p.locator('[data-class="hunter"]').getAttribute('aria-pressed'),'true'); report.gamepadSelection = true;
  await p.locator('[data-class="warrior"]').focus(); await p.keyboard.press('Enter'); assert.equal(await p.locator('[data-class="warrior"]').getAttribute('aria-pressed'),'true'); report.keyboardSelection=true;
  const mobile=await browser.newContext({isMobile:true,hasTouch:true,viewport:{width:844,height:390}}), t=await mobile.newPage(); watch(t);
  await t.goto('http://localhost:5184/'); await ready(t); await t.locator('[data-shell="characters"]').tap(); await t.locator('[data-shell="new-character"]').tap(); await t.locator('[data-class="hunter"]').tap(); await t.locator('[name="character-name"]').fill('Hunter Touch');
  await t.locator('[data-shell="create"]').tap(); await t.waitForTimeout(900); await ready(t); assert.equal(await t.evaluate(()=>window.__danteGame.scene.getScene('Game').classId),'hunter'); assert.equal(await t.evaluate(()=>visualViewport.scale),1);
  await t.locator('.main-menu-button').tap(); assert.equal(await t.locator('.application-shell').evaluate(e=>e.open),true); report.touchCreation=true; await mobile.close();
  await p.emulateMedia({ reducedMotion:'reduce' }); await p.reload(); await ready(p); await p.locator('[data-shell="characters"]').click(); await p.locator('[data-shell="new-character"]').click(); await p.locator('[data-class="hunter"]').click(); await p.waitForTimeout(1100);
  assert.equal(await p.locator('[data-class="hunter"] canvas').getAttribute('data-demo-phase'),'idle');
  await p.locator('[data-shell="replay"]').click(); await p.waitForFunction(()=>document.querySelector('[data-class="hunter"] canvas').dataset.demoPhase==='attack'); report.reducedMotion=true;
  assert.deepEqual(report.errors,[]); report.passed=true;
} finally { await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); await browser.close(); }
console.log(report);
