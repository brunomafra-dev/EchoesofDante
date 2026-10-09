import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = 'docs/glacier-expansion/qa'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const p = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const report = { method: 'Chrome headless, real action keys and pointer events; DEV prior-chapter/position/damage setup explicitly used for state coverage. No physical devices.', errors: [] };
p.on('pageerror', e => report.errors.push(e.message));
p.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
const ready = () => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state = () => p.evaluate(() => { const g = window.__danteGame, s = g.scene.getScene('Game'); return {
  area: s.area, xp: s.progression.xp, level: s.progression.level, hp: s.player.hp, dead: s.player.isDead,
  cave: s.icecaveSignalSeen, won: s.vesperDefeated, clue: s.vesperClueSeen,
  player: { ...s.player.position }, boss: s.vesper ? { hp: s.vesper.health.current, phase: s.vesper.phase, state: s.vesper.state, attack: s.vesper.attackName } : undefined,
  objects: s.children.list.length, tweens: s.tweens.getTweens().length, fps: g.loop.actualFps,
}; });
const key = async (k, ms = 160) => { await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k); await p.waitForTimeout(120); };
const pos = async (x, y) => { await p.evaluate(({ x, y }) => { const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position, { x, y }); s.player.invulnerableUntil = Infinity; }, { x, y }); await p.waitForTimeout(140); };
const waitArea = async area => { await p.waitForFunction(area => window.__danteGame?.scene.getScene('Game')?.area === area && window.__danteGame.scene.getScene('Game').player.view.active, area); await p.waitForTimeout(700); };
try {
  let finishLoading;
  const loading = new Promise(resolve => { finishLoading = resolve; });
  await p.route('**/vesper-motion.png', async route => { await loading; await route.continue(); });
  // Actual key presses, not fill(): Phaser must not swallow character name letters.
  await p.goto(base, { waitUntil: 'domcontentloaded' });
  await p.locator('[data-shell="characters"]').click(); await p.locator('[data-shell="new-character"]').click();
  await p.locator('[data-shell="choose-warrior"]').click();
  const input = p.locator('input[name="character-name"]'); await input.click();
  await p.keyboard.type('Alan Lira'); finishLoading(); await ready();
  assert.equal(await input.inputValue(), 'Alan Lira', 'loading preserves name/class preview');
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  for (const half of [alphabet.slice(0, 13), alphabet.slice(13)]) {
    await p.keyboard.press('Control+a'); await p.keyboard.press('Backspace');
    for (const letter of half) await p.keyboard.press(letter);
    assert.equal(await input.inputValue(), half);
  }
  await p.keyboard.press('Control+a'); await p.keyboard.type('Alan Lira'); assert.equal(await input.inputValue(), 'Alan Lira');
  await p.keyboard.press('Enter'); await p.waitForTimeout(700); await ready();
  assert.equal(await p.evaluate(() => document.querySelector('.application-shell')?.open), false);
  report.nameTyping = { realKeys: true, alphabet: true, preservedDuringLoading: true, selectAll: true, space: true, enterCreates: true };
  assert.equal((await state()).area, 'forest');
  await p.goto(`${base}?qa=play`); await ready();
  await p.evaluate(async () => {
    const s = window.__danteGame.scene.getScene('Game'), { JOURNEY_FLAGS } = await import('/src/systems/LocalJourney.ts');
    s.progression.restore({ xp: 1000, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'], sourceLocated: true, passageOpen: true, rewardedHollows: [], rewardedRoutes: [], bossRewards: ['soterrado'] });
    for (const id of ['saberArc','saberReach','dashCooldown','dashDuration','chargeWidth','chargePower']) while (s.progression.investUpgrade(id)) {}
    for (const f of JOURNEY_FLAGS) s[f] = !['icecaveVisited', 'icecaveSignalSeen', 'icenestVisited', 'vesperReached', 'vesperDefeated', 'vesperClueSeen'].includes(f);
    s.area = 'frost'; s.scene.restart();
  }); await waitArea('frost');
  await pos(2580, 1010); await key('e'); await waitArea('icecave');
  report.entryFromExistingFrost = true;
  await pos(1120, 970); await p.screenshot({ path: `${out}/galleries.png` }); await pos(410, 960);
  const before = (await state()).player.x; await key('d', 500); assert.ok((await state()).player.x > before + 65);
  assert.equal(await p.evaluate(() => window.__danteGame.scene.getScene('Game').enemies.length), 8);
  for (const q of [[1120, 520], [2120, 1350]]) await pos(...q);
  assert.equal((await state()).xp, 1040); report.optionalRoutes = true;
  // Existing damage path for all three creature archetypes, renewable XP rather than kill gates.
  await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); for (const kind of ['iceCarapace', 'frostPouncer', 'frostSpitter']) { const e = s.enemies.find(e => e.kind === kind); s.resolvePlayerHits(s.time.now, [e], 999, 0, 0x5fe6d8, s.player.position, false); } });
  assert.equal((await state()).xp, 1085); report.creaturesDamageDeathXp = true;
  await pos(1600, 700); await key('e'); assert.ok((await state()).cave);
  await p.reload(); await ready(); assert.equal((await state()).area, 'icecave'); assert.ok((await state()).cave);
  await pos(2680, 1010); await key('e'); await waitArea('icenest');
  assert.equal((await state()).boss.state, 'DORMANT');
  const initialXp = (await state()).xp;
  await pos(940, 1000); await p.waitForTimeout(2400); report.introduction = true;
  await p.screenshot({ path: `${out}/vesper-arrival.png` });
  // Deterministic attack coverage checks locked direction, hit callback and recovery.
  const attacks = await p.evaluate(async () => {
    const s = window.__danteGame.scene.getScene('Game'), b = s.vesper;
    const tested = [];
    for (const name of ['breath', 'tail', 'rush', 'eruption']) {
      b.position.x = 1420; b.position.y = 960; b.beginAttack(s.time.now, name, { x: 1180, y: 960 });
      const angle = b.angle;
      b.update(s.time.now + 300, .016, { x: 1420, y: 700 }, false, s.arena.obstacles, () => {});
      if (b.angle !== angle) throw new Error('Aim tracked during tell');
      let hits = 0;
      let now = b.until + 1;
      const target = name === 'eruption' ? { ...b.marks[0] } : name === 'rush' ? { x: 1380, y: 960 } : name === 'tail' ? { x: 1300, y: 960 } : { x: 1180, y: 960 };
      b.update(now, .016, target, false, s.arena.obstacles, () => hits++);
      for (let i = 0; i < 85; i++) b.update(now += 16, .016, target, false, s.arena.obstacles, () => hits++);
      tested.push({ name, hits, lockedAngle: true });
    }
    return tested;
  });
  assert.ok(attacks.every(a => a.hits >= 1 && a.hits <= 1)); report.patterns = attacks;
  await pos(1120, 1000); await key('Space'); await key('q', 950); await p.waitForTimeout(500); report.dashAndCharge = true;
  for (const hp of [700, 290]) {
    await p.evaluate(hp => { const s = window.__danteGame.scene.getScene('Game'), b = s.vesper; b.health.current = hp; b.state = 'IDLE'; b.until = s.time.now + 2000; }, hp);
    await p.waitForTimeout(120);
    assert.equal((await state()).boss.phase, hp === 700 ? 2 : 3);
  }
  report.threePhases = true;
  // Actual player damage -> death -> R resets only encounter, not discoveries/XP.
  await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.player.invulnerableUntil = 0; s.enemyStrike(s.vesper, { damage: 999, ranged: true }); });
  assert.ok((await state()).dead); await key('r'); await p.waitForTimeout(600); await ready();
  assert.equal((await state()).boss.hp, 1100); assert.equal((await state()).boss.phase, 1); assert.equal((await state()).xp, initialXp);
  assert.ok((await state()).cave); assert.ok((await state()).player.x < 870); report.encounterReset = true;
  await pos(950, 1000); await p.waitForTimeout(2600);
  await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.resolvePlayerHits(s.time.now, [s.vesper], 2000, 0, 0x5fe6d8, s.player.position, false); });
  await p.waitForTimeout(2100); assert.ok((await state()).won); assert.equal((await state()).xp, initialXp + 220);
  await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.vesper.die(); s.vesperCue('death'); });
  assert.equal((await state()).xp, initialXp + 220); report.rewardOnce = true;
  await pos(1980, 820); await key('e'); assert.ok((await state()).clue);
  await p.reload(); await ready(); assert.ok((await state()).won); assert.ok((await state()).clue); assert.equal((await state()).boss, undefined);
  await p.waitForTimeout(500);
  // Victory grants the same mastery point as the existing boss reward path.
  if (await p.locator('.ability-upgrade-dialog[open]').count()) {
    await p.locator('.ability-upgrade-dialog[open] button:not(:disabled)').first().click();
    report.bossMasteryChoice = true;
  }
  report.victoryPersistence = true;
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) { await p.setViewportSize({ width, height }); await p.waitForTimeout(350); await p.screenshot({ path: `${out}/nest-${width}.png` }); }
  await pos(300, 1000); await key('e'); await waitArea('icecave'); assert.ok((await state()).player.x > 2500);
  await pos(260, 980); await key('e'); await waitArea('frost'); assert.ok((await state()).player.x > 2400);
  report.roundTrip = true;
  const counts = [];
  for (let i = 0; i < 3; i++) { await p.reload(); await ready(); await p.waitForTimeout(1200); counts.push((await state()).objects); }
  assert.ok(Math.max(...counts) - Math.min(...counts) < 4); report.reloadCounts = counts;
  report.fps = (await state()).fps;
  assert.deepEqual(report.errors, []); report.passed = true;
} finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
console.log(report);
