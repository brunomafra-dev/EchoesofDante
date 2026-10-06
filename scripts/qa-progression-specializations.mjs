import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/progression-specializations/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { method: 'Chrome headless; old local-save fixture, actual level-up triggers, keyboard/gamepad/touch choice; no physical devices', errors: [] };
const watch = page => {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
};
const ready = page => page.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view?.active);
const state = page => page.evaluate(() => {
  const scene = window.__danteGame.scene.getScene('Game');
  return { xp: scene.progression.xp, level: scene.progression.level, hp: scene.player.hp, maxHp: scene.player.maxHp,
    next: scene.progression.nextLevelXp, ranks: { ...scene.progression.abilityUpgradeRanks }, points: scene.progression.upgradePointsAvailable,
    saberRange: scene.attack.range, dashCooldown: scene.player.dashCooldown, dashDuration: scene.player.dashDuration,
    chargeWidth: scene.charge.waveHalfWidth, chargeMax: scene.charge.maxDamage };
});
const chooseTouch = async (page, id) => {
  await page.locator('.ability-upgrade-dialog[open]').waitFor();
  const option = page.locator(`[data-upgrade="${id}"]:not(:disabled)`);
  await option.scrollIntoViewIfNeeded();
  await option.evaluate(element => element.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true,
  })));
  await page.waitForFunction(() => !document.querySelector('.ability-upgrade-dialog[open]'));
};
const hurtOne = page => page.evaluate(() => {
  const scene = window.__danteGame.scene.getScene('Game');
  const enemy = scene.enemies.find(candidate => !candidate.isDead);
  if (!enemy) throw new Error('No living Valley resident available for XP milestone QA');
  enemy.health.current = 1;
  scene.resolveSaberHits(scene.time.now, [enemy], 0);
});

const legacy = { schema: 1, updatedAt: Date.now(), area: 'valley', hp: 110,
  progression: { xp: 345, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'], sourceLocated: true,
    passageOpen: true, rewardedHollows: [0, 8], rewardedRoutes: [] },
  flags: Object.fromEntries(['deepPassageOpen', 'deepCavernEntered', 'deeperEntered', 'exteriorEntered', 'fragmentSeen',
    'firstEchoSeen', 'wardenGateOpen', 'wardenDefeated', 'wardenEndingSeen', 'valleyVisited', 'valleyCheckpointReached',
    'valleyFrontierReached', 'valleyFrontierSignalSeen', 'valleyFrontierEndSeen'].map(key => [key, true])),
  bestiary: {}, valleyRoutes: [], valleyHabitats: [] };

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage(); watch(page);
  await page.addInitScript(save => {
    if (!sessionStorage.getItem('__qaJourneySeeded')) {
      localStorage.setItem('echoes-of-dante.journey.v1', JSON.stringify(save));
      sessionStorage.setItem('__qaJourneySeeded', '1');
    }
  }, legacy);
  await page.goto(base); await ready(page); await page.waitForTimeout(350);
  let current = await state(page);
  assert.equal(current.level, 3); assert.equal(current.xp, 345); assert.equal(current.next, 360);
  assert.equal(current.points, 0); assert.equal(current.maxHp, 120);
  report.oldSaveMigration = { xp: current.xp, level: current.level, maxHp: current.maxHp, noUpgradeData: true };

  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    Object.assign(scene.player.position, { x: 1050, y: 760 });
    scene.player.invulnerableUntil = Infinity;
  });
  await page.keyboard.press('e');
  await page.waitForFunction(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    return scene.progression.level === 4 && scene.progression.upgradePointsAvailable === 1;
  });
  await page.locator('.ability-upgrade-dialog[open]').waitFor();
  assert.equal(await page.locator('.ability-upgrade-option').count(), 6);
  await page.screenshot({ path: `${out}/level-4-choice.png` });
  await page.keyboard.press('2');
  await page.waitForFunction(() => !document.querySelector('.ability-upgrade-dialog[open]'));
  current = await state(page);
  assert.equal(current.ranks.saberReach, 1); assert.equal(current.saberRange, 116);
  assert.equal(current.points, 0); assert.equal(current.maxHp, 130);
  report.level4KeyboardChoice = current;

  await page.reload(); await ready(page); await page.waitForTimeout(420);
  current = await state(page);
  assert.equal(current.level, 4); assert.equal(current.ranks.saberReach, 1); assert.equal(current.points, 0);
  report.reloadKeepsBuild = true;

  // Existing level 5 journeys without the new rank field receive their first mastery point.
  const oldLevelFive = { ...legacy, hp: 140, progression: { ...legacy.progression, xp: 660 } };
  await page.addInitScript(save => {
    if (!sessionStorage.getItem('__qaLevelFiveSeeded')) {
      localStorage.setItem('echoes-of-dante.journey.v1', JSON.stringify(save));
      sessionStorage.setItem('__qaLevelFiveSeeded', '1');
    }
  }, oldLevelFive);
  await page.reload(); await ready(page); await page.waitForTimeout(420);
  await page.locator('.ability-upgrade-dialog[open]').waitFor();
  current = await state(page);
  assert.equal(current.level, 5); assert.equal(current.next, 960); assert.equal(current.points, 1);
  assert.equal(Object.values(current.ranks).reduce((sum, rank) => sum + rank, 0), 0);
  await page.keyboard.press('1');
  await page.waitForFunction(() => !document.querySelector('.ability-upgrade-dialog[open]'));
  assert.equal((await state(page)).ranks.saberArc, 1);
  await page.reload(); await ready(page); await page.waitForTimeout(420);
  assert.equal((await state(page)).ranks.saberArc, 1);
  report.oldLevelFiveSaveMigration = { level: 5, availableChoice: true, reloadPreservesChoice: true };

  // Place the legacy journey at level 5's next threshold, then earn level 6 through a real kill reward.
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.progression.restore({ ...scene.progression.snapshot(), xp: 945 });
    scene.player.health.setMaxAndRestore(scene.progression.maxHp);
    scene.saveProgress();
    const pad = { connected: true, mapping: 'standard', axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ value: 0, pressed: false })) };
    window.qaPad = pad; navigator.getGamepads = () => [pad];
  });
  await hurtOne(page);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').progression.level === 6);
  await page.locator('.ability-upgrade-dialog[open]').waitFor();
  const gamepadPress = async index => {
    await page.evaluate(i => { window.qaPad.buttons[i].pressed = true; window.qaPad.buttons[i].value = 1; }, index);
    await page.waitForTimeout(90);
    await page.evaluate(i => { window.qaPad.buttons[i].pressed = false; window.qaPad.buttons[i].value = 0; }, index);
    await page.waitForTimeout(90);
  };
  await gamepadPress(13); await gamepadPress(13); await gamepadPress(0);
  await page.waitForFunction(() => !document.querySelector('.ability-upgrade-dialog[open]'));
  current = await state(page);
  assert.equal(current.ranks.dashCooldown, 1); assert.equal(current.dashCooldown, 1580); assert.equal(current.points, 0);
  report.level6GamepadChoice = current;
  await page.reload(); await ready(page); await page.waitForTimeout(420);
  assert.equal((await state(page)).ranks.dashCooldown, 1);

  // Touch selects the level 8 mastery on a landscape viewport.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1')));
  await context.close();
  const mobileContext = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const mobile = await mobileContext.newPage(); watch(mobile);
  await mobile.addInitScript(save => {
    if (!sessionStorage.getItem('__qaJourneySeeded')) {
      localStorage.setItem('echoes-of-dante.journey.v1', JSON.stringify(save));
      sessionStorage.setItem('__qaJourneySeeded', '1');
    }
  }, saved);
  await mobile.goto(base); await ready(mobile); await mobile.waitForTimeout(360);
  await mobile.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.progression.restore({ ...scene.progression.snapshot(), xp: 1665 });
    scene.player.health.setMaxAndRestore(scene.progression.maxHp);
    scene.saveProgress();
  });
  await hurtOne(mobile);
  await mobile.waitForFunction(() => window.__danteGame.scene.getScene('Game').progression.level === 8);
  await mobile.locator('.ability-upgrade-dialog[open]').waitFor();
  await mobile.screenshot({ path: `${out}/level-8-touch-choice.png` });
  await chooseTouch(mobile, 'chargeWidth');
  current = await state(mobile);
  assert.equal(current.ranks.chargeWidth, 1); assert.equal(current.chargeWidth, 72); assert.equal(current.points, 0);
  report.level8TouchChoice = current;

  // Last threshold is a cap, not a dead-end XP state, and still supplies its mastery point.
  await mobile.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.progression.restore({ ...scene.progression.snapshot(), xp: 2545 });
    scene.player.health.setMaxAndRestore(scene.progression.maxHp);
    scene.saveProgress();
  });
  await hurtOne(mobile);
  await mobile.waitForFunction(() => window.__danteGame.scene.getScene('Game').progression.level === 10);
  await mobile.locator('.ability-upgrade-dialog[open]').waitFor();
  current = await state(mobile);
  assert.equal(current.next, null); assert.equal(current.maxHp, 165); assert.equal(current.points, 1);
  await chooseTouch(mobile, 'chargePower');
  current = await state(mobile);
  assert.equal(current.level, 10); assert.equal(current.ranks.chargePower, 1); assert.equal(current.chargeMax, 82);
  assert.equal(current.points, 0);
  report.level10CapAndFinalChoice = current;
  await mobile.reload(); await ready(mobile); await mobile.waitForTimeout(420);
  current = await state(mobile);
  assert.equal(current.level, 10); assert.equal(current.maxHp, 165); assert.equal(current.ranks.chargePower, 1);
  report.level10Reload = true;
  assert.deepEqual(report.errors, []); report.passed = true;
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await writeFile(`${out}/failure.json`, JSON.stringify({ ...report, failure: error.stack }, null, 2));
  throw error;
} finally { await browser.close(); }
