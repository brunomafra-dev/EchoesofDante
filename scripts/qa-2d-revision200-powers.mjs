import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5186',out=process.env.QA_OUT??'docs/2d-refinement/qa/200/powers';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1280,height:720}});
const report={passed:false,base,fixture:'DEV lab: real combat/Health objects and authoritative ticks, bounded CPU target fixtures; no saved campaign or boss progress.',errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.goto(base+'/character-playtest.html?refinement=200&class=xenobinder&pet=bulwark');
 await page.waitForFunction(()=>window.__dante2dReview?.().ready,null,{timeout:90000});
 report.results=await page.evaluate(async()=>{
  const {XenobinderCombat}=await import('/src/combat/XenobinderCombat.ts'),{Health}=await import('/src/combat/Health.ts');
  const scene=window.__danteGame.scene.getScene('Game'),results=[];
  for(const species of ['bulwark','frostling'])for(const wall of [false,true])for(const charged of [0,1]){
   const origin={x:0,y:0},bounds={left:-500,right:1000,top:-500,bottom:500},xeno=new XenobinderCombat(scene,()=>0,origin);
   xeno.setSpecies(species);xeno.bond=100;Object.assign(xeno.position,origin);
   const owner={position:origin,health:new Health(100),isDead:false},ally={position:{x:30,y:30},health:new Health(100),isDead:false};
   const center=species==='bulwark'?70:180;
   const targets=[{x:center,y:0},{x:center+12,y:60},{x:center+20,y:-60},{x:450,y:200}].map((position,i)=>({position,radius:18,health:new Health(500),isDead:false,id:i}));
   const obstacles=wall?[{x:species==='bulwark'?35:80,y:0,radius:20},{x:species==='bulwark'?38:80,y:60,radius:24},{x:species==='bulwark'?38:80,y:-60,radius:24}]:[];
   const hits=[],poses=[];const hit=(target,amount)=>{target.health.damage(amount);hits.push({id:target.id,amount});};
   const accepted=xeno.command(0,origin,0,charged,obstacles,bounds);
   for(let i=0;i<150;i++){for(const a of [owner,ally])a.health.tickProtection(.02);xeno.update(i*20,.02,origin,0,false,targets,obstacles,bounds,hit,[owner,ally]);poses.push(xeno.snapshot());}
   const before=owner.health.current;owner.health.damage(20);const protectedDamage=before-owner.health.current;
   for(let i=0;i<300;i++)owner.health.tickProtection(.02);
   const expired=owner.health.current;owner.health.damage(20);const expiredDamage=expired-owner.health.current;
   xeno.clear();const afterClear=xeno.snapshot();xeno.destroy();
   results.push({species,wall,charged,accepted,hits,hp:targets.map(t=>t.health.current),protectedDamage,expiredDamage,burstRadius:Math.max(0,...poses.map(p=>p.burst?.radius??0)),afterClear:{blast:!!afterClear.blast,burst:!!afterClear.burst,pulse:!!afterClear.pulse},healed:ally.health.current>100});
  }
  return results;
 });
 for(const result of report.results){
  assert.equal(result.accepted,true);assert.equal(result.healed,false);assert.equal(result.expiredDamage,20);
  assert.deepEqual(result.afterClear,{blast:false,burst:false,pulse:false});
  assert.ok(result.hp[3]===500,'Distant target must remain untouched');
  const counts=new Map();for(const h of result.hits)counts.set(h.id,(counts.get(h.id)??0)+1);
  assert.ok([...counts.values()].every(n=>n===1),'Each enemy takes one damage event per command');
  if(!result.wall){assert.deepEqual([...counts.keys()].sort(),[0,1,2],result.species+' hits primary + two nearby enemies');}
  else assert.ok(result.hp[0]===500,'Cover blocks primary target');
  if(result.species==='bulwark')assert.ok(result.protectedDamage>=11&&result.protectedDamage<=13);
  else {assert.equal(result.protectedDamage,20);assert.ok(result.burstRadius>=100&&result.burstRadius<=132);}
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('200 multi-target powers',report.passed);}
