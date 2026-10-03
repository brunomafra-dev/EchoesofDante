// Targeted regression for unsupported terrain edges and hidden actors.
// DEV positioning is explicit; existing journey QA exercises gameplay access.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/environment-cohesion/correction/occlusion';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless; DEV positions, no physical device', errors, views: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto(base);
  await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    s.area = 'cavern'; s.deepPassageOpen = true; s.firstEchoSeen = true; s.wardenGateOpen = true;
    s.scene.restart();
  });
  await page.waitForTimeout(650);
  const position = async (x, y, cx, cy) => {
    await page.evaluate(({ x, y, cx, cy }) => {
      const s = window.__danteGame.scene.getScene('Game');
      Object.assign(s.player.position, { x, y }); s.player.invulnerableUntil = 0;
      s.enemies.forEach(enemy => enemy.update = () => {});
      s.cameras.main.stopFollow().centerOn(cx, cy);
    }, { x, y, cx, cy });
    await page.waitForTimeout(800);
  };
  const prop = async (key, x) => page.evaluate(({ key, x }) => {
    const s = window.__danteGame.scene.getScene('Game');
    const image = s.children.list.find(o => o.type === 'Image' && o.texture.key === key && Math.abs(o.x - x) < 4);
    return image && { alpha: image.alpha, height: image.displayHeight, width: image.displayWidth, depth: image.depth };
  }, { key, x });
  for (const [width, height] of [[1280,720],[1366,768],[1920,1080],[844,390]]) {
    await page.setViewportSize({ width, height });
    await position(5220, 880, 5310, 790);
    const arch = await prop('guardian-lintel-open', 5310);
    assert.equal(arch.height, 175); assert.ok(arch.alpha < 0.32, 'Crown reveals the actor behind it');
    await page.screenshot({ path: `${out}/arch-${width}.png` });
    await position(5310, 860, 5310, 790);
    assert.ok((await prop('guardian-lintel-open', 5310)).alpha > 0.98, 'Empty throat does not ghost the monument');
    if(width===1280)await page.screenshot({path:`${out}/arch-throat-1280.png`});
    await position(5270, 965, 5310, 790);
    assert.ok((await prop('guardian-lintel-open', 5310)).alpha > 0.98, 'Arch restores opacity in front');
    await position(6150, 800, 6240, 770);
    const gate = await prop('guardian-lintel-open', 6340);
    assert.equal(gate.height, 190); assert.ok(gate.alpha < 0.32, 'Threshold reveals the actor');
    await page.screenshot({ path: `${out}/threshold-${width}.png` });
    await position(5980, 855, 6240, 770);
    assert.ok((await prop('guardian-lintel-open', 6340)).alpha > 0.98, 'Threshold restores opacity outside overlap');
    if(width===1280)await page.screenshot({path:`${out}/threshold-front-1280.png`});
    report.views.push({ width, height, arch, gate });
  }
  await position(5530, 610, 5530, 710);
  assert.ok((await prop('first-echo-archive', 5530)).alpha < 0.32, 'Archive does not hide actor');
  const snapshot = () => page.evaluate(() => {
    const g = window.__danteGame, s = g.scene.getScene('Game');
    return { objects: s.children.list.length, textures: g.textures.getTextureKeys().length,
      floors: s.children.list.filter(o => o.name === 'continuous-cavern-ground').length,
      raised: s.children.list.filter(o => o.type === 'Image').length,
      caches: s.children.list.filter(o => o.type === 'RenderTexture').length,
      listeners: [s.input.listenerCount('pointerdown'), s.input.keyboard.listenerCount('keydown')] };
  });
  report.restarts = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__danteGame.scene.getScene('Game').scene.restart());
    await page.waitForTimeout(750);
    report.restarts.push(await snapshot());
    await position(5220, 880, 5310, 790);
    assert.ok((await prop('guardian-lintel-open', 5310)).alpha < 0.32, 'Occlusion registry rebuilt after restart');
  }
  assert.deepEqual(report.restarts[1], report.restarts[0]);
  assert.deepEqual(report.restarts[2], report.restarts[0]);
  assert.equal(report.restarts[0].floors, 1);
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    s.area = 'warden'; s.scene.restart();
  });
  await page.waitForTimeout(750);
  const originalFootprints = await page.evaluate(() => window.__danteGame.scene.getScene('Game').arena.obstacles.length);
  await page.evaluate(() => window.__danteGame.scene.getScene('Game').wardenArena.setEncounterActive(true));
  await page.waitForTimeout(800);
  const seal = await prop('guardian-lintel-closed', 530);
  assert.equal(seal.height, 110, 'Combat seal retains a low silhouette');
  assert.ok(seal.alpha > 0.98);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').arena.obstacles.length), originalFootprints + 1);
  await page.evaluate(() => window.__danteGame.scene.getScene('Game').wardenArena.setEncounterActive(false));
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').arena.obstacles.length), originalFootprints);
  assert.equal((await prop('guardian-lintel-closed', 530)).alpha, 0);
  report.combatSealLowAndPhysicalStatePreserved = true;
  assert.deepEqual(errors, []); report.pass = true;
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}
