// Supplemental live-AI render measurement and production loading smoke test.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const dev = process.argv[2] ?? 'http://localhost:5174/';
const production = process.argv[3] ?? 'http://localhost:5175/';
const out = 'docs/expansion-deep-cavern';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const report = { method: 'Chrome headless; no physical-device validation', errors };
function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
}
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  observe(page);
  await page.goto(dev);
  await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    scene.area = 'cavern';
    scene.deepPassageOpen = true;
    scene.deepCavernEntered = true;
    scene.scene.restart();
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    Object.assign(scene.player.position, { x: 2425, y: 735 });
    scene.player.invulnerableUntil = Infinity;
  });
  // AI remains active: all four residents patrol/chase with normal parameters.
  await page.waitForTimeout(8000);
  report.liveAi = await page.evaluate(async () => {
    const game = window.__danteGame, scene = game.scene.getScene('Game'), fps = [];
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      fps.push(game.loop.actualFps);
    }
    return { meanFps: fps.reduce((a, b) => a + b, 0) / fps.length, minFps: Math.min(...fps), maxFps: Math.max(...fps), livingHollows: scene.enemies.filter(enemy => !enemy.isDead).length, objects: scene.children.list.length, tweens: scene.tweens.getTweens().length };
  });
  assert.equal(report.liveAi.livingHollows, 4);
  await page.close();

  const built = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  observe(built);
  const loaded = new Set();
  built.on('response', response => {
    const name = response.url().split('/').at(-1);
    if (['deep-stratum.png', 'deep-mineral.png', 'deep-relay.png'].includes(name) && response.ok()) loaded.add(name);
  });
  await built.goto(production);
  await built.locator('canvas').waitFor({ state: 'visible' });
  await built.waitForTimeout(3500);
  await built.keyboard.down('d');
  await built.waitForTimeout(250);
  await built.keyboard.up('d');
  await built.mouse.click(900, 420);
  await built.keyboard.press('Space');
  await built.keyboard.down('q');
  await built.waitForTimeout(350);
  await built.keyboard.up('q');
  await built.waitForTimeout(500);
  assert.equal(loaded.size, 3);
  assert.equal(await built.evaluate(() => typeof window.__danteGame), 'undefined');
  await built.screenshot({ path: `${out}/production-forest.png` });
  report.production = { canvasVisible: true, deepTexturesLoaded: [...loaded], devHookAbsent: true, inputSmokeSent: ['D', 'LMB', 'Space', 'Q hold/release'], gameplayAssertions: 'Full flow asserted in development QA; production smoke checks load/input errors only.' };
  assert.equal(errors.length, 0);
  await writeFile(`${out}/supplemental-checks.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
