import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/astral/elemental-v2/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless; actual Astral renderer and Hollow physics, DEV positioning/health fixtures; not human approval.',errors:[],elements:[]};
const p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(45000);
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
const S=(code,arg)=>p.evaluate(({code,arg})=>new Function('s','arg',code)(window.__danteGame.scene.getScene('Game'),arg),{code,arg});
try{
 await p.goto('http://localhost:5184/astral-playtest.html?element=fire&kit=basic',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);
 assert.equal(await S('return s.astral.element'),'fire');
 report.projectiles=await p.evaluate(async()=>{
  const s=window.__danteGame.scene.getScene('Game'),{AstralCombat}=await import('/src/combat/AstralCombat.ts'),a=new AstralCombat(s,()=>0),rows=[];
  for(const element of ['energy','fire','water','earth']){
   a.clear();a.element=element;a.fire(rows.length*1000,{x:1000,y:900},0);a.cycle();a.update(rows.length*1000,.1,[],[],undefined,()=>{});
   const shot=a.snapshot().shots[0];rows.push({element,captured:shot.element,texture:a.shotViews[0].texture.key,frame:a.shotViews[0].frame.name});
  }
  const pool=s.children.list.length;for(let i=0;i<60;i++){a.clear();a.energy=100;a.element=['energy','fire','water','earth'][i%4];a.cast(i*100,{x:1000,y:900},0,.6);a.update(i*100,.1,[],[],undefined,()=>{});}const after=s.children.list.length;
  a.clear();const hidden=[...a.shotViews,...a.zoneViews,...a.formViews].every(v=>!v.visible);a.destroy();return{rows,pool,after,hidden};
 });
 assert.ok(report.projectiles.rows.every(r=>r.element===r.captured&&r.texture===`astral-${r.element}-bolt`));assert.equal(new Set(report.projectiles.rows.map(r=>r.texture)).size,4);assert.equal(report.projectiles.pool,report.projectiles.after);assert.equal(report.projectiles.hidden,true);
 // Find a real clear patch, preserving environmental colliders in the simulation.
 const patch=await S(`for(const y of [850,650,1050,450])for(const x of [850,1100,550,1400]){
  const t={x:x+284,y};if(s.arena.obstacles.every(o=>Math.hypot(o.x-x,o.y-y)>o.radius+32&&Math.hypot(o.x-t.x,o.y-t.y)>o.radius+110&&!(o.x>x&&o.x<t.x&&Math.abs(o.y-y)<o.radius+30)))return{x,y,target:t};}throw Error('No clear test patch')`);
 for(const element of ['energy','fire','water','earth']){
  await S(`s.astral.clear();s.astral.energy=100;s.astral.element=arg.element;s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,arg.patch);
   s.controls.aimFrom=()=>0;s.controls.movement=()=>({x:0,y:0});const testEnemy=s.enemies.find(e=>e.radius===18);for(const e of s.enemies)if(e!==testEnemy){e.isDead=true;e.view?.setVisible(false);e.body?.setVisible(false);e.shadow?.setVisible(false);e.name?.setVisible(false);e.healthFill?.setVisible(false);e.healthBack?.setVisible(false);e.telegraph?.setVisible(false)}
   const e=s.enemies.find(e=>e.radius===18);e.isDead=false;e.view?.setVisible(true);Object.assign(e.position,{x:arg.patch.target.x+16,y:arg.patch.y});e.health.max=e.health.current=2000;e.hurt(s.time.now,s.player.position,0);`,{element,patch});
  await p.waitForTimeout(150);
  // Capture the actual travelling basic, then the actual field in the same framing.
  await S(`s.astral.fire(s.time.now,s.player.position,0,s.astralArt.projectileOffset(0));`);await p.waitForTimeout(150);await p.screenshot({path:out+`/${element}-basic.png`});
  await S(`s.astral.clear();const e=s.enemies.find(e=>!e.isDead);Object.assign(e.position,{x:arg.target.x+16,y:arg.y});e.hurt(s.time.now,s.player.position,0);s.astral.cast(s.time.now,s.player.position,0,.6);`,patch);
  await p.waitForTimeout(280);
  const state=await S(`const e=s.enemies.find(e=>!e.isDead);return{element:s.astral.element,x:e.position.x,initial:arg.target.x+16,hp:e.health.current,zones:s.astral.snapshot().zones,ground:s.astral.zoneViews[0].texture.key,form:s.astral.formViews[0].texture.key};`,patch);
  assert.ok(state.hp<2000);if(element==='earth')assert.ok(state.x>state.initial+10,JSON.stringify(state));
  assert.equal(state.ground,`astral-${element}-ground`);assert.equal(state.form,`astral-${element}-field`);report.elements.push(state);
  await p.screenshot({path:out+`/${element}-q.png`});
 }
 await p.waitForTimeout(1200);report.fps=await S('return s.game.loop.actualFps');assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/elements.json',JSON.stringify(report,null,2));}
console.log(report);
