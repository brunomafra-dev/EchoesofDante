// Chrome input + explicit DEV encounter setup. No physical device claims.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://127.0.0.1:5182/';
const out = process.argv[3] ?? 'docs/warden-boss/encounter-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless, keyboard/mouse, Gamepad API mock, CDP touch; controlled DEV setup for encounter states', errors };
const watch = p => {
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(page);
  await page.goto(base); await ready(page);
  const state = () => page.evaluate(() => {
    const g = window.__danteGame, s = g.scene.getScene('Game');
    return { area:s.area, p:{...s.player.position}, hp:s.player.hp, maxHp:s.player.maxHp, dead:s.player.isDead,
      boss:s.warden ? {hp:s.warden.health.current, phase:s.warden.phase, state:s.warden.state, attack:s.warden.attackName, dead:s.warden.isDead, canHit:s.warden.canBeHit, position:{...s.warden.position}, shots:s.warden.shots.filter(a=>a.active).length, marks:s.warden.marks.filter(a=>a.visual.visible).length} : null,
      xp:s.progression.xp, level:s.progression.level, echoes:s.progression.echoes.size,
      first:s.firstEchoSeen, gate:s.wardenGateOpen, won:s.wardenDefeated, ending:s.wardenEndingSeen,
      objects:s.children.list.length, rt:s.children.list.filter(a=>a.type==='RenderTexture').length, graphics:s.children.list.filter(a=>a.type==='Graphics').length,
      textures:g.textures.getTextureKeys().length, tweens:s.tweens.getTweens().length, obstacles:s.arena.obstacles.length,
      listeners:[s.input.listenerCount('pointerdown'),s.input.keyboard.listenerCount('keydown')], enemies:s.enemies.length,
      message:s.hud.discoveryMessage.text, musicStopped:s.sounds.musicStopped, aim:s.player.rotation };
  });
  async function key(k, ms=100) { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); await page.waitForTimeout(80); }
  async function position(x,y) { await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x,y});},{x,y});await page.waitForTimeout(100); }
  async function walk(x,y) {
    for(let i=0;i<140;i++) {
      const {p}=await state(),dx=x-p.x,dy=y-p.y;if(Math.hypot(dx,dy)<15)return;
      const keys=[];if(Math.abs(dx)>8)keys.push(dx>0?'d':'a');if(Math.abs(dy)>8)keys.push(dy>0?'s':'w');
      for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(65);for(const k of keys)await page.keyboard.up(k);
    }
    throw new Error(`Route blocked to ${x},${y}: ${JSON.stringify((await state()).p)}`);
  }
  assert.equal((await state()).area,'forest');assert.equal((await state()).echoes,0);assert.equal((await state()).boss,null);
  await page.evaluate(()=>{
    const s=window.__danteGame.scene.getScene('Game');for(const id of ['northern-ruin','mineral-signal','unknown-trace'])s.progression.discover(id);
    s.progression.locateSource();s.progression.openPassage();s.deepPassageOpen=true;s.exteriorEntered=true;s.fragmentSeen=true;s.firstEchoSeen=true;s.wardenGateOpen=true;s.area='warden';s.scene.restart();
  });await page.waitForTimeout(800);
  const initial=await state();assert.deepEqual(initial.p,{x:650,y:760});assert.equal(initial.boss.state,'DORMANT');assert.equal(initial.boss.hp,900);assert.equal(initial.enemies,1);
  assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>=o.radius+18);}));
  await page.screenshot({path:`${out}/arrival.png`});await walk(865,760);
  assert.equal((await state()).boss.state,'INTRO');assert.equal((await state()).boss.canHit,false);
  await position(1080,735);await page.mouse.move(1000,330);await page.mouse.down();await page.waitForTimeout(700);await page.mouse.up();assert.equal((await state()).boss.hp,900);
  assert.equal((await state()).hp,initial.hp);await position(865,760);await page.waitForTimeout(1900);
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.introComplete);
  report.safeEntryIntro=true;
  // Each death occurs while a different hazard is being prepared/active. Existing damage path is used.
  const retries=[];
  for(const pattern of ['sweep','signal','echoes']) {
    await page.evaluate(pattern=>{const s=window.__danteGame.scene.getScene('Game');s.warden.beginAttack(s.time.now,pattern,s.player.position);},pattern);
    if(pattern==='signal')await page.waitForTimeout(1200);
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike(s.warden,{damage:24,ranged:true});});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);
    const lost=await state();assert.equal(lost.boss.shots,0);assert.equal(lost.boss.marks,0);
    await page.waitForTimeout(650);await key('r');await page.waitForTimeout(850);
    const retry=await state();assert.deepEqual(retry.p,{x:650,y:760});assert.equal(retry.hp,retry.maxHp);assert.equal(retry.boss.hp,900);assert.equal(retry.boss.phase,1);assert.equal(retry.boss.state,'DORMANT');assert.equal(retry.enemies,1);
    for(const k of ['xp','level','echoes','first','gate'])assert.equal(retry[k],initial[k]);
    retries.push(retry);
    await walk(865,760);await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.introComplete);
  }
  for(const retry of retries.slice(1))for(const k of ['objects','rt','graphics','textures','obstacles','listeners','enemies'])assert.deepEqual(retry[k],retries[0][k],`retry stability ${k}`);
  report.threeDeaths= retries;
  // The final hit is a real saber input; low boss HP is explicit setup, not a balance claim.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.warden.health.current=1;s.warden._phase=3;s.warden.setState('RECOVER',s.time.now,3000);Object.assign(s.player.position,{x:s.warden.position.x-100,y:s.warden.position.y});s.player.invulnerableUntil=0;});
  await page.waitForTimeout(200);
  const aim=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),c=s.cameras.main;return {x:s.warden.position.x-c.scrollX,y:s.warden.position.y-c.scrollY};});
  await page.mouse.move(aim.x,aim.y);await page.mouse.down();await page.waitForTimeout(150);await page.mouse.up();
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').wardenDefeated);
  assert.equal((await state()).enemies,0);assert.equal((await state()).boss.shots,0);assert.equal((await state()).boss.marks,0);
  const won=await state();assert.equal(won.xp,initial.xp);await page.waitForTimeout(2500);assert.ok((await state()).ending);
  await page.screenshot({path:`${out}/victory.png`});await page.waitForTimeout(3100);assert.match((await state()).message,/RETORNO CONFIRMADO/);await page.screenshot({path:`${out}/transmission.png`});
  await page.waitForTimeout(4100);assert.match((await state()).message,/PORTAL DO SINAL ABERTO/);assert.equal((await state()).obstacles,19);
  await walk(1000,760);await walk(750,760);await walk(610,760);await key('e');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='cavern');await page.waitForTimeout(750);assert.ok((await state()).won);assert.deepEqual((await state()).p,{x:6060,y:740});
  // Route tolerance can stop just short of x=6230. Cross the actual threshold
  // with a real movement input instead of waiting for an untriggered transition.
  await walk(6240,740);await key('d',140);await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='warden');await page.waitForTimeout(800);
  assert.equal((await state()).boss,null);assert.equal((await state()).enemies,0);assert.ok((await state()).won);assert.equal((await state()).xp,initial.xp);report.finalSequenceUniqueAndReturn=true;
  const settled=await state();await page.waitForTimeout(7000);const idle=await state();for(const k of ['objects','rt','graphics','textures','obstacles','enemies'])assert.equal(idle[k],settled[k]);report.victoryStable=idle;
  // Restart a fresh undefeated attempt for mocked input and resolution inspection.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.wardenDefeated=false;s.wardenEndingSeen=false;s.scene.restart();});await page.waitForTimeout(750);
  await page.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[1,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});await page.waitForTimeout(300);await page.evaluate(()=>window.qaPad.axes[0]=0);
  assert.ok((await state()).p.x>690);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
  await page.evaluate(()=>window.qaPad.buttons[5].value=1);await page.waitForTimeout(80);assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.isDashing));await page.evaluate(()=>window.qaPad.buttons[5].value=0);await page.waitForTimeout(350);
  await page.evaluate(()=>window.qaPad.buttons[6].value=1);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');await page.evaluate(()=>window.qaPad.buttons[6].value=0);await page.waitForTimeout(130);assert.notEqual(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await page.evaluate(()=>navigator.getGamepads=()=>[]);report.gamepadMock=true;
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.warden.beginIntro(s.time.now);Object.assign(s.player.position,{x:1000,y:890});s.player.invulnerableUntil=Infinity;});await page.waitForTimeout(2800);
  report.resolutions=[];
  for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(350);const box=await page.locator('canvas').boundingBox();assert.ok(box.width<=width+1&&box.height<=height+1);report.resolutions.push(`${width}x${height}`);await page.screenshot({path:`${out}/arena-${width}x${height}.png`});
  }
  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const touch=await mobile.newPage();watch(touch);await touch.goto(base);await ready(touch);
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='warden';s.firstEchoSeen=true;s.wardenGateOpen=true;s.scene.restart();});await touch.waitForTimeout(750);
  const cdp=await mobile.newCDPSession(touch);
  async function gesture(selector,dx=0,dy=0,ms=200) {
    const box=await touch.locator(selector).boundingBox();assert.ok(box);const x=box.x+box.width/2,y=box.y+box.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});if(dx||dy)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});await touch.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(90);
  }
  await gesture('.touch-move',45,0,450);assert.ok(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>715));
  await gesture('[data-action="attack"]',40,-20,180);await gesture('[data-action="dash"]');await touch.waitForTimeout(400);
  const box=await touch.locator('[data-action="charge"]').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+40,y:y-25,id:2}]});await touch.waitForTimeout(400);assert.equal(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(150);assert.notEqual(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:1000,y:890});s.player.invulnerableUntil=Infinity;});await touch.waitForTimeout(3200);await touch.screenshot({path:`${out}/touch-boss.png`});assert.equal(await touch.evaluate(()=>window.visualViewport.scale),1);report.touchEmulated=true;await mobile.close();
  await page.reload();await ready(page);assert.equal((await state()).area,'forest');assert.equal((await state()).echoes,0);assert.equal((await state()).won,false);report.reloadNewSession=true;
  assert.deepEqual(errors,[]);report.passed=true;
} finally {await writeFile(`${out}/qa-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
