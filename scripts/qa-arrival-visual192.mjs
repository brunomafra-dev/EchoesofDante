import assert from'node:assert/strict';import{chromium}from'playwright';import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/frontier-3d/qa/0.1.192/visual';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1440,height:900}}),report={passed:false,base,at:new Date().toISOString(),method:'Native workshop class/gender/element/basic-power selectors. Read-only rendered-effect diagnostics, full animation progression, expiration and repeated resource checks; pictures need separate visual review. No damage/progression simulated.',samples:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()===404&&!r.url().endsWith('/favicon.ico'))report.errors.push('Missing '+r.url());});
const ready=()=>p.waitForFunction(()=>window.__arrivalWorkshop?.().ready,{},{timeout:120000}),state=()=>p.evaluate(()=>window.__arrivalWorkshop());
try{
 await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='protected-character-registry';sessionStorage['other-lab']='protected-progress';});
 await p.goto(base+'/arrival-workshop.html?inspect=1&view=combat');await ready();assert.equal((await state()).version,'0.1.192');
 for(const gender of['male','female'])for(const id of['warrior','hunter','astral','xenobinder']){
  await p.locator('#subject').selectOption(id);await ready();await p.locator('#gender').selectOption(gender);await ready();
  for(const element of(id==='astral'?[0,1,2,3]:[0]))for(const kind of['basic','power']){
   if(id==='astral')await p.locator('#element').selectOption(String(element));await p.locator('#attack-kind').selectOption(kind);await p.locator('#motion').click();
   const expected=kind==='basic'&&id!=='warrior'?(id==='hunter'?'plasma':id==='xenobinder'?'bond':['energy','fire','water','earth'][element]):null;
   await p.waitForFunction(({expected,id,kind,element})=>{const s=window.__arrivalWorkshop();return expected?s.effects.projectiles.some(p=>p.style===expected):id==='warrior'?s.effects.bladeVertices>0:id==='hunter'?s.effects.kinds.includes('beam'):id==='astral'?s.effects.kinds.includes('field-'+element):s.effects.particles>0;},{expected,id,kind,element},{timeout:3000});
   const s=await state();assert.deepEqual(s.failures,[]);assert.ok(s.actor.action.weight>0);assert.ok(s.actor.emitter.every(Number.isFinite));assert.equal(s.actor.hand,id==='astral'?'hand_l':'hand_r');report.samples.push({gender,id,element,kind,effects:s.effects,actor:s.actor});
   await p.screenshot({path:out+'/'+id+'-'+gender+'-'+kind+'-'+element+'.jpg',quality:88});await p.waitForTimeout(kind==='power'&&id==='astral'?2900:800);
   const expired=(await state()).effects;assert.equal(expired.projectiles.length,0);assert.equal(expired.effects,0);assert.equal(expired.bladeVertices,0);
   await p.locator('#motion').click();
  }
  await p.locator('#pose').selectOption('roll');await p.locator('#motion').click();await p.screenshot({path:out+'/'+id+'-'+gender+'-roll.jpg',quality:88});await p.locator('#motion').click();await p.locator('#pose').selectOption('attack');
 }
 await p.locator('#subject').selectOption('astral');await ready();await p.locator('#gender').selectOption('male');await ready();await p.locator('#element').selectOption('0');await p.locator('#attack-kind').selectOption('basic');await p.waitForTimeout(500);const before=await state();
 for(let i=0;i<8;i++){await p.locator('#motion').click();await p.waitForTimeout(110);await p.locator('#motion').click();await p.waitForTimeout(1000);}const after=await state();
 assert.ok(after.renderer.geometries<=before.renderer.geometries+2);assert.ok(after.renderer.textures<=before.renderer.textures+1);report.resources={before:before.renderer,after:after.renderer};
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],sessionStorage['other-lab']]),['protected-character-registry','protected-progress']);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.stack;console.error(e);await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});process.exitCode=1;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(report.passed?'VISUAL192 PASS':'VISUAL192 FAIL');}
