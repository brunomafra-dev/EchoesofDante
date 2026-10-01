// Optional local QA: requires Playwright and Chrome already available locally.
// Run against the Vite dev server (DEV-only inspection hooks, not production).
// node scripts/qa-environment-art.mjs [base URL] [optional pre-change JSON]
// Optional baseline uses matchedViews or top-level forest/cavern objects with obstacles/bounds.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173/';
const before = process.argv[3] ? JSON.parse(await readFile(process.argv[3], 'utf8')) : undefined;
const output = fileURLToPath(new URL('../docs/environment-art-pass/', import.meta.url));
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
  const startup=Date.now();
  await page.goto(base);
  await gameReady();
  result.localStartupMs=Date.now()-startup;
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').progression.echoes.size), 0);
  await page.waitForTimeout(1000);
  result.forest = await snapshot(false, true);

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

  // Standard Gamepad API mock; no physical controller claim.
  await position(2000,800);
  await page.evaluate(()=>{
    window.qaPad = {mapping:'standard',connected:true,axes:[1,0,0,-1],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
    navigator.getGamepads=()=>[window.qaPad];
  });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
  assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>2010));
  await page.evaluate(()=>{window.qaPad.axes=[0,0,1,0];window.qaPad.buttons[6].value=1;});
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await page.evaluate(()=>{window.qaPad.buttons[6].value=0;}); await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'READY');
  result.gamepadMockMovementAimHoldRelease=true;

  // Chrome touch emulation with real CDP touch contacts and pointer capture.
  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const touchPage=await mobile.newPage();
  touchPage.on('pageerror',e=>errors.push(e.message));
  await touchPage.goto(base);
  await touchPage.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await touchPage.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.scene.restart();});
  await touchPage.waitForTimeout(400);
  await touchPage.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:1100,y:740});s.player.invulnerableUntil=Infinity;s.enemies.forEach(e=>e.update=()=>{});});
  const cdp=await mobile.newCDPSession(touchPage);
  async function gesture(selector,dx,dy,hold=120) {
    const box=await touchPage.locator(selector).boundingBox(); assert.ok(box);
    const x=box.x+box.width/2,y=box.y+box.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    if(dx||dy) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});
    await touchPage.waitForTimeout(hold);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchPage.waitForTimeout(200);
  }
  await gesture('.touch-move',45,0);
  assert.ok(await touchPage.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>1110));
  await gesture('[data-action="attack"]',-35,-25);
  assert.equal(await touchPage.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'touch');
  await gesture('[data-action="charge"]',-35,0,350);
  assert.equal(await touchPage.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'READY');
  await gesture('[data-action="dash"]',0,0);
  assert.equal(await touchPage.evaluate(()=>window.visualViewport.scale),1);
  await touchPage.screenshot({path:output+'/touch-cavern.png'});
  await mobile.close(); result.touchEmulatedMoveStrikeChargeDash=true;

  result.matchedViews = {};
  for (const [name, filename, area, px, py, cx, cy, deep] of [
    ['forest','forest','forest',650,1150,850,1000,false],
    ['forestNorth','forest-north','forest',1500,360,1560,330,false],
    ['cavern','cavern','cavern',1000,690,950,660,false],
    ['cavernFace','cavern-face','cavern',1300,740,1470,640,false],
    ['deep','deep','cavern',2040,810,2110,720,true],
  ]) {
    await page.goto(base);
    await gameReady();
    if (area === 'cavern') {
      await page.evaluate(({area,deep}) => {
        const s=window.__danteGame.scene.getScene('Game'); s.area=area; s.deepPassageOpen=deep; s.scene.restart();
      },{area,deep});
      await page.waitForTimeout(300); await gameReady();
    }
    await position(px,py);
    await page.evaluate(({cx,cy})=>{
      const s=window.__danteGame.scene.getScene('Game');
      s.enemies.forEach(e=>{ e.update=()=>{}; });
      s.cameras.main.stopFollow().centerOn(cx,cy);
    },{cx,cy});
    await page.mouse.move(970,390); await page.waitForTimeout(1000);
    const view=await snapshot(false,true);
    if(before) { assert.deepEqual(view.obstacles,before[name].obstacles); assert.deepEqual(view.bounds,before[name].bounds); }
    delete view.obstacles;
    result.matchedViews[name]=view;
    await page.locator('canvas').screenshot({path:output+'/'+filename+'-after.png'});
  }
  result.physicsUnchanged = Boolean(before);
  const stable=await snapshot();
  await page.waitForTimeout(5000);
  const stableAfter=await snapshot();
  assert.equal(stableAfter.objects,stable.objects);
  assert.equal(stableAfter.textures,stable.textures);
  assert.equal(stableAfter.tweens,stable.tweens);
  for(let i=0;i<3;i++) {
    await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());
    await page.waitForTimeout(400); await gameReady();
    const now=await snapshot();
    assert.equal(now.objects,stable.objects); assert.equal(now.textures,stable.textures); assert.equal(now.tweens,stable.tweens);
  }
  result.idleAndThreeRestartsStable=true;
  result.resolutions = [];
  for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const canvas = await page.locator('canvas').boundingBox();
    assert.ok(canvas.x >= -1 && canvas.y >= 0 && canvas.x + canvas.width <= width + 1 && canvas.y + canvas.height <= height + 1);
    result.resolutions.push(`${width}x${height}`);
  }
  await page.goto(new URL('rendering-lab.html',base).href);
  await page.waitForFunction(()=>window.__danteRenderingLab?.scene.getScene('RockRenderingLab').children.list.length===25);
  assert.equal((await snapshot(true)).tweens,0);
  result.originalLabIntact=true;
  assert.equal(errors.length, 0);
  result.noExperimentalAssetsInGame = true;
  result.before = before && Object.fromEntries(['forest','forestNorth','cavern','cavernFace','deep'].map(name=>[name,{
    fps:before[name].fps,objects:before[name].objects,tweens:before[name].tweens,renderTextures:before[name].RT,
  }]));
  // Physics data was compared in memory; keep the report small.
  result.forest.obstacles = result.cavern.obstacles = undefined;
  await writeFile(`${output}/measurements.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
