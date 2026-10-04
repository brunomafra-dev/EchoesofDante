// Browser inputs and DEV scene inspection. No claim of a physical playtest.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/warrior-quality-reference/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless, browser keyboard/mouse; no physical playtest', errors };
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
const watch = p => {
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
const counts = p => p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return {
  rootObjects: s.children.list.length, textures: s.textures.getTextureKeys().length,
  graphics: s.children.list.filter(o => o.type === 'Graphics').length,
  tweens: s.tweens.getTweens().length, renderTextures: s.children.list.filter(o => o.type === 'RenderTexture').length,
}; });
const stage = async p => {
  await p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game');
    s.enemies.forEach(e => { e.update = () => {}; }); Object.assign(s.player.position, { x: 1080, y: 820 });
    s.player.invulnerableUntil = Infinity; s.cameras.main.stopFollow().centerOn(1070, 750);
  });
  await p.mouse.move(940, 420); await p.waitForTimeout(100);
};
const key = async (p, code, ms) => { await p.keyboard.down(code); await p.waitForTimeout(ms); await p.keyboard.up(code); };
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage(); watch(page);
  await page.goto(`${base}quality-reference.html?warrior=original`); await ready(page); await stage(page);
  await page.waitForTimeout(10100);
  const before = await counts(page);
  await page.screenshot({ path: `${out}/warrior-before.png` });
  const geometry = await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return { bounds: s.arena.bounds, obstacles: s.arena.obstacles }; });
  await page.goto(`${base}quality-reference.html`); await ready(page); await stage(page); await page.waitForTimeout(10100);
  assert.deepEqual(await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return { bounds: s.arena.bounds, obstacles: s.arena.obstacles }; }), geometry);
  const after = await counts(page); assert.equal(after.rootObjects, before.rootObjects);
  assert.equal(after.textures, before.textures + 3); assert.equal(after.graphics, before.graphics);
  await page.screenshot({ path: `${out}/warrior-after.png` });
  for (const [width, height] of [[1280,720], [1366,768], [1920,1080], [844,390]]) {
    await page.setViewportSize({width,height}); await page.waitForTimeout(200);
    assert.ok(await page.locator('.quality-navigation').evaluate(n => { const b = n.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight; }));
  }
  await page.setViewportSize({width:1280,height:720});
  await page.waitForTimeout(350); // Let FIT canvas/pointer coordinates settle.
  for (const [name, mx, my, keyName, flipped] of [
    ['front',650,600,'warrior-poses-front',false], ['back',650,180,'warrior-poses-back',false],
    ['right',940,420,'warrior-poses-side',false], ['left',380,420,'warrior-poses-side',true],
  ]) {
    await page.mouse.move(mx,my); await page.waitForTimeout(100);
    assert.ok(await page.evaluate(v => { const p = window.__danteGame.scene.getScene('Game').player;
      const foot = p.torso.getWorldTransformMatrix().transformPoint(0,108);
      return p.torso.texture.key === v.keyName && p.torso.flipX === v.flipped && !p.leftLeg.visible && !p.rightLeg.visible
        && Math.abs(foot.y - p.position.y - 39) < .001 && Math.abs(p.bodyRig.rotation + p.view.rotation) < .001;
    }, {keyName,flipped}));
    await page.screenshot({path:`${out}/pose-${name}.png`});
  }
  // Observe actual gameplay states/frames and grip attachment while moving
  // and executing abilities; no direct calls to painted animation helpers.
  await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game');
    window.qaPoses = {}; window.qaGripError = 0;
    window.qaObserve = () => { const p = s.player, state = p.animationState;
      (window.qaPoses[state] ??= new Set()).add(Number(p.torso.frame.name));
      const a = p.weapon.view.getWorldTransformMatrix().transformPoint(p.weapon.supportGripX,0);
      const b = p.supportGlove.getWorldTransformMatrix().transformPoint(0,0);
      window.qaGripError = Math.max(window.qaGripError,Math.hypot(a.x-b.x,a.y-b.y));
    }; s.events.on('postupdate',window.qaObserve);
  });
  await page.mouse.move(940,420);
  await key(page,'d',520); await key(page,'a',520); await key(page,'s',450); await key(page,'w',450);
  await page.mouse.down(); await page.waitForTimeout(100); await page.mouse.up(); await page.waitForTimeout(450);
  await page.keyboard.down('q'); await page.waitForTimeout(350); await page.mouse.move(640,180); await page.waitForTimeout(180);
  await page.screenshot({path:`${out}/pose-charge.png`}); await page.keyboard.up('q'); await page.waitForTimeout(420);
  await key(page,'Space',80); await page.waitForTimeout(550);
  report.poses = await page.evaluate(() => Object.fromEntries(Object.entries(window.qaPoses).map(([state,frames])=>[state,[...frames]])));
  assert.ok([0,1,2,3].every(frame => report.poses.WALK.includes(frame)));
  assert.ok(report.poses.ATTACK_SWING.includes(5)); assert.ok(report.poses.CHARGE.includes(6));
  assert.ok(report.poses.CHARGE_RELEASE.includes(5)); assert.ok(report.poses.DASH.includes(7));
  report.maxGripError = await page.evaluate(() => window.qaGripError); assert.ok(report.maxGripError < .001);
  await page.evaluate(() => window.__danteGame.scene.getScene('Game').events.off('postupdate',window.qaObserve));
  const settled = await counts(page);
  const fps = await page.evaluate(() => new Promise(resolve => { const s = window.__danteGame.scene.getScene('Game'), samples = [], start = performance.now();
    const observe = () => { samples.push(s.game.loop.actualFps); if (performance.now()-start >= 3500) {
      s.events.off('postupdate',observe); resolve(samples.reduce((a,b)=>a+b,0)/samples.length);
    } }; s.events.on('postupdate',observe);
  }));
  assert.deepEqual(await counts(page),settled); report.performance = {before,after,settled,averagePhaserFps:fps};
  // The normal game receives the approved new presentation without enabling
  // the reference room or changing its Forest entry/session state.
  await page.goto(base); await ready(page); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return s.area === 'forest' && !s.qualityReference && s.player.torso.texture.key.startsWith('warrior-poses-'); }));
  report.normalGameUsesNewArt = true; await context.close();

  // A short real-input demonstration. Invulnerability is recording-only.
  const videoContext = await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
  const clip = await videoContext.newPage(); watch(clip); await clip.goto(`${base}quality-reference.html`); await ready(clip); await stage(clip);
  await clip.mouse.move(940,420); await key(clip,'d',700); await key(clip,'a',700);
  await clip.mouse.move(650,600); await key(clip,'s',550); await key(clip,'w',550);
  await clip.mouse.down(); await clip.waitForTimeout(100); await clip.mouse.up(); await clip.waitForTimeout(400);
  await clip.keyboard.down('q'); await clip.waitForTimeout(600); await clip.keyboard.up('q'); await clip.waitForTimeout(500);
  await key(clip,'Space',80); await clip.waitForTimeout(550);
  const video = clip.video(); await videoContext.close(); await video.saveAs(`${out}/warrior-motion.webm`);
  assert.deepEqual(errors,[]); report.passed = true;
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); console.log(JSON.stringify(report,null,2));
} catch(e) { await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2)); throw e; }
finally { await browser.close(); }
