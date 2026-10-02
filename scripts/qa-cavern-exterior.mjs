// Chrome headless + DEV state setup; real keyboard/mouse traversal and combat.
// No claims of physical PC/gamepad/iPhone validation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5176/';
const out = process.argv[3] ?? 'docs/expansion-sprint-02';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless; DEV setup + real inputs; no physical device', errors };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const ready = () => page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
  const state = () => page.evaluate(() => {
    const g = window.__danteGame, s = g.scene.getScene('Game');
    return { position: { ...s.player.position }, hp: s.player.hp, maxHp: s.player.maxHp, xp: s.progression.xp, level: s.progression.level, echoes: s.progression.echoes.size, area: s.area, deep: s.deepPassageOpen, deeper: s.deeperEntered, exterior: s.exteriorEntered, fragment: s.fragmentSeen, approach: s.approachSeen, enemies: s.enemies.length, objects: s.children.list.length, textures: g.textures.getTextureKeys().length, renderTextures: s.children.list.filter(o => o.type === 'RenderTexture').length, tweens: s.tweens.getTweens().length, listeners: [s.input.listenerCount('pointerdown'), s.input.keyboard.listenerCount('keydown')], bounds: { ...s.movementBounds } };
  });
  async function key(key, ms = 75) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(80); }
  async function position(x, y) {
    await page.evaluate(({ x, y }) => { const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position, { x, y }); s.player.invulnerableUntil = Infinity; }, { x, y });
    await page.waitForTimeout(80);
  }
  async function walk(x, y) {
    for (let attempt = 0; attempt < 90; attempt++) {
      const p = (await state()).position, dx = x - p.x, dy = y - p.y;
      if (Math.hypot(dx, dy) < 14) return;
      const keys = [];
      if (Math.abs(dx) > 7) keys.push(dx > 0 ? 'd' : 'a');
      if (Math.abs(dy) > 7) keys.push(dy > 0 ? 's' : 'w');
      for (const key of keys) await page.keyboard.down(key);
      await page.waitForTimeout(Math.min(90, Math.max(25, Math.hypot(dx, dy) / 245 * 1000)));
      for (const key of keys) await page.keyboard.up(key);
    }
    throw new Error(`Blocked route to ${x},${y}: ${JSON.stringify((await state()).position)}`);
  }
  const begin = Date.now(); await page.goto(base); await ready(); report.startupMs = Date.now() - begin;
  assert.equal((await state()).echoes, 0);
  const start = (await state()).position; await key('d', 180); assert.ok((await state()).position.x > start.x + 15);
  for (const [x, y] of [[560,700], [1870,900], [1500,360]]) { await position(x,y); await key('e'); }
  assert.equal((await state()).echoes, 3); assert.equal((await state()).xp, 120);
  await position(1870,340); await key('e'); await position(1670,290); await key('e'); await page.waitForTimeout(1700);
  await position(1870,335); await key('w',380);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'cavern'); await page.waitForTimeout(500);
  assert.equal((await state()).enemies, 2);
  await position(1540,630); await walk(1620,525);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').deepPassageOpen);
  report.oldFlow = true;
  // Continue through the approved region using real movement, then the new route.
  const route = [[1690,510],[1775,500],[1850,560],[1930,650],[1940,805],[1950,900],[2030,930],[2110,890],[2190,850],[2300,825],[2350,760],[2425,735],
    [2580,760],[2660,650],[2850,650],[2930,730],[3020,835],[3170,860],[3320,940],[3500,990],[3550,875],[3650,805],[3780,915],[3900,900],[4060,870],[4210,760],[4400,740],[4560,740],[4750,750],[4900,740],[5030,740],[5150,710]];
  for (const [x,y] of route) await walk(x,y);
  const end = await state(); assert.equal(end.enemies, 19); assert.ok(end.deeper && end.exterior && end.approach, JSON.stringify(end));
  report.traversalWithoutClearing = end;
  await page.screenshot({ path: `${out}/approach.png` });
  await walk(5030,740); await walk(4910,745);
  await position(4870,720); await key('e');
  assert.ok((await state()).fragment); assert.equal((await state()).xp, 120);
  await key('e'); assert.equal((await state()).xp,120); report.fragmentOnceNoXp = true;
  await page.screenshot({ path: `${out}/fragment.png` });
  // Return through the same terrain; no kill gate or one-way teleport.
  for(const [x,y] of [[4750,750],[4560,740],[4400,740],[4210,760],[4060,870],[3900,900],[3780,915],[3650,805],[3550,875],[3500,990],[3320,940],[3170,860],[3020,835],[2930,730],[2850,650],[2660,650],[2580,760],[2425,735]]) await walk(x,y);
  report.returnRoute = true;
  // Isolate the actors without changing their health/attack values.
  await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.enemies.forEach(e => { e.qaUpdate = e.update; e.update = () => {}; }); });
  async function isolate(kind, px, py, ex, ey) {
    await position(px,py);
    await page.evaluate(({kind,px,py,ex,ey}) => {
      const s = window.__danteGame.scene.getScene('Game'); s.enemies.forEach((e,i) => { e.update = () => {}; Object.assign(e.position,{x:1200+i*8,y:950}); });
      const e = s.enemies.find(e => e.kind === kind); window.qaEnemy = e;
      Object.assign(e.position,{x:ex,y:ey}); e.state = 'IDLE'; e.attackAt = -Infinity; e.hurtUntil = 0; e.shot = undefined;
      e.update = e.qaUpdate; s.player.invulnerableUntil = 0; s.player.health.current = s.player.maxHp;
      s.cameras.main.stopFollow().centerOn(px,py);
    },{kind,px,py,ex,ey}); await page.waitForTimeout(60);
  }
  await isolate('skitter',2920,650,2870,650); const meleeHp = (await state()).hp;
  await page.waitForTimeout(900); assert.equal((await state()).hp,meleeHp-9); report.skitterLungeDamageOnce = true;
  await isolate('spitter',2980,650,2780,650); const rangedHp = (await state()).hp;
  await page.waitForTimeout(1900); assert.equal((await state()).hp,rangedHp-10); report.spitterShotDamage = true;
  await isolate('spitter',2980,650,2780,650); const dodgeHp = (await state()).hp;
  await page.waitForTimeout(250);
  await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game'); s.player.position.y=810; });
  await page.waitForTimeout(1600); assert.equal((await state()).hp,dodgeHp); report.lockedShotCanBeDodged = true;
  await isolate('spitter',2980,650,2780,650); const wallHp = (await state()).hp;
  await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game'); window.qaWall={x:2860,y:650,radius:25}; s.arena.obstacles.push(window.qaWall); });
  await page.waitForTimeout(1700); assert.equal((await state()).hp,wallHp); assert.equal(await page.evaluate(()=>window.qaEnemy.projectile.visible),false);
  await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game');s.arena.obstacles.splice(s.arena.obstacles.indexOf(window.qaWall),1); }); report.shotBlockedByObstacle = true;
  // Real LMB + Q hits both new archetypes. Each death awards existing 15 XP once.
  report.newCreatureKills = [];
  for(const kind of ['skitter','spitter']) {
    await isolate(kind,2860,650,2940,650);
    await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;window.qaEnemy.update=()=>{}; });
    const xp = (await state()).xp, initialHp = await page.evaluate(()=>window.qaEnemy.health.current);
    await page.mouse.move(720,360); await page.mouse.click(720,360); await page.waitForTimeout(380);
    assert.equal(await page.evaluate(()=>window.qaEnemy.health.current),initialHp-34);
    if(kind==='spitter'){await page.mouse.click(720,360);await page.waitForTimeout(380);assert.equal(await page.evaluate(()=>window.qaEnemy.health.current),initialHp-68);}
    await page.waitForTimeout(3300);await page.keyboard.down('q');await page.waitForTimeout(820);await page.keyboard.up('q');await page.waitForTimeout(700);
    assert.ok(await page.evaluate(()=>window.qaEnemy.isDead));assert.equal((await state()).xp,xp+15);
    report.newCreatureKills.push({kind,xp:(await state()).xp});
  }
  // Player collisions, diagonal navigation and Dash use the unchanged resolver.
  await position(2980,700);await key('d',450);assert.ok((await state()).position.x<=3009);
  await key('Space',200);assert.ok((await state()).position.x<=3009);report.rockAndDashSolid = true;
  // Actual enemy attack causes death; session and safe exterior checkpoint survive.
  await position(4800,740);
  const retained = await state();
  await page.evaluate(() => {
    const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;
    const e=s.enemies.find(e=>!e.kind);Object.assign(e.position,{x:s.player.position.x+30,y:s.player.position.y});e.update=e.qaUpdate;e.state='IDLE';
  });
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await page.waitForTimeout(650);await key('r');await page.waitForTimeout(600);
  const revived=await state();assert.deepEqual(revived.position,{x:4600,y:740});assert.equal(revived.xp,retained.xp);assert.equal(revived.echoes,3);assert.equal(revived.hp,revived.maxHp);assert.ok(revived.deep&&revived.fragment&&revived.exterior);
  assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>=o.radius+18);}));
  report.deathSafeRespawn = revived;
  // Previously defeated spawn cannot be farmed after respawn.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.enemies.forEach(e=>{e.qaUpdate=e.update;e.update=()=>{};});const e=s.enemies.find(e=>e.kind==='skitter');window.qaEnemy=e;Object.assign(e.position,{x:4640,y:740});s.cameras.main.stopFollow().centerOn(4560,740);});
  await page.keyboard.down('q');await page.waitForTimeout(820);await page.keyboard.up('q');await page.waitForTimeout(700);assert.equal((await state()).xp,retained.xp);report.noDuplicateXp = true;
  await position(4550,760);await page.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[1,0,0,-1],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});
  await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
  await page.waitForTimeout(3300);await page.evaluate(()=>{window.qaPad.axes=[0,0,1,0];window.qaPad.buttons[6].value=1;});await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await page.evaluate(()=>{window.qaPad.buttons[6].value=0;});await page.waitForTimeout(500);report.gamepadMock = true;
  await page.evaluate(()=>{navigator.getGamepads=()=>[];window.__danteGame.scene.getScene('Game').scene.restart();});await page.waitForTimeout(600);
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity);
  await page.waitForTimeout(8000);
  report.livePerformance=await page.evaluate(async()=>{const g=window.__danteGame,values=[];for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,200));values.push(g.loop.actualFps);}return {mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values)};});
  const stable = await state();await page.waitForTimeout(6000);const idle=await state();
  for(const k of ['objects','textures','renderTextures','tweens'])assert.equal(idle[k],stable[k]);
  for(let i=0;i<3;i++){await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await page.waitForTimeout(1800);const s=await state();for(const k of ['objects','textures','renderTextures','tweens'])assert.equal(s[k],stable[k],`${k} on restart ${i}`);assert.deepEqual(s.listeners,stable.listeners);}
  report.stableScene=stable;report.threeRestartsStable = true;
  // The new lower entry checkpoint is safe before the exterior has been reached.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.exteriorEntered=false;s.scene.restart();});await page.waitForTimeout(650);
  assert.deepEqual((await state()).position,{x:2580,y:980});assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>=o.radius+18);}));report.deeperCheckpointSafe = true;
  await position(2750,925);await walk(2580,980);await walk(2660,650);report.checkpointReachable = true;
  report.resolutions = [];
  for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]){
    await page.setViewportSize({width,height});await position(4800,750);await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.cameras.main.stopFollow().centerOn(4800,750);});await page.waitForTimeout(250);
    const box=await page.locator('canvas').boundingBox();assert.ok(box.width<=width+1&&box.height<=height+1);report.resolutions.push(`${width}x${height}`);await page.screenshot({path:`${out}/view-${width}x${height}.png`});
  }
  const mobile = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const touch = await mobile.newPage();touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto(base);await touch.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.deepPassageOpen=true;s.deeperEntered=true;s.exteriorEntered=true;s.scene.restart();});await touch.waitForTimeout(650);
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.enemies.forEach(e=>e.update=()=>{});});
  const cdp=await mobile.newCDPSession(touch);
  async function gesture(selector,dx,dy,hold=180){const b=await touch.locator(selector).boundingBox();assert.ok(b);const x=b.x+b.width/2,y=b.y+b.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});if(dx||dy)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});await touch.waitForTimeout(hold);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(250);}
  await gesture('.touch-move',45,0);assert.ok(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>4570));
  await gesture('[data-action="attack"]',-35,-25);await gesture('[data-action="charge"]',40,0,350);await gesture('[data-action="dash"]',0,0);
  await touch.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:4870,y:720}));await touch.waitForTimeout(120);await gesture('[data-action="interact"]',0,0);assert.ok(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').fragmentSeen));
  assert.equal(await touch.evaluate(()=>window.visualViewport.scale),1);await touch.screenshot({path:`${out}/touch-exterior.png`});await mobile.close();report.touchEmulated = true;
  assert.equal(errors.length,0);await writeFile(`${out}/measurements.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
