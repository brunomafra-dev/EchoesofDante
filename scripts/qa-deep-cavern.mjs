// Local QA: Playwright + Chrome already installed. DEV hooks arrange approaches;
// traversal, interactions and attacks use browser input. No physical-device claim.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5174/';
const stage=process.argv[3]??'after';
const out='docs/expansion-deep-cavern';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
const result={stage,method:'Chrome headless; DEV setup + real inputs; no physical playtest',errors};
try {
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const ready=()=>page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);
  const state=()=>page.evaluate(()=>{
    const g=window.__danteGame,s=g.scene.getScene('Game');
    return {area:s.area,position:{...s.player.position},xp:s.progression.xp,level:s.progression.level,hp:s.player.hp,echoes:s.progression.echoes.size,passage:s.progression.passageOpen,deep:s.deepPassageOpen,seen:s.deepAreaSeen,entered:s.deepCavernEntered,end:s.deepEndSeen,enemies:s.enemies.length,objects:s.children.list.length,textures:g.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,inputListeners:{pointerDown:s.input.listenerCount('pointerdown'),keydown:s.input.keyboard.listenerCount('keydown')},obstacles:s.arena.obstacles,bounds:s.movementBounds};
  });
  async function position(x,y){await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x,y});s.player.invulnerableUntil=Infinity;},{x,y});await page.waitForTimeout(80);}
  async function key(k,ms=70){await page.keyboard.down(k);await page.waitForTimeout(ms);await page.keyboard.up(k);await page.waitForTimeout(90);}
  async function walk(x,y){
    let attempts=0;
    while(attempts++<65){
      const p=(await state()).position,dx=x-p.x,dy=y-p.y;
      if(Math.hypot(dx,dy)<14)return;
      const keys=[];if(Math.abs(dx)>7)keys.push(dx>0?'d':'a');if(Math.abs(dy)>7)keys.push(dy>0?'s':'w');
      for(const k of keys)await page.keyboard.down(k);
      await page.waitForTimeout(Math.min(90,Math.max(25,Math.hypot(dx,dy)/245*1000)));
      for(const k of keys)await page.keyboard.up(k);
    }
    throw new Error(`Path blocked approaching ${x},${y}: ${JSON.stringify((await state()).position)}`);
  }
  async function measure(){
    return page.evaluate(async()=>{const g=window.__danteGame,v=[];for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,200));v.push(g.loop.actualFps);}return {mean:v.reduce((a,b)=>a+b,0)/v.length,min:Math.min(...v),max:Math.max(...v)};});
  }
  const started=Date.now();await page.goto(base);await ready();result.startupMs=Date.now()-started;
  if(stage==='before'){
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.deepPassageOpen=true;s.scene.restart();});
    await page.waitForTimeout(400);await ready();await position(1950,740);
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});s.cameras.main.stopFollow().centerOn(2130,730);});
    await page.mouse.move(970,390);await page.waitForTimeout(8000);
    await page.screenshot({path:`${out}/before-deep.png`});result.scene=await state();result.fps=await measure();
  }else{
    assert.equal((await state()).echoes,0);
    const initial=(await state()).position;await key('d',180);assert.ok((await state()).position.x>initial.x+15);
    for(const [x,y] of [[560,700],[1870,900],[1500,360]]){await position(x,y);await key('e');}
    assert.equal((await state()).echoes,3);assert.equal((await state()).xp,120);
    await position(1870,340);await key('e');await position(1670,290);await key('e');await page.waitForTimeout(1700);
    assert.ok((await state()).passage);
    await position(1870,335);await key('w',380);
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='cavern');await page.waitForTimeout(400);
    assert.equal((await state()).enemies,2); // Deep residents cannot be clamped into the closed chamber.
    result.previousFlow=true;
    await position(1540,630);await walk(1620,525);
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').deepPassageOpen);
    assert.equal((await state()).enemies,4);
    result.passageOpened=true;
    // Preserve real AI; invulnerability lets the test inspect traversal without clearing residents.
    for(const [x,y] of [[1690,510],[1775,500],[1850,560],[1930,650],[1940,805],[1950,900],[2030,930],[2110,890]])await walk(x,y);
    result.sideRoute=true;
    await page.screenshot({path:`${out}/side-route.png`});
    for(const [x,y] of [[2190,850],[2300,825],[2350,760],[2425,735]])await walk(x,y);
    assert.ok((await state()).end);result.finalWithLivingHollows=(await state()).enemies===4;assert.ok(result.finalWithLivingHollows);
    result.liveFps=await measure();
    await page.screenshot({path:`${out}/continuation.png`});
    for(const [x,y] of [[2350,810],[2240,825],[2110,815],[2090,660]])await walk(x,y);
    assert.ok((await state()).seen);result.poiResponded=true;
    await page.screenshot({path:`${out}/poi.png`});
    for(const [x,y] of [[2030,605],[1910,630],[1830,540],[1770,500],[1690,510],[1600,565]])await walk(x,y);
    result.returnPath=true;
    // Match the original view after inspecting the entire region.
    await position(1950,740);
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>{e.qaUpdate=e.update;e.update=()=>{};});s.cameras.main.stopFollow().centerOn(2130,730);});
    await page.mouse.move(970,390);await page.waitForTimeout(8000);
    await page.screenshot({path:`${out}/after-deep.png`});result.scene=await state();result.fps=await measure();
    // Physical bases stay simple, visible and stable under normal travel and Dash.
    await position(1920,740);await key('d',450);assert.ok((await state()).position.x<=1940);
    await position(1920,740);await page.keyboard.down('d');await key('Space',180);await page.keyboard.up('d');assert.ok((await state()).position.x<=1940);
    await position(2010,940);await key('s',350);assert.ok((await state()).position.y<=968);
    await position(2100,652);await key('d',450);assert.ok((await state()).position.x<2140);
    await position(2410,738);await key('d',450);assert.ok((await state()).position.x<=2447);
    result.dividerMineralPoiAndLimitSolid=true;
    // Isolate one resident for deterministic real-input combat, retaining its HP/AI values.
    await position(2090,820);
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.enemies[2].position,{x:2170,y:820});});
    await page.mouse.move(880,450);await page.mouse.click(880,450);await page.waitForTimeout(380);
    assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies[2].health.current),34);
    await page.keyboard.down('q');await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
    await page.keyboard.up('q');await page.waitForTimeout(700);assert.equal((await state()).xp,135);
    result.strikeChargeXp=true;
    await key('Space',150);result.dash=true;
    const retained=await state();
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;const e=s.enemies.at(-1);Object.assign(e.position,{x:s.player.position.x+30,y:s.player.position.y});e.update=e.qaUpdate;});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await page.waitForTimeout(650);await key('r');await page.waitForTimeout(450);
    const respawn=await state();assert.equal(respawn.xp,retained.xp);assert.equal(respawn.level,retained.level);assert.equal(respawn.echoes,3);assert.ok(respawn.passage&&respawn.deep&&respawn.entered);assert.equal(respawn.hp,110);assert.deepEqual(respawn.position,{x:1870,y:580});
    for(const obstacle of respawn.obstacles)assert.ok(Math.hypot(respawn.position.x-obstacle.x,respawn.position.y-obstacle.y)>=obstacle.radius+18);
    result.deathRespawn=respawn;
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;});
    await walk(1940,810);await walk(2030,930);result.traversalAfterRespawn=true;
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});Object.assign(s.enemies[2].position,{x:2170,y:820});s.cameras.main.stopFollow().centerOn(2130,730);});
    await position(2090,820);await page.mouse.move(880,450);await page.mouse.click(880,450);await page.waitForTimeout(400);
    await page.keyboard.down('q');await page.waitForTimeout(500);await page.keyboard.up('q');await page.waitForTimeout(700);
    assert.equal((await state()).xp,135);result.noRepeatedSpawnXp=true;
    await position(1900,620);
    await page.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[1,0,0,-1],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});
    await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
    await page.waitForTimeout(2600);
    await page.evaluate(()=>{window.qaPad.axes=[0,0,1,0];window.qaPad.buttons[6].value=1;});await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
    await page.evaluate(()=>{window.qaPad.buttons[6].value=0;});await page.waitForTimeout(350);result.gamepadMock=true;
    await page.evaluate(()=>{navigator.getGamepads=()=>[];const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});});
    // Compare fully respawned resident populations, rather than a scene with one death.
    await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await page.waitForTimeout(600);await ready();
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.enemies.forEach(e=>e.update=()=>{});});
    await page.waitForTimeout(1800);const stable=await state();await page.waitForTimeout(5000);const idle=await state();
    for(const k of ['objects','textures','tweens'])assert.equal(idle[k],stable[k]);
    for(let i=0;i<3;i++){await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await page.waitForTimeout(600);await ready();const s=await state();for(const k of ['objects','textures','tweens'])assert.equal(s[k],stable[k]);assert.deepEqual(s.inputListeners,stable.inputListeners);}
    result.threeRestartsStable=true;
    result.resolutions=[];
    for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(200);const box=await page.locator('canvas').boundingBox();assert.ok(box.width<=width+1&&box.height<=height+1);result.resolutions.push(`${width}x${height}`);
      await page.screenshot({path:`${out}/view-${width}x${height}.png`});
    }
    // Touch: actual multi-contact events in Chrome emulation; no input changes.
    const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
    const touch=await mobile.newPage();touch.on('pageerror',e=>errors.push(e.message));await touch.goto(base);
    await touch.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);
    await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.deepPassageOpen=true;s.deepCavernEntered=true;s.scene.restart();});await touch.waitForTimeout(550);
    await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;s.enemies.forEach(e=>e.update=()=>{});});
    const cdp=await mobile.newCDPSession(touch);
    async function gesture(selector,dx,dy,ms=180){const b=await touch.locator(selector).boundingBox();assert.ok(b);const x=b.x+b.width/2,y=b.y+b.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});if(dx||dy)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});await touch.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(250);}
    await gesture('.touch-move',45,0);assert.ok(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>1875));
    await gesture('[data-action="attack"]',-35,-25);await gesture('[data-action="charge"]',40,0,350);await gesture('[data-action="dash"]',0,0);
    assert.equal(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'touch');assert.equal(await touch.evaluate(()=>window.visualViewport.scale),1);
    await touch.screenshot({path:`${out}/touch-deep.png`});await mobile.close();result.touchEmulated=true;
  }
  assert.equal(errors.length,0);await writeFile(`${out}/${stage}-measurements.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,scene:result.scene&&{...result.scene,obstacles:undefined},deathRespawn:result.deathRespawn&&{...result.deathRespawn,obstacles:undefined}},null,2));
}finally{await browser.close();}
