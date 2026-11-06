import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/199/powers';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}}),report={passed:false,base,checks:[],errors:[],fixture:'DEV laboratory integration: actual XenobinderCombat, Health and movement/obstacle methods with explicit CPU targets/ticks. No canonical saves, real boss rewards or hidden user unlocks.'};p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));
try{
 await p.goto(base+'/character-cohesion.html?refinement=199&class=xenobinder&pet=symbiont');await p.waitForFunction(()=>window.__dante2dReview?.().ready);
 report.results=await p.evaluate(async()=>{
  const{XenobinderCombat}=await import('/src/combat/XenobinderCombat.ts'),{Health}=await import('/src/combat/Health.ts'),{companion,companionAvailable}=await import('/src/config/characterPresentation.ts');
  const scene=window.__danteGame.scene.getScene('Game'),bounds={left:-1000,right:2000,top:-1000,bottom:2000},results=[];
  for(const species of['symbiont','bulwark','frostling'])for(const wall of[false,true]){
   const x=new XenobinderCombat(scene,()=>0,{x:0,y:0});x.setSpecies(species);x.bond=100;Object.assign(x.position,{x:0,y:0});
   const owner={position:{x:0,y:0},health:new Health(100),isDead:false},near={position:{x:40,y:0},health:new Health(100),isDead:false},far={position:{x:400,y:0},health:new Health(100),isDead:false};owner.health.current=near.health.current=far.health.current=50;
   const target={position:{x:380,y:0},radius:18,health:new Health(500),isDead:false},calls=[],obstacles=wall?[{x:190,y:0,radius:45}]:[];
   const hit=(e,damage)=>{e.health.damage(damage);calls.push(damage);};const accepted=x.command(0,owner.position,0,1,obstacles,bounds),samples=[];
   for(let i=0;i<80;i++){for(const a of[owner,near,far])a.health.tickProtection(.02);x.update(i*20,.02,owner.position,0,false,[target],obstacles,bounds,hit,[owner,near,far]);samples.push(x.snapshot());}
   const result={species,wall,accepted,bond:x.bond,hp:target.health.current,hits:calls.length,heals:[owner,near,far].map(a=>a.health.current),guard:[owner,near,far].map(a=>({remaining:a.health.guardRemaining,reduction:a.health.guardReduction})),maxLift:Math.max(...samples.map(s=>s.pet.lift??0)),blast:samples.some(s=>s.blast),burst:samples.some(s=>s.burst),texture:x.body.texture.key};
   const before=owner.health.current;owner.health.damage(20);result.receivedDamage=before-owner.health.current;for(let i=0;i<300;i++)owner.health.tickProtection(.02);const expired=owner.health.current;owner.health.damage(20);result.damageAfterExpiry=expired-owner.health.current;
   x.clear();result.clear={blast:x.snapshot().blast,burst:x.snapshot().burst,active:x.snapshot().active};x.destroy();results.push(result);
  }
  return{cases:results,legacy:companion('hollow'),locks:{starter:companionAvailable(null,'symbiont'),wardenLocked:companionAvailable(null,'bulwark'),vesperLocked:companionAvailable({flags:{wardenDefeated:true}},'frostling'),wardenUnlocked:companionAvailable({progression:{bossRewards:['warden']}},'bulwark'),vesperUnlocked:companionAvailable({flags:{vesperDefeated:true}},'frostling')}};
 });
 for(const r of report.results.cases){assert.equal(r.accepted,true);assert.ok(r.bond<=65);assert.equal(r.clear.blast,undefined);assert.equal(r.clear.burst,undefined);assert.equal(r.damageAfterExpiry,20);if(r.wall)assert.equal(r.hp,500,'No attack can pass the solid cover');if(r.species==='bulwark'){assert.equal(r.hits,0);assert.deepEqual(r.heals,[50,50,50]);assert.ok(r.guard[0].remaining>0&&r.guard[1].remaining>0);assert.equal(r.guard[2].remaining,0);assert.equal(r.receivedDamage,11);}else{assert.equal(r.receivedDamage,20);if(!r.wall){assert.equal(r.hp,400);assert.equal(r.hits,1);if(r.species==='frostling'){assert.deepEqual(r.heals,[50,50,50]);assert.equal(r.blast,true);assert.equal(r.burst,true);assert.equal(r.maxLift,0);}else{assert.ok(r.maxLift>20);assert.deepEqual(r.heals,[50,50,64]);}}}}
 assert.equal(report.results.legacy,'symbiont');assert.deepEqual(report.results.locks,{starter:true,wardenLocked:false,vesperLocked:false,wardenUnlocked:true,vesperUnlocked:true});report.checks.push('Distinct landing, shield and projectile Q; one damage event, obstacle blocking, no shared healing, bounded nonstacking armor and exact expiry.','Original boss unlocks gate new species; legacy Hollow returns to the starter, granting no new boss unlock.');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('199 companion powers',report.passed);}
