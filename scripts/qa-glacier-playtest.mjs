import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'docs/glacier-expansion/direct-playtest'; await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const report = { errors: [], scenarios: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) report.errors.push(r.url()); });
const base = 'http://localhost:5184/';
const storage = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
const ready = () => page.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view.active);
try {
  // A completely fresh browser must not even register a real character.
  await page.goto(base + 'glacier-playtest.html'); await ready();
  assert.deepEqual(await storage(), {});
  // Existing personal data must survive every playtest navigation/pagehide.
  await page.evaluate(() => {
    localStorage.setItem('echoes-of-dante.characters.v1', JSON.stringify({ schema: 1, selected: 'personal', characters: [{ id: 'personal', name: 'Meu personagem', classId: 'hunter', createdAt: 1 }] }));
    localStorage.setItem('echoes-of-dante.journey.v1.character.personal', JSON.stringify({ schema: 1, updatedAt: 1, area: 'forest', hp: 80, flags: {}, bestiary: {}, valleyRoutes: [], valleyHabitats: [], aridHabitats: [], progression: { xp: 45, echoes: [], sourceLocated: false, passageOpen: false, rewardedHollows: [], rewardedRoutes: [] } }));
  });
  const before = await storage();
  for (const area of ['icecave', 'icenest']) for (const classId of ['warrior', 'hunter']) {
    await page.goto(`${base}glacier-playtest.html?area=${area}&class=${classId}`); await ready(); await page.waitForTimeout(500);
    const state = await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return { area: s.area, classId: s.classId, level: s.progression.level, hp: s.player.hp, maxHp: s.player.health.max, bossHp: s.vesper?.health.current, paused: s.scene.isPaused(), points: s.progression.upgradePointsAvailable }; });
    assert.equal(state.area, area); assert.equal(state.classId, classId); assert.equal(state.level, 6); assert.equal(state.hp, state.maxHp); assert.equal(state.paused, false); assert.equal(state.points, 0);
    if (area === 'icenest') assert.equal(state.bossHp, 1100);
    await page.keyboard.down('d'); await page.waitForTimeout(400); await page.keyboard.up('d');
    if (area === 'icenest' && classId === 'warrior') {
      await page.keyboard.down('d'); await page.waitForTimeout(2400); await page.keyboard.up('d');
      await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').vesper.state !== 'DORMANT');
      await page.screenshot({ path: `${out}/boss.png` });
      await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.player.invulnerableUntil = 0; s.enemyStrike(s.vesper, { damage: 999, ranged: true }); });
      await page.keyboard.press('r'); await page.waitForTimeout(600); await ready();
      assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').vesper.health.current), 1100);
      report.bossEntryAndRetry = true;
    }
    await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.saveProgress(); });
    assert.deepEqual(await storage(), before); report.scenarios.push(state);
  }
  // Real mobile-sized menu links preserve selected class and start the requested area.
  await page.setViewportSize({ width: 844, height: 390 }); await page.locator('.playtest-navigation > summary').click();
  await page.locator('[data-area="icecave"]').click(); await ready();
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').classId), 'hunter');
  await page.locator('.playtest-navigation > summary').click(); await page.locator('[data-retry]').click(); await ready();
  assert.deepEqual(await storage(), before);
  await page.screenshot({ path: `${out}/mobile.png` });
  await page.locator('.playtest-navigation > summary').click(); await page.locator('a[href="./"]').click(); await ready();
  assert.equal(await page.locator('.application-shell[open]').count(), 1);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').progression.xp), 45);
  // The normal game may normalize/save its own loaded journey on menu pause.
  // Verify content instead of expecting its updatedAt timestamp to stay frozen.
  const normal = await storage(), saved = JSON.parse(normal['echoes-of-dante.journey.v1.character.personal']);
  assert.equal(normal['echoes-of-dante.characters.v1'], before['echoes-of-dante.characters.v1']);
  assert.equal(saved.area, 'forest'); assert.equal(saved.progression.xp, 45);
  assert.ok(Object.values(saved.flags).every(flag => flag === false));
  report.personalJourneyPreserved = true;
  assert.deepEqual(report.errors, []); report.passed = true;
} finally { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
console.log(report);
