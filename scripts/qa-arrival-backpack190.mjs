import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/frontier-3d/qa/0.1.190/backpack';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1440,height:900}}),report={passed:false,base,at:new Date().toISOString(),method:'Native class/gender/backpack/view/motion selectors; same current weapons throughout A/B. Spine attachment and finite bounds over time, repeated swaps, real-save sentinels. Screenshots require separate visual review; numeric bounds do not certify garment contact.',samples:[],errors:[],layouts:[]};
p.on('pageerror',e=>report.errors.push(e.stack));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))report.errors.push(m.text());});
const state=()=>p.evaluate(()=>window.__arrivalWorkshop()),ready=()=>p.waitForFunction(()=>window.__arrivalWorkshop?.().ready,{},{timeout:120000}),shot=n=>p.screenshot({path:out+'/'+n+'.jpg',quality:88});
try{
 await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='protected-real-characters';sessionStorage['dante.arrival3d.v1']='protected-real-progress';});
 await p.goto(base+'/arrival-workshop.html?inspect=1&subject=warrior&view=backpack',{waitUntil:'domcontentloaded',timeout:120000});await ready();assert.equal(await p.locator('#view').inputValue(),'backpack');assert.equal((await state()).version,'0.1.190');
 for(const id of ['warrior','hunter','astral','xenobinder'])for(const gender of ['male','female']){
  await p.locator('#subject').selectOption(id);await ready();await p.locator('#gender').selectOption(gender);await ready();
  for(const pack of ['previous','current']){
   await p.locator('#backpack').selectOption(pack);await ready();await p.waitForTimeout(450);
   for(const view of ['backpack','torso']){await p.locator('#view').selectOption(view);await p.waitForTimeout(160);await shot(id+'-'+gender+'-'+pack+'-'+view);}
   const s=await state();assert.equal(s.actor.backpack.style,pack);assert.equal(s.actor.equipment,'current','Backpack A/B does not replace the weapons');assert.equal(s.actor.backpack.anchor,'spine_03');assert.ok(s.actor.hasEmitter);assert.deepEqual(s.failures,[]);report.samples.push({id,gender,pack,pose:'idle',actor:s.actor});
   if(pack==='previous')continue;
   assert.deepEqual(s.actor.backpack.parts,['field-backpack','field-harness-'+gender]);
   for(const pose of ['attack','run','roll','jump']){
    await p.locator('#pose').selectOption(pose);await p.locator('#view').selectOption('backpack');await p.locator('#motion').click();
    for(let i=0;i<8;i++){
     await p.waitForTimeout(i===0?100:120);const s=await state(),pack=s.actor.backpack,bounds=pack.bounds;assert.ok([...bounds.min,...bounds.max,...s.actor.emitter].every(Number.isFinite));assert.ok(bounds.max.every((v,k)=>v-bounds.min[k]<1.5),'No exploded or detached gear');assert.equal(pack.anchor,'spine_03');assert.equal(s.actor.hand,id==='astral'?'hand_l':'hand_r');
     if(i===0)await shot(id+'-'+gender+'-'+pose);if(i===0||i===7)report.samples.push({id,gender,pose,actor:s.actor});
    }
    await p.locator('#motion').click();
   }
  }
 }
 const before=await state();for(let i=0;i<6;i++){await p.locator('#backpack').selectOption(i%2?'current':'previous');await ready();await p.waitForTimeout(80);}const after=await state();assert.ok(after.renderer.geometries<=before.renderer.geometries+3);assert.ok(after.renderer.textures<=before.renderer.textures+3);report.resources={before:before.renderer,after:after.renderer};
 for(const [width,height]of [[844,390],[568,320],[393,852]]){await p.setViewportSize({width,height});await p.locator('#view').selectOption('backpack');await p.waitForTimeout(150);const layout=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()}));assert.equal(layout.width,layout.scroll);assert.ok(layout.canvas.width>150&&layout.canvas.height>100);await p.locator('#motion').scrollIntoViewIfNeeded();await shot('layout-'+width+'x'+height);report.layouts.push(layout);}
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],sessionStorage['dante.arrival3d.v1']]),['protected-real-characters','protected-real-progress']);assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;await shot('failure').catch(()=>{});}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await b.close();console.log(report.passed?'BACKPACK190 PASS':'BACKPACK190 FAIL');}
