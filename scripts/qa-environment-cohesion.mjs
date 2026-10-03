// Matched visual captures and physical invariance. DEV setup is explicit;
// gameplay regression is exercised by the existing journey/encounter QA.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const stage = process.argv[3] ?? 'after';
const out = `docs/environment-cohesion/${stage}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [], report = { stage, method: 'Chrome headless, matched camera/actor setup; no physical device test', errors, regions: {} };
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
try {
  for (const [name, area, px, py, cx, cy] of [
    ['forest', 'forest', 790, 1000, 850, 910],
    ['cavern', 'cavern', 1100, 820, 1110, 760],
    ['deep', 'cavern', 2090, 830, 2140, 770],
    ['exterior', 'cavern', 4810, 830, 4860, 750],
    ['approach', 'cavern', 5770, 770, 5780, 740],
    ['warden', 'warden', 940, 850, 1100, 760],
  ]) {
    await page.goto(base);
    await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
    if (area !== 'forest') {
      await page.evaluate(area => {
        const s = window.__danteGame.scene.getScene('Game');
        s.area = area; s.deepPassageOpen = true; s.firstEchoSeen = true; s.wardenGateOpen = true;
        s.scene.restart();
      }, area);
      await page.waitForTimeout(600);
    }
    await page.evaluate(({ px, py, cx, cy }) => {
      const s = window.__danteGame.scene.getScene('Game');
      Object.assign(s.player.position, { x: px, y: py }); s.player.invulnerableUntil = 0;
      if (s.warden) { s.warden.update = () => {}; s.warden.beginIntro = () => {}; }
      s.enemies.forEach(e => e.update = () => {});
      s.cameras.main.stopFollow().centerOn(cx, cy);
    }, { px, py, cx, cy });
    await page.mouse.move(920, 400); await page.waitForTimeout(800);
    await page.evaluate(() => window.__danteGame.scene.getScene('Game').enemies.forEach(e => e.update = () => {}));
    await page.screenshot({ path: `${out}/${name}.png` });
    report.regions[name] = await page.evaluate(async () => {
      const g = window.__danteGame, s = g.scene.getScene('Game'), samples = [];
      for (let i = 0; i < 12; i++) { await new Promise(r => setTimeout(r, 200)); samples.push(g.loop.actualFps); }
      const types = {}; s.children.list.forEach(o => types[o.type] = (types[o.type] ?? 0) + 1);
      const ground = s.children.getByName('continuous-cavern-ground');
      return { fps: samples.reduce((a, b) => a + b) / samples.length, objects: s.children.list.length,
        types, tweens: s.tweens.getTweens().length, textures: g.textures.getTextureKeys().length,
        obstacles: JSON.parse(JSON.stringify(s.arena.obstacles)), bounds: { ...s.movementBounds },
        player: { ...s.player.position }, zoom: s.cameras.main.zoom,
        ground: ground ? { texture: ground.displayTexture.key, canvas: [ground.canvas.width, ground.canvas.height],
          extent: [ground.displayWidth, ground.displayHeight], origin: [ground.x, ground.y], alpha: ground.alpha } : null };
    });
  }
  if (stage === 'grounding-revision') {
    const before = JSON.parse(await readFile('docs/environment-cohesion/correction/report.json', 'utf8'));
    for (const [name, current] of Object.entries(report.regions)) {
      assert.deepEqual(current.obstacles, before.regions[name].obstacles, `${name}: exact collision data`);
      assert.deepEqual(current.bounds, before.regions[name].bounds, `${name}: movement bounds`);
      assert.equal(current.zoom, before.regions[name].zoom, `${name}: unchanged camera`);
      assert.equal(current.objects, before.regions[name].objects, `${name}: no extra runtime objects`);
      assert.equal(current.tweens, before.regions[name].tweens, `${name}: no extra tweens`);
      assert.equal(current.textures, before.regions[name].textures + 3, `${name}: three small shared assets`);
      if (name !== 'forest') {
        assert.deepEqual(current.ground.canvas, [512, 512]);
        assert.equal(current.ground.alpha, 1);
        assert.deepEqual(current.ground.extent, [name === 'warden' ? 2200 : 6800, 1500]);
      }
    }
    report.exactPhysicalInvariance = true;
    report.noRuntimeObjectOrTweenIncrease = true;
  }
  if (stage === 'after' || stage === 'correction') {
    const before = JSON.parse(await readFile('docs/environment-cohesion/before/report.json', 'utf8'));
    for (const [name, current] of Object.entries(report.regions)) {
      assert.deepEqual(current.obstacles, before.regions[name].obstacles, `${name}: exact collision data`);
      assert.deepEqual(current.bounds, before.regions[name].bounds, `${name}: movement bounds`);
      assert.equal(current.zoom, before.regions[name].zoom, `${name}: zoom`);
      const extraTextures = stage === 'correction' ? name === 'forest' ? 1 : 2 : 0;
      assert.equal(current.textures, before.regions[name].textures + extraTextures, `${name}: soil asset and one TileSprite backing texture`);
      if (stage === 'correction' && name !== 'forest') {
        assert.equal(current.ground.texture, 'cavern-soil');
        assert.deepEqual(current.ground.canvas, [512, 512], 'No world-sized canvas allocation');
        assert.deepEqual(current.ground.extent, [name === 'warden' ? 2200 : 6800, 1500]);
        assert.equal(current.ground.alpha, 1, 'Opaque substrate covers cache edges');
      }
    }
    report.exactPhysicalInvariance = true;
  }
  assert.deepEqual(errors, []);
  report.pass = true;
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, regions: Object.fromEntries(Object.entries(report.regions).map(([k,v]) => [k,{ ...v, obstacles: v.obstacles.length }])) }, null, 2));
  await browser.close();
}
