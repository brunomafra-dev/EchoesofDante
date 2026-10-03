// Trusted multi-touch via Chrome DevTools. Safari/iPhone hardware is not emulated.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5184/',out=process.argv[3]??'docs/resonance-valley/touch-qa';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],report={method:'Chrome headless CDP multi-touch; no physical iPhone validation',errors,layouts:[]};
try{
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.wardenDefeated=true;s.area='valley';s.scene.restart();});await page.waitForTimeout(850);
  const cdp=await context.newCDPSession(page);
  const send=(type,touchPoints=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  const box=selector=>page.locator(selector).boundingBox();
  const center=async selector=>{const b=await box(selector);assert.ok(b);return{x:b.x+b.width/2,y:b.y+b.height/2};};
  const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{p:{...s.player.position},move:{...s.controls.touch.movement},capture:s.controls.touch.moveId!==undefined,
    phase:s.charge.phase,attack:s.attack.lastAttackAt,angle:s.controls.aimFrom(s.player.position),dash:s.player.dashProgress,
    scale:visualViewport.scale,scroll:[scrollX,scrollY],roots:document.querySelectorAll('.touch-controls').length};});
  const reset=async()=>{await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});Object.assign(s.player.position,{x:570,y:850});s.charge.stop();});await page.waitForTimeout(100);};
  await reset();
  const edgeZone=await box('.touch-move-zone');
  for(const [x,y] of [[edgeZone.x+4,edgeZone.y+4],[edgeZone.x+4,edgeZone.y+edgeZone.height-4],
    [edgeZone.x+edgeZone.width-4,edgeZone.y+edgeZone.height-4]]){
    const before=(await state()).p;await send('touchStart',[{x,y,id:1}]);await page.waitForTimeout(120);
    assert.deepEqual((await state()).move,{x:0,y:0});assert.deepEqual((await state()).p,before);await send('touchEnd');
  }
  report.edgePressNeutral=true;
  for(const [width,height] of [[844,390],[960,540],[1180,820]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(450);await reset();
    const z=await box('.touch-move-zone'),circle=await box('.touch-move');assert.ok(z.width>circle.width*2&&z.height>circle.height);
    const x=z.x+z.width*0.65,y=z.y+z.height*0.5;assert.ok(x>circle.x+circle.width,'Start outside the old visible circle');
    await send('touchStart',[{x,y,id:1}]);const start=await state();assert.ok(start.capture);
    await send('touchMove',[{x:x+z.width*0.55,y,id:1}]);await page.waitForTimeout(360);const beyond=await state();assert.ok(beyond.capture&&beyond.move.x>0.9);assert.ok(beyond.p.x>start.p.x+40);
    await send('touchMove',[{x:x-100,y:y-80,id:1}]);await page.waitForTimeout(180);const reverse=await state();assert.ok(reverse.move.x<0&&reverse.move.y<0);assert.ok(Math.abs(Math.hypot(reverse.move.x,reverse.move.y)-1)<0.0001);
    await send('touchEnd');const released=await state();assert.deepEqual(released.move,{x:0,y:0});assert.equal(released.capture,false);const stop=released.p;await page.waitForTimeout(180);assert.deepEqual((await state()).p,stop);
    assert.equal(released.scale,1);assert.deepEqual(released.scroll,[0,0]);report.layouts.push({width,height,zone:z,circle,startsOutside:true,continuesBeyondZone:true,reverseDiagonal:true,releaseStops:true});
  }
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(400);await reset();
  // Movement and directional strike are independently captured; release strikes once.
  const origin=await center('.touch-move'),strike=await center('[data-action="attack"]'),charge=await center('[data-action="charge"]'),dash=await center('[data-action="dash"]');
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.qaStrikes=0;const original=s.beginStrike.bind(s);s.beginStrike=now=>{s.qaStrikes++;return original(now);};});
  await page.evaluate(()=>{window.qaPointerLog=[];for(const t of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.querySelector('.touch-controls').addEventListener(t,e=>window.qaPointerLog.push({type:t,target:e.target.dataset.action??e.target.className,id:e.pointerId}),true);});
  await send('touchStart',[{...origin,id:1}]);const movement={x:origin.x+150,y:origin.y,id:1};await send('touchMove',[movement]);
  await send('touchStart',[movement,{...strike,id:2}]);await send('touchMove',[movement,{x:strike.x-55,y:strike.y-45,id:2}]);await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').qaStrikes),0);assert.ok((await state()).move.x>0.9);
  // CDP touchEnd lists the ended contact, not the remaining contacts.
  await send('touchEnd',[{x:strike.x-55,y:strike.y-45,id:2}]);await page.waitForTimeout(120);report.strikeEvents=await page.evaluate(()=>window.qaPointerLog);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').qaStrikes),1);assert.ok((await state()).move.x>0.9);await send('touchEnd');report.movementStrike=true;
  await page.waitForTimeout(550);await reset();await send('touchStart',[{...origin,id:1}]);await send('touchMove',[movement]);
  await send('touchStart',[movement,{...dash,id:3}]);await page.waitForTimeout(70);assert.ok((await state()).dash<1);await send('touchEnd',[{...dash,id:3}]);await send('touchEnd');await page.waitForTimeout(400);report.movementDash=true;
  await reset();await send('touchStart',[{...origin,id:1}]);await send('touchMove',[movement]);
  await send('touchStart',[movement,{...charge,id:4}]);await send('touchMove',[movement,{x:charge.x-75,y:charge.y-70,id:4}]);await page.waitForTimeout(150);
  const held=await state();assert.equal(held.phase,'CHARGING');await page.waitForTimeout(250);assert.deepEqual((await state()).p,held.p);
  await send('touchEnd',[{x:charge.x-75,y:charge.y-70,id:4}]);await page.waitForTimeout(150);assert.notEqual((await state()).phase,'CHARGING');assert.ok((await state()).move.x>0.9);await send('touchEnd');report.moveChargeStationaryRelease=true;
  await page.waitForTimeout(3300);await send('touchStart',[{...charge,id:5}]);await page.waitForTimeout(180);assert.equal((await state()).phase,'CHARGING');await send('touchCancel');await page.waitForTimeout(150);assert.equal((await state()).phase,'READY');report.cancelCharge=true;
  // Cancellation, lost focus and orientation must not leave movement held.
  await reset();await send('touchStart',[{...origin,id:1}]);await send('touchMove',[movement]);await send('touchCancel');assert.deepEqual((await state()).move,{x:0,y:0});
  await send('touchStart',[{...origin,id:1}]);await send('touchMove',[movement]);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.deepEqual((await state()).move,{x:0,y:0});await send('touchEnd');
  await send('touchStart',[{...origin,id:1}]);await send('touchMove',[movement]);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);assert.deepEqual((await state()).move,{x:0,y:0});await send('touchEnd');
  assert.ok(await page.locator('.touch-rotate').isVisible());assert.equal(await page.locator('.touch-move-zone').isVisible(),false);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);assert.ok(await page.locator('.touch-move-zone').isVisible());report.cancellationAndOrientation=true;
  // Repeated taps, gameplay drags and a two-finger pinch retain page scale/scroll.
  const z=await box('.touch-move-zone'),x=z.x+z.width*0.65,y=z.y+z.height*.55;
  for(let i=0;i<6;i++){await send('touchStart',[{x,y,id:1}]);await send('touchEnd');await page.waitForTimeout(60);}
  for(const [dx,dy] of [[0,-100],[100,0],[90,-95]]){await send('touchStart',[{x,y,id:1}]);await send('touchMove',[{x:x+dx,y:y+dy,id:1}]);await send('touchEnd');}
  await send('touchStart',[{x:500,y:200,id:1},{x:560,y:210,id:2}]);await send('touchMove',[{x:390,y:150,id:1},{x:740,y:280,id:2}]);await send('touchEnd');assert.equal((await state()).scale,1);assert.deepEqual((await state()).scroll,[0,0]);report.gesturesNoZoomOrScroll=true;
  // Contextual interaction works and clears after the one-time response.
  await page.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:2190,y:745}));await page.waitForTimeout(180);assert.ok(await page.locator('.touch-interact').isVisible());
  const interact=await center('[data-action="interact"]');await send('touchStart',[{...interact,id:9}]);await send('touchEnd');await page.waitForTimeout(150);assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').valleyLandmarkSeen));report.touchInteraction=true;
  const listeners=[];for(let i=0;i<3;i++){await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await page.waitForTimeout(800);const s=await state();assert.equal(s.roots,1);listeners.push(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return[s.input.listenerCount('pointerdown'),s.input.keyboard.listenerCount('keydown')];}));}
  assert.deepEqual(listeners[1],listeners[0]);assert.deepEqual(listeners[2],listeners[0]);report.restarts= listeners;
  await page.screenshot({path:`${out}/touch-valley.png`});assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2));throw e;}finally{await browser.close();}
