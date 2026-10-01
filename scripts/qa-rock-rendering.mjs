// Optional local QA: requires Playwright and Chrome already available locally.
// Run against the Vite dev server (DEV-only inspection hooks, not production).
// node scripts/qa-rock-rendering.mjs [base URL] [optional pre-change JSON]
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173/';
const before = process.argv[3] ? JSON.parse(await readFile(process.argv[3], 'utf8')) : undefined;
const output = fileURLToPath(new URL('../docs/visual-rendering-prototype-01/', import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
const experimentalRequestsInGame = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
page.on('request', request => {
  if (!page.url().includes('rendering-lab') && request.url().includes('/assets/experiments/')) experimentalRequestsInGame.push(request.url());
});

async function gameReady() {
  await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
}

async function position(x, y, invulnerable = true) {
  await page.evaluate(({ x, y, invulnerable }) => {
    const s = window.__danteGame.scene.getScene('Game');
    Object.assign(s.player.position, { x, y });
    s.player.invulnerableUntil = invulnerable ? Infinity : 0;
  }, { x, y, invulnerable });
  await page.waitForTimeout(80);
}

async function key(key, duration = 55) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}

async function snapshot(lab = false, sample = false) {
  return page.evaluate(async ({ lab, sample }) => {
    const game = lab ? window.__danteRenderingLab : window.__danteGame;
    const scene = game.scene.getScene(lab ? 'RockRenderingLab' : 'Game');
    const values = [];
    if (sample) for (let i = 0; i < 25; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      values.push(game.loop.actualFps);
    }
    const types = {};
    scene.children.list.forEach(object => types[object.type] = (types[object.type] ?? 0) + 1);
    return {
      fps: values.length ? values.reduce((a, b) => a + b, 0) / values.length : game.loop.actualFps,
      objects: scene.children.list.length,
      tweens: scene.tweens.getTweens().length,
      renderTextures: types.RenderTexture ?? 0,
      graphics: types.Graphics ?? 0,
      types,
      textures: game.textures.getTextureKeys().length,
      experimentalTextures: game.textures.getTextureKeys().filter(key => key.startsWith('lab-')),
      obstacles: lab ? undefined : JSON.parse(JSON.stringify(scene.arena.obstacles)),
      bounds: lab ? undefined : scene.movementBounds ?? null,
    };
  }, { lab, sample });
}

const version = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version;
const result = { version, physicalTests: false, method: 'Chrome headless; local DEV hooks for setup/assertions; real keyboard/mouse actions', errors };
try {
  await page.goto(base);
  await gameReady();
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').progression.echoes.size), 0);
  await page.waitForTimeout(1000);
  result.forest = await snapshot(false, true);
  if (before) assert.deepEqual(result.forest.obstacles, before.forest.obstacles);
  const start = await page.evaluate(() => ({ ...window.__danteGame.scene.getScene('Game').player.position }));
  await key('d', 200);
  assert.ok(await page.evaluate(start => window.__danteGame.scene.getScene('Game').player.position.x > start.x + 15, start));

  // Setup approaches; discovery, rewards and passage are activated by real E inputs.
  for (const [x, y] of [[560, 700], [1870, 900], [1500, 360]]) {
    await position(x, y);
    await key('e');
  }
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').progression.echoes.size === 3);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').progression.xp), 120);
  await page.waitForTimeout(1000);
  await position(1870, 340);
  await key('e');
  await position(1670, 290);
  await key('e');
  await page.waitForTimeout(1600);
  assert.ok(await page.evaluate(() => window.__danteGame.scene.getScene('Game').progression.passageOpen));
  await position(1870, 335);
  await key('w', 360);
  await page.waitForFunction(() => {
    const s = window.__danteGame.scene.getScene('Game');
    return s.area === 'cavern' && !s.transitioning && s.player.position.x < 1000;
  });
  result.echoesAndEntry = true;

  await position(1000, 690);
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    // Freeze enemies only for matched performance/capture setup; restored below.
    s.enemies.forEach(enemy => { enemy.qaUpdate = enemy.update; enemy.update = () => {}; });
    s.cameras.main.stopFollow().centerOn(950, 660);
  });
  await page.mouse.move(970, 390);
  await page.waitForTimeout(1000);
  result.cavern = await snapshot(false, true);
  if (before) {
    assert.deepEqual(result.cavern.obstacles, before.cavern.obstacles);
    assert.deepEqual(result.cavern.bounds, before.cavern.bounds);
    assert.equal(result.cavern.objects, before.cavern.objects);
  }
  assert.equal(result.cavern.experimentalTextures.length, 0);
  assert.equal(experimentalRequestsInGame.length, 0);

  await position(885, 715);
  await key('w', 700);
  assert.ok(await page.evaluate(() => window.__danteGame.scene.getScene('Game').player.position.y >= 668.9));
  await position(885, 715);
  await page.keyboard.down('w');
  await page.keyboard.down('Space');
  await page.waitForTimeout(260);
  await page.keyboard.up('Space');
  await page.keyboard.up('w');
  assert.ok(await page.evaluate(() => window.__danteGame.scene.getScene('Game').player.position.y >= 668.9));
  result.collisionAndDash = true;

  await position(1000, 710);
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    Object.assign(s.enemies[0].position, { x: 1080, y: 710 });
    Object.assign(s.enemies[1].position, { x: 1350, y: 750 });
  });
  await page.mouse.move(830, 410);
  await page.mouse.click(830, 410);
  await page.waitForTimeout(320);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').enemies[0].health.current), 34);
  await page.keyboard.down('q');
  await page.waitForTimeout(470);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').charge.phase), 'CHARGING');
  await page.keyboard.up('q');
  await page.waitForTimeout(650);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').progression.xp), 135);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').charge.phase), 'READY');
  result.strikeChargeHollowXp = true;

  await position(1000, 710, false);
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    s.player.health.current = 1;
    const enemy = s.enemies[0];
    Object.assign(enemy.position, { x: 1030, y: 710 });
    enemy.update = enemy.qaUpdate;
  });
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').player.isDead);
  await page.waitForTimeout(600);
  await key('r');
  await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    return { xp: s.progression.xp, level: s.progression.level, echoes: s.progression.echoes.size, passage: s.progression.passageOpen, hp: s.player.hp, maxHp: s.player.maxHp };
  }), { xp: 135, level: 2, echoes: 3, passage: true, hp: 110, maxHp: 110 });
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').player.position.x), 630);
  result.deathAndRespawn = true;

  await position(1620, 490);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').deepPassageOpen);
  await position(2100, 740);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').deepAreaSeen);
  result.deepSignal = true;
  assert.equal(experimentalRequestsInGame.length, 0);

  await page.setViewportSize({ width: 1280, height: 768 });
  await page.goto(new URL('rendering-lab.html', base).href);
  await page.waitForFunction(() => window.__danteRenderingLab?.scene.getScene('RockRenderingLab').children.list.length === 25);
  await page.waitForTimeout(1000);
  result.lab = await snapshot(true, true);
  assert.equal(result.lab.tweens, 0);
  assert.equal(result.lab.renderTextures, 2);
  assert.equal(result.lab.experimentalTextures.length, 4);
  assert.equal(result.lab.types.Image, 8);
  await page.locator('canvas').screenshot({ path: `${output}/comparison.png` });
  await page.evaluate(() => {
    const s = window.__danteRenderingLab.scene.getScene('RockRenderingLab');
    const toggle = s.children.list.find(o => o.type === 'Text' && o.text.startsWith('FOOTPRINT REFERENCE'));
    toggle.emit('pointerdown');
  });
  assert.ok(await page.evaluate(() => window.__danteRenderingLab.scene.getScene('RockRenderingLab').children.list.some(o => o.type === 'Graphics' && o.visible)));
  await page.waitForTimeout(6000);
  const stable = await snapshot(true);
  assert.equal(stable.objects, result.lab.objects);
  assert.equal(stable.textures, result.lab.textures);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.__danteRenderingLab.scene.getScene('RockRenderingLab').scene.restart());
    await page.waitForTimeout(200);
    const restarted = await snapshot(true);
    assert.equal(restarted.objects, result.lab.objects);
    assert.equal(restarted.textures, result.lab.textures);
    assert.equal(restarted.tweens, 0);
  }
  result.labStableAndRestart = true;
  result.resolutions = [];
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const canvas = await page.locator('canvas').boundingBox();
    assert.ok(canvas.x >= -1 && canvas.y >= 0 && canvas.x + canvas.width <= width + 1 && canvas.y + canvas.height <= height + 1);
    result.resolutions.push(`${width}x${height}`);
  }
  assert.equal(errors.length, 0);
  result.noExperimentalAssetsInGame = true;
  result.before = before && {
    version: before.version,
    forest: { fps: before.forest.fps, objects: before.forest.objects, tweens: before.forest.tweens, renderTextures: before.forest.renderTextures },
    cavern: { fps: before.cavern.fps, objects: before.cavern.objects, tweens: before.cavern.tweens, renderTextures: before.cavern.renderTextures },
  };
  // Physics data was compared in memory; keep the report small.
  result.forest.obstacles = result.cavern.obstacles = undefined;
  await writeFile(`${output}/measurements.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
