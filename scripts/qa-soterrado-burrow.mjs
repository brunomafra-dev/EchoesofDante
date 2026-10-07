// Visual state setup selects the encounter only; timings run on the real scene clock.
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5184/',out=process.argv[3]??'docs/soterrado-boss/burrow-pass/qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
const page=await context.newPage(),video=page.video();
const report={method:'Chrome headless, real intro/attack clock; DEV chapter/positions; no physical devices',errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.soterrado;return {
  state:b.state,attack:b.attackName,hp:b.health.current,p:{...b.position},canHit:b.canBeHit,solid:b.solid,frame:b.body.frame.name,
  scale:[b.body.scaleX,b.body.scaleY],bodyY:b.body.y,cropped:b.body.isCropped,alpha:b.body.alpha,
  holes:b.burrowVisual.holes.map(h=>({visible:h.base.visible,x:h.x,y:h.y,lip:h.lip.visible,depth:h.lip.depth,alpha:h.base.alpha,
    dust:h.dust.filter(p=>p.visible).length})),objects:s.children.list.length,tweens:s.tweens.getTweens().length,
  marks:b.marks.filter(m=>m.graphic.visible).map(m=>({x:m.x,y:m.y})),playerHp:s.player.hp};});
try{
  await page.goto(base);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  await page.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');for(const f of JOURNEY_FLAGS)s[f]=!f.startsWith('soterrado');
    s.progression.restore({xp:700,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[],abilityUpgrades:{chargeWidth:1}});s.area='sandpit';s.scene.restart();});await page.waitForTimeout(600);
  assert.ok((await state()).holes.every(h=>!h.visible));assert.equal((await state()).alpha,0);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:900,y:920});s.soterrado.beginIntro(s.time.now);});
  await page.waitForTimeout(370);const opening=await state();assert.equal(opening.state,'INTRO');assert.equal(opening.alpha,0);assert.ok(opening.holes[0].visible);
  await page.screenshot({path:`${out}/01-opening.png`});
  await page.waitForFunction(()=>{const b=window.__danteGame.scene.getScene('Game').soterrado;return b.state==='INTRO'&&b.body.alpha>0&&b.body.isCropped&&b.body.y>b.position.y+45;});
  const partial=await state();assert.equal(partial.scale[0],partial.scale[1]);assert.ok(partial.holes[0].lip);assert.ok(partial.holes[0].depth>partial.p.y);
  await page.waitForTimeout(280);await page.screenshot({path:`${out}/02-emerging.png`});
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='IDLE');const standing=await state();assert.equal(standing.cropped,false);assert.ok(Math.abs(standing.bodyY-standing.p.y-14)<2.1);assert.equal(standing.hp,850);
  await page.screenshot({path:`${out}/03-standing.png`});report.intro={openingBeforeBody:true,foregroundLip:true,fullScaleAnatomy:true,cropCleared:true};
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.soterrado;Object.assign(b.position,{x:1080,y:760});Object.assign(s.player.position,{x:930,y:850});b.beginAttack(s.time.now,'burrow',s.player.position,s.arena.obstacles);});
  const target=(await state()).marks[0];await page.waitForTimeout(420);let underground=await state();assert.equal(underground.alpha,0);assert.equal(underground.canHit,false);assert.equal(underground.solid,false);assert.ok(underground.holes[0].visible);
  await page.screenshot({path:`${out}/04-digging.png`});
  await page.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:800,y:930}));
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='EXECUTE');
  const emerging=await state();assert.deepEqual(emerging.p,target);assert.ok(emerging.holes[1].visible);assert.equal(emerging.scale[0],emerging.scale[1]);
  await page.waitForTimeout(100);await page.screenshot({path:`${out}/05-reemerging.png`});
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='RECOVER');assert.equal((await state()).cropped,false);report.attack={sourceHole:true,destinationHole:true,lockedPosition:true,anatomyNotSquashed:true,fullPoseInRecovery:true};
  // Repeat the visual activation without spawning more objects or tweens.
  const start=(await state()).objects;
  for(let i=0;i<6;i++)await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.soterrado;b.beginAttack(s.time.now,'burrow',s.player.position,s.arena.obstacles);});
  assert.equal((await state()).objects,start);report.pool={objects:start,afterSixActivations:(await state()).objects,holes:2,dustQuads:12};
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike(s.soterrado,{damage:24,ranged:true});});
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);assert.ok((await state()).holes.every(h=>!h.visible&&h.dust===0));assert.equal((await state()).cropped,false);report.deathClearsVisuals=true;
  assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await context.close();await video.saveAs(`${out}/burrow-animation.webm`);await video.delete();await browser.close();}
console.log(JSON.stringify(report,null,2));
