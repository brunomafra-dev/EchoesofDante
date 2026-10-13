import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/xenobinder/world';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}});
const report={method:'One isolated Chrome page; DEV regional/checkpoint fixtures and invulnerability for observation. Actual keyboard motion and companion collider checks. Not physical/human campaign playthrough.',errors:[],regions:[]};
const S=(code,arg)=>p.evaluate(({code,arg})=>new Function('s','arg',code)(window.__danteGame.scene.getScene('Game'),arg),{code,arg});
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 for(const region of['base','forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera']){
  await p.goto('http://localhost:5184/xenobinder-playtest.html?kit=advanced&region='+region);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);
  for(let i=0;i<12;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();}
  await S('s.player.invulnerableUntil=Infinity');await p.keyboard.down('d');await p.waitForTimeout(300);await p.keyboard.up('d');await p.waitForTimeout(2100);
  const samples=[];for(let i=0;i<8;i++){samples.push(await S('return {fps:s.game.loop.actualFps,objects:s.children.list.length,tweens:s.tweens.getTweens().length,graphics:s.children.list.filter(o=>o.type==="Graphics").length,pet:s.xeno.snapshot(),collisionClear:s.arena.obstacles.every(o=>Math.hypot(o.x-s.xeno.position.x,o.y-s.xeno.position.y)>=o.radius+14-.5)}'));await p.waitForTimeout(180);}
  assert.ok(samples.every(r=>r.collisionClear));assert.equal(samples[0].objects,samples.at(-1).objects);assert.equal(samples[0].graphics,samples.at(-1).graphics);
  report.regions.push({region,meanFps:samples.reduce((n,r)=>n+r.fps,0)/samples.length,objects:samples[0].objects,graphics:samples[0].graphics,tweens:[samples[0].tweens,samples.at(-1).tweens],collisionClear:true});
  await p.screenshot({path:out+'/'+region+'.png'});
 }
 await p.goto('http://localhost:5184/xenobinder-playtest.html?region=forest');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);
 await S('s.progression.defeatHollow(999,15);s.saveProgress()');const xp=await S('return s.progression.xp');report.respawns=[];
 for(let i=0;i<3;i++){await S('s.player.health.current=0;s.handleDeath(s.player);s.restart()');await p.waitForTimeout(850);report.respawns.push(await S('return {xp:s.progression.xp,hp:s.player.hp,max:s.player.maxHp,pet:s.children.list.filter(o=>o.texture?.key==="dante-symbiont-motion").length,objects:s.children.list.length,textures:s.textures.getTextureKeys().length}'));}
 assert.ok(report.respawns.every(r=>r.xp===xp&&r.hp===r.max&&r.pet===1));assert.equal(report.respawns[0].objects,report.respawns[2].objects);assert.equal(report.respawns[0].textures,report.respawns[2].textures);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/world.json',JSON.stringify(report,null,2));}
console.log(report);
