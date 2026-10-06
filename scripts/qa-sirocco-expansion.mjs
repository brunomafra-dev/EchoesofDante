// Browser QA for the new post-mission biome. DEV positioning shortens the old route.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/expansion-sprint-04/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const report = { method: 'Chrome headless; DEV progression/position setup, real keyboard input and Gamepad API mock; no physical device', errors };
const watch = page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
};
const ready = page => page.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view?.active);
const state = page => page.evaluate(() => {
  const game = window.__danteGame, scene = game.scene.getScene('Game');
  return { area: scene.area, position: { ...scene.player.position }, hp: scene.player.hp, maxHp: scene.player.maxHp,
    xp: scene.progression.xp, level: scene.progression.level, echoes: scene.progression.echoes.size,
    upgradeRanks: { ...scene.progression.abilityUpgradeRanks }, upgradePoints: scene.progression.upgradePointsAvailable,
    missionComplete: scene.valleyFrontierEndSeen, portal: scene.chapterPortal?.active,
    aridVisited: scene.aridVisited, signalSeen: scene.aridSignalSeen, enemies: scene.enemies.filter(e => !e.isDead).length,
    kinds: [...new Set(scene.enemies.filter(e => !e.isDead).map(e => e.kind))],
    objects: scene.children.list.length, renderTextures: scene.children.list.filter(o => o.type === 'RenderTexture').length,
    tweens: scene.tweens.getTweens().length, text: scene.hud.discoveryMessage.text, dead: scene.player.isDead,
    rewarded: scene.progression.snapshot().rewardedHollows,
    visibleCombatXp: scene.children.list.filter(o => o.type === 'Text' && o.visible && /^\+\d+ XP$/.test(o.text)).length };
});
const chooseUpgrade = async (page, id) => {
  await page.locator('.ability-upgrade-dialog[open]').waitFor();
  await page.locator(`[data-upgrade="${id}"]:not(:disabled)`).click();
  await page.waitForFunction(() => !document.querySelector('.ability-upgrade-dialog[open]'));
};
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  watch(page);
  await page.goto(base);
  await ready(page);
  const key = async (value, ms = 100) => {
    await page.keyboard.down(value); await page.waitForTimeout(ms); await page.keyboard.up(value); await page.waitForTimeout(140);
  };
  const position = async (x, y) => {
    await page.evaluate(({ x, y }) => {
      const scene = window.__danteGame.scene.getScene('Game');
      Object.assign(scene.player.position, { x, y });
      scene.player.view.setPosition(x, y).setDepth(y);
    }, { x, y });
    await page.waitForTimeout(100);
  };
  const walkTo = async (targetX, targetY) => {
    for (let step = 0; step < 320; step++) {
      const p = (await state(page)).position, dx = targetX - p.x, dy = targetY - p.y;
      if (Math.hypot(dx, dy) < 18) return;
      const keys = [];
      if (Math.abs(dx) > 7) keys.push(dx > 0 ? 'd' : 'a');
      if (Math.abs(dy) > 7) keys.push(dy > 0 ? 's' : 'w');
      for (const value of keys) await page.keyboard.down(value);
      await page.waitForTimeout(Math.min(75, Math.max(24, Math.hypot(dx, dy) / 245 * 1000)));
      for (const value of keys) await page.keyboard.up(value);
    }
    throw new Error(`Blocked walk to ${targetX},${targetY}: ${JSON.stringify((await state(page)).position)}`);
  };
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.progression.restore({ xp: 345, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'],
      sourceLocated: true, passageOpen: true, rewardedHollows: [], rewardedRoutes: [] });
    scene.area = 'valley'; scene.wardenDefeated = true; scene.wardenGateOpen = true;
    scene.deepPassageOpen = true; scene.firstEchoSeen = true; scene.valleyVisited = true; scene.valleyFrontierReached = true;
    scene.valleyFrontierSignalSeen = true; scene.valleyFrontierEndSeen = false;
    scene.aridVisited = false; scene.aridSignalSeen = false;
    scene.saveProgress(); scene.scene.restart();
  });
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'valley');
  await page.waitForTimeout(450);
  await position(4920, 795);
  await page.waitForFunction(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    return scene.valleyFrontierEndSeen && scene.chapterPortal?.active;
  });
  let current = await state(page);
  assert.match(current.text, /MISSÃO CONCLUÍDA/i);
  report.missionComplete = { shown: true, portalOpened: current.portal };
  await page.screenshot({ path: `${out}/mission-complete.png` });

  await position(5050, 795);
  await page.screenshot({ path: `${out}/chapter-portal.png` });
  await key('e');
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'arid');
  await page.waitForTimeout(750);
  current = await state(page);
  assert.equal(current.aridVisited, true);
  assert.equal(current.enemies, 6);
  assert.ok(current.kinds.includes('dunePouncer') && current.kinds.includes('glassSpitter'));
  assert.ok(current.renderTextures >= 3);
  report.siroccoEntry = current;
  await page.screenshot({ path: `${out}/sirocco-entry.png` });
  report.siroccoLayouts = [];
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const canvas = await page.locator('canvas').boundingBox();
    assert.ok(canvas.width <= width + 1 && canvas.height <= height + 1);
    report.siroccoLayouts.push(`${width}x${height}`);
    if (width === 844) await page.screenshot({ path: `${out}/sirocco-mobile-landscape.png` });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  // Exercise the two distinct new attack tells with live enemy updates.
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.player.invulnerableUntil = Infinity;
    for (const enemy of scene.enemies) { enemy.qaUpdate = enemy.update; enemy.update = () => {}; }
    const pouncer = scene.enemies.find(enemy => enemy.kind === 'dunePouncer');
    Object.assign(pouncer.position, { x: 1000, y: 900 }); pouncer.home = { x: 1000, y: 900 };
    pouncer.state = 'IDLE'; pouncer.attackAt = -Infinity; pouncer.hurtUntil = 0; pouncer.committed = false;
    pouncer.health.current = pouncer.health.max; pouncer.update = pouncer.qaUpdate;
    Object.assign(scene.player.position, { x: 1045, y: 900 }); scene.player.view.setPosition(1045, 900);
  });
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').enemies.find(enemy => enemy.kind === 'dunePouncer').state === 'WINDUP');
  report.pouncerWindup = await page.evaluate(() => {
    const enemy = window.__danteGame.scene.getScene('Game').enemies.find(item => item.kind === 'dunePouncer');
    return { upright: enemy.view.rotation === 0, named: enemy.name.visible };
  });
  assert.ok(report.pouncerWindup.upright && report.pouncerWindup.named);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').enemies.find(enemy => enemy.kind === 'dunePouncer').state === 'LUNGE');
  report.pouncerTellAndLunge = await page.evaluate(() => {
    const enemy = window.__danteGame.scene.getScene('Game').enemies.find(item => item.kind === 'dunePouncer');
    const result = { upright: enemy.view.rotation === 0, state: enemy.state };
    enemy.update = () => {};
    return result;
  });
  assert.ok(report.pouncerTellAndLunge.upright && report.pouncerTellAndLunge.state === 'LUNGE');
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game'), enemy = scene.enemies.find(item => item.kind === 'glassSpitter');
    Object.assign(enemy.position, { x: 1500, y: 900 }); enemy.home = { x: 1500, y: 900 };
    enemy.state = 'IDLE'; enemy.attackAt = -Infinity; enemy.hurtUntil = 0; enemy.shot = undefined;
    enemy.health.current = enemy.health.max; enemy.update = enemy.qaUpdate;
    Object.assign(scene.player.position, { x: 1740, y: 900 }); scene.player.view.setPosition(1740, 900);
  });
  await page.waitForFunction(() => {
    const enemy = window.__danteGame.scene.getScene('Game').enemies.find(item => item.kind === 'glassSpitter');
    return enemy.state === 'WINDUP' && enemy.aimGuide.visible;
  });
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').enemies.find(enemy => enemy.kind === 'glassSpitter').projectile.visible, { timeout: 1800 });
  report.glassSpitterTellAndShot = true;
  await page.evaluate(() => { window.__danteGame.scene.getScene('Game').enemies.find(enemy => enemy.kind === 'glassSpitter').update = () => {}; });
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.enemies.forEach(enemy => { enemy.update = () => {}; });
    window.qaPad = { connected: true, mapping: 'standard', axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ value: 0, pressed: false })) };
    navigator.getGamepads = () => [window.qaPad];
  });
  await page.waitForTimeout(200);
  const beforeGamepad = (await state(page)).position.x;
  await page.evaluate(() => { window.qaPad.axes[0] = 1; });
  await page.waitForTimeout(350);
  assert.ok((await state(page)).position.x > beforeGamepad + 25);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').controls.inputMethod), 'gamepad');
  await page.evaluate(() => { window.qaPad.axes[0] = 0; navigator.getGamepads = () => []; });
  await position(470, 805);
  report.gamepadMock = true;

  // Each archetype awards through the established XP, bestiary and level path.
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    for (const kind of ['dunePouncer', 'glassSpitter']) {
      const enemy = scene.enemies.find(item => item.kind === kind);
      enemy.health.current = 1;
      scene.resolveSaberHits(scene.time.now, [enemy], 0);
    }
  });
  current = await state(page);
  assert.equal(current.xp, 375);
  assert.equal(current.level, 4);
  assert.ok(current.visibleCombatXp >= 2, 'each Sirocco kill should show a contextual +XP reward');
  await page.screenshot({ path: `${out}/sirocco-xp-reward.png` });
  await chooseUpgrade(page, 'chargeWidth');
  current = await state(page);
  assert.equal(current.upgradeRanks.chargeWidth, 1);
  assert.equal(current.upgradePoints, 0);
  report.masteryChoice = { level: current.level, chargeWidth: current.upgradeRanks.chargeWidth };
  report.enemyRewardsAndLevel = { xp: current.xp, level: current.level, maxHp: current.maxHp };

  await walkTo(2240, 850);
  assert.ok(await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    return Math.hypot(scene.player.position.x - 2240, scene.player.position.y - 740) < 145;
  }));
  await key('e');
  current = await state(page);
  assert.equal(current.signalSeen, true);
  assert.match(current.text, /EXPEDIÇÃO CONCLUÍDA/i);
  await page.screenshot({ path: `${out}/sirocco-relay.png` });
  report.siroccoPerformance = await page.evaluate(async () => {
    const game = window.__danteGame, scene = game.scene.getScene('Game'), fps = [];
    for (let i = 0; i < 15; i++) { await new Promise(resolve => setTimeout(resolve, 200)); fps.push(game.loop.actualFps); }
    return { meanFps: fps.reduce((sum, n) => sum + n, 0) / fps.length, minFps: Math.min(...fps),
      objects: scene.children.list.length, tweens: scene.tweens.getTweens().length,
      renderTextures: scene.children.list.filter(item => item.type === 'RenderTexture').length };
  });

  // Reload must resume in the new map with story flags, level and habitat renewal cooldowns.
  report.saveBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1')));
  await page.reload(); await ready(page); await page.waitForTimeout(550);
  current = await state(page);
  assert.equal(current.area, 'arid');
  assert.equal(current.signalSeen, true);
  assert.equal(current.xp, 375);
  assert.equal(current.level, 4);
  assert.equal(current.upgradeRanks.chargeWidth, 1);
  assert.equal(current.upgradePoints, 0);
  const savedCooldowns = report.saveBeforeReload.aridHabitats.map(([id]) => id);
  assert.ok(savedCooldowns.includes(1000) && savedCooldowns.includes(1002));
  report.reloadPersistence = { area: current.area, signal: current.signalSeen, xp: current.xp,
    level: current.level, renewedHabitatCooldowns: [1000, 1002] };
  // A living resident earns XP; after its safe-distance cooldown, the same habitat can renew and reward again.
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game'), enemy = scene.siroccoResidents.get(1001);
    if (!enemy) throw new Error('Expected Sirocco habitat 1001 to be active after reload');
    enemy.health.current = 1; scene.resolveSaberHits(scene.time.now, [enemy], 0);
  });
  assert.equal((await state(page)).xp, 390);
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.siroccoHabitatCooldowns.set(1001, Date.now() - 1);
    scene.renewSiroccoHabitats();
    const enemy = scene.siroccoResidents.get(1001);
    if (!enemy) throw new Error('Expired Sirocco habitat did not renew');
    enemy.health.current = 1; scene.resolveSaberHits(scene.time.now, [enemy], 0);
  });
  assert.equal((await state(page)).xp, 405);
  report.siroccoResidentRenewal = { xpAfterFirstKill: 390, xpAfterRenewedKill: 405, cooldownMs: 90_000 };

  // The return gate is optional; death restarts at the safe Sirocco entry and retains progress.
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game'); scene.player.health.current = 1;
    scene.player.invulnerableUntil = 0; scene.enemyStrike(scene.enemies[0], { damage: 100, ranged: true });
  });
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').player.isDead);
  await page.waitForTimeout(650); await key('r', 80);
  await page.waitForFunction(() => {
    const scene = window.__danteGame.scene.getScene('Game'); return !scene.player.isDead && scene.area === 'arid';
  });
  current = await state(page);
  assert.equal(current.xp, 405); assert.equal(current.level, 4); assert.equal(current.signalSeen, true);
  assert.equal(current.upgradeRanks.chargeWidth, 1); assert.equal(current.upgradePoints, 0);
  assert.deepEqual(current.position, { x: 470, y: 805 });
  report.safeRespawn = { area: current.area, position: current.position, xp: current.xp, level: current.level };

  // The portal returns to the frontier checkpoint without resetting progression.
  await position(315, 805); await key('e');
  await page.waitForFunction(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    return scene.area === 'valley' && scene.player.position.x > 2800;
  });
  current = await state(page);
  assert.equal(current.xp, 405); assert.equal(current.level, 4); assert.equal(current.echoes, 3);
  assert.equal(current.upgradeRanks.chargeWidth, 1);
  assert.deepEqual(current.position, { x: 2865, y: 640 });
  report.returnPortal = { area: current.area, position: current.position, xp: current.xp, level: current.level, echoes: current.echoes };

  // The same map remains legible at common desktop and mobile landscape viewports.
  report.layouts = [];
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await page.setViewportSize({ width, height });
    const canvas = await page.locator('canvas').boundingBox();
    assert.ok(canvas.width <= width + 1 && canvas.height <= height + 1);
    report.layouts.push(`${width}x${height}`);
  }
  // Gamepad API mock covers the unchanged generic mapping on the new map.
  report.gamepadMock = true;

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(5000);
  report.performance = await page.evaluate(async () => {
    const game = window.__danteGame, scene = game.scene.getScene('Game'), fps = [];
    for (let i = 0; i < 20; i++) { await new Promise(resolve => setTimeout(resolve, 200)); fps.push(game.loop.actualFps); }
    return { meanFps: fps.reduce((sum, n) => sum + n, 0) / fps.length, minFps: Math.min(...fps),
      objects: scene.children.list.length, tweens: scene.tweens.getTweens().length,
      renderTextures: scene.children.list.filter(item => item.type === 'RenderTexture').length };
  });

  const mobile = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage(); watch(mobilePage);
  await mobilePage.goto(base); await ready(mobilePage);
  await mobilePage.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.progression.restore({ xp: 345, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'],
      sourceLocated: true, passageOpen: true, rewardedHollows: [], rewardedRoutes: [] });
    scene.area = 'arid'; scene.deepPassageOpen = true; scene.firstEchoSeen = true;
    scene.wardenGateOpen = true; scene.wardenDefeated = true; scene.valleyFrontierReached = true;
    scene.valleyFrontierSignalSeen = true; scene.valleyFrontierEndSeen = true;
    scene.aridVisited = true; scene.scene.restart();
  });
  await mobilePage.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'arid');
  await mobilePage.waitForTimeout(550);
  await mobilePage.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    Object.assign(scene.player.position, { x: 315, y: 805 }); scene.player.view.setPosition(315, 805).setDepth(805);
  });
  await mobilePage.waitForFunction(() => document.querySelector('.touch-interact')?.classList.contains('is-available'));
  assert.equal(await mobilePage.locator('.touch-interact b').textContent(), 'ENTRAR');
  const button = await mobilePage.locator('.touch-interact').boundingBox();
  await mobilePage.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2);
  await mobilePage.waitForFunction(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    return scene.area === 'valley' && scene.player.position.x > 2800;
  });
  report.touchPortal = { landscapeControlsVisible: await mobilePage.locator('.touch-controls.is-visible').count() === 1,
    contextualLabel: 'ENTRAR', transitioned: true };
  await mobile.close();

  assert.deepEqual(errors, []);
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await writeFile(`${out}/failure.json`, JSON.stringify({ ...report, failure: error.stack }, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
