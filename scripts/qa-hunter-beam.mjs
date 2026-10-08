import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out='docs/star-hunter/beam-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
await context.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1',JSON.stringify({schema:1,selected:'beam',characters:[{id:'beam',name:'Hunter Feixe',classId:'hunter',createdAt:1}]})));
const p=await context.newPage(),report={errors:[],method:'Chrome headless; real keyboard/mouse; controlled real enemies/cover and DEV cooldown expiry; no physical hardware'};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`)});
const scene='Game';
const key=async(k,ms=170)=>{await p.keyboard.down(k);await p.waitForTimeout(ms);await p.keyboard.up(k);await p.waitForTimeout(100);};
async function setup(cover=false){await p.evaluate(cover=>{
 const s=window.__danteGame.scene.getScene('Game');s.hunter.clear();s.charge.stop();s.charge.lastReleasedAt=-Infinity;
 s.arena.obstacles.length=0;if(cover)s.arena.obstacles.push({x:1150,y:800,radius:35});
 Object.assign(s.player.position,{x:700,y:800});s.player.invulnerableUntil=Infinity;
 for(let i=0;i<s.enemies.length;i++){const e=s.enemies[i];e.isDead=i>2;e.update=()=>{};e.hurt=()=>{};e.health.current=e.health.max=1000;Object.assign(e.position,{x:950+i*250,y:800});}
},cover);await p.waitForTimeout(350);const point=await p.evaluate(()=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:1050-c.scrollX,y:800-c.scrollY}});await p.mouse.move(point.x,point.y);}
const hp=()=>p.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies.slice(0,3).map(e=>e.health.current));
async function beam(){await p.keyboard.down('q');await p.waitForTimeout(850);const held=await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));await p.keyboard.down('d');await p.waitForTimeout(150);await p.keyboard.up('d');assert.deepEqual(await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position})),held);const point=await p.evaluate(()=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:1050-c.scrollX,y:800-c.scrollY}});await p.mouse.move(point.x,point.y);await p.waitForTimeout(35);await p.keyboard.up('q');await p.waitForTimeout(70);}
try{
 await p.goto('http://localhost:5184/?qa=play');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.hunter);
 await setup();await beam();report.initialBeam=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{beam:s.hunter.beamPose(),targets:s.enemies.slice(0,3).map(e=>({position:e.position,hp:e.health.current,dead:e.isDead,radius:e.radius})),obstacles:s.arena.obstacles.length,p:s.player.position}});assert.deepEqual(await hp(),[863,863,863]);report.allEnemiesPiercedOnce=true;
 const pose=report.initialBeam.beam;assert.equal(pose.length,980);assert.equal(pose.halfWidth,18);
 await p.screenshot({path:`${out}/beam.png`});await p.waitForTimeout(650);assert.deepEqual(await hp(),[863,863,863]);assert.equal(await p.evaluate(()=>!!window.__danteGame.scene.getScene('Game').hunter.beamPose()),false);report.fadeDoesNotRepeatDamage=true;
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.charge.lastReleasedAt=window.__danteGame.loop.time-s.recordsTimeOffset});await key('q',200);assert.deepEqual(await hp(),[863,863,863]);report.cooldownPreserved=true;
 await setup(true);await beam();const cover=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{hp:s.enemies.slice(0,3).map(e=>e.health.current),length:s.hunter.beamPose()?.length}});assert.deepEqual(cover.hp,[863,1000,1000]);assert.equal(Math.round(cover.length),397);report.solidCoverClipsBeam=true;
 await setup();await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies[1].position.y+=100;s.enemies[2].position.x=550;});await beam();assert.deepEqual(await hp(),[863,1000,1000]);report.directionalNotAutoAim=true;
 await setup();await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:2000,y:800});s.hunter.fire(s.time.now,s.player.position,0,76);});await p.waitForTimeout(40);assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').hunter.beamPose().length<=200));report.worldBoundsClipBeam=true;
 await setup();await p.keyboard.down('q');await p.waitForTimeout(400);await p.keyboard.press('Escape');await p.keyboard.up('q');assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'READY');await p.locator('[data-shell="continue"]').click();await p.waitForTimeout(400);assert.deepEqual(await hp(),[1000,1000,1000]);report.pauseCancelsNoBeam=true;
 await setup();await p.mouse.down();await p.keyboard.down('d');const angles=[];
 for(let i=0;i<6;i++){await p.waitForTimeout(70);angles.push(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{s:s.hunterArt.legs[0].shin.rotation,t:s.hunterArt.travel,angle:s.player.view.rotation}}));await p.screenshot({path:`${out}/walk-${i}.png`});}
 await p.keyboard.up('d');await p.mouse.up();assert.ok(new Set(angles.map(a=>a.s.toFixed(2))).size>=3);assert.ok(angles.every(a=>a.angle===0));report.articulatedLegsContinueWhileFiring=true;
 const phase=await p.evaluate(()=>window.__danteGame.scene.getScene('Game').hunterArt.travel);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').hunterArt.travel),phase);report.idleDoesNotKeepWalking=true;
 for(const [name,keys,aim]of[['back',['w'], -Math.PI/2],['front',['s'],Math.PI/2],['strafe',['a'],0],['diagonal',['w','d'],Math.PI]]){
  await p.evaluate(aim=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:700,y:800});s.controls.aimFrom=()=>aim},aim);await p.waitForTimeout(800);
  for(const k of keys)await p.keyboard.down(k);await p.waitForTimeout(650);await p.screenshot({path:`${out}/${name}.png`});for(const k of keys)await p.keyboard.up(k);
 }report.aimMovementIndependent=true;
 for(const [w,h]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(150);await p.screenshot({path:`${out}/viewport-${w}.png`});}
 await p.setViewportSize({width:1280,height:720});await p.waitForTimeout(500);const baseline=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{objects:s.children.list.length,tweens:s.tweens.getTweens().length}});
 for(let i=0;i<5;i++){await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.hunter.fire(s.time.now,s.player.position,0,76)});await p.waitForTimeout(700)}
 const final=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{objects:s.children.list.length,tweens:s.tweens.getTweens().length,fps:window.__danteGame.loop.actualFps}});
 assert.equal(final.objects,baseline.objects);assert.equal(final.tweens,baseline.tweens);report.stableObjects={baseline,final};
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await context.close();await p.video().saveAs(`${out}/hunter-beam-walk.webm`);await p.video().delete();await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(report);
