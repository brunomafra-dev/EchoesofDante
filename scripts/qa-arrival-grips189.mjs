import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/frontier-3d/qa/0.1.189/grips';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:900}});
const report={passed:false,base,at:new Date().toISOString(),method:'Native class/gender/equipment/view/action selectors. Finger tips must wrap beyond the grip center, not merely sit near a wrist joint. Screenshots from both sides and motions need visual review. Protected real-save sentinels; no campaign state setters.',samples:[],layouts:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.stack));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))report.errors.push(m.text());});
const state=()=>page.evaluate(()=>window.__arrivalWorkshop());
const ready=()=>page.waitForFunction(()=>window.__arrivalWorkshop?.().ready,{},{timeout:120000});
const shot=name=>page.screenshot({path:out+'/'+name+'.jpg',quality:88});
function grasp(a,id){
 assert.ok(a.emitter.every(Number.isFinite));assert.equal(a.hasEmitter,true);
 if(id==='astral'){
  assert.equal(a.hand,'hand_l');assert.equal(a.grasp.kind,'worn-gauntlet');
  assert.equal(a.bracer,'lowerarm_l','Forearm armor follows the forearm separately from the hand');
  assert.deepEqual(a.socket,[0,0,0]);
  assert.ok(Math.hypot(...a.emitterLocal)<.12,'Palm emitter, not a floating handheld focus');
 }else{
  assert.equal(a.hand,'hand_r');const hand=a.grasp.right,c=hand.center;
  assert.ok(Math.hypot(...a.socket.map((v,i)=>v-c[i]))<.0001,'Handle at measured palm socket');
  for(const f of hand.fingers.filter(f=>!['thumb','index'].includes(f.finger))){
   assert.ok(f.base[0]>c[0]+.018,'Knuckles outside handle center');
   assert.ok(f.tip[0]<c[0]-.01,'Fingers curl around the opposite side of the handle');
   assert.ok(Math.abs(f.tip[1]-c[1])<.05,'Tips remain near the handle instead of pointing away');
   assert.ok(Math.hypot(f.tip[0]-c[0],f.tip[1]-c[1])<.065,'Closed grasp stays bounded');
  }
  assert.ok(hand.fingers.find(f=>f.finger==='thumb').tip[2]>c[2]+.015,'Opposed thumb');
  if(id==='hunter'&&a.grasp.support){
   if(a.grasp.aimWeight>.995)assert.ok(a.grasp.supportError<.02,'Support palm actually reaches the authored foregrip, within 2 cm');
   const left=a.grasp.left;
   for(const f of left.fingers.filter(f=>f.finger!=='thumb')){
    assert.ok(f.base[0]<left.center[0]-.015,'Left knuckles on outside of foregrip');
    assert.ok(f.tip[0]>left.center[0]+.01,'Left fingers wrap toward the palm, not the back of the hand');
   }
  }
 }
}
try{
 await page.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='protected-real-characters';sessionStorage['dante.arrival3d.v1']='protected-real-progress';});
 await page.goto(base+'/arrival-workshop.html?inspect=1&subject=astral',{waitUntil:'domcontentloaded',timeout:120000});await ready();
 assert.equal((await state()).selection,'astral','Direct class link');
 for(const id of ['warrior','hunter','astral','xenobinder'])for(const gender of ['male','female']){
  await page.locator('#subject').selectOption(id);await ready();await page.locator('#gender').selectOption(gender);await ready();
  for(const equipment of ['previous','current']){
   await page.locator('#equipment').selectOption(equipment);await ready();await page.waitForTimeout(450);
   for(const view of ['body','grip','reverse']){await page.locator('#view').selectOption(view);await page.waitForTimeout(160);await shot(`${id}-${gender}-${equipment}-${view}`);}
   let s=await state();assert.equal(s.actor.equipment,equipment);if(equipment==='current'){
    grasp(s.actor,id);
    if(id==='astral'){const index=s.actor.grasp.left.fingers.find(f=>f.finger==='index');assert.ok(index.tip[1]-index.base[1]>.045,'Gauntlet hand relaxes in settled idle instead of pinching a removed focus');}
   }
   report.samples.push({id,gender,equipment,pose:'idle',actor:s.actor});
   if(equipment==='previous')continue;
   for(const pose of ['attack','run','roll','jump']){
    await page.locator('#pose').selectOption(pose);await page.locator('#motion').click();
    for(let sample=0;sample<6;sample++){
     await page.waitForTimeout(sample===0?90:130);s=await state();grasp(s.actor,id);assert.deepEqual(s.failures,[]);
     report.samples.push({id,gender,equipment,pose,sample,actor:s.actor,effects:s.effects});
     if(sample===0)await shot(`${id}-${gender}-${pose}-grip`);
    }
    await page.locator('#motion').click();
   }
  }
 }
 const before=await state();for(let i=0;i<3;i++)for(const id of ['astral','hunter','warrior','xenobinder']){await page.locator('#subject').selectOption(id);await ready();await page.waitForTimeout(60);}
 const after=await state();assert.ok(after.renderer.textures<=before.renderer.textures+3);assert.ok(after.renderer.geometries<=before.renderer.geometries+3);report.resources={before:before.renderer,after:after.renderer};
 await page.locator('#subject').selectOption('astral');await ready();await page.locator('#view').selectOption('grip');
 for(const element of ['0','1','2','3']){await page.locator('#element').selectOption(element);await page.waitForTimeout(150);await shot('gauntlet-element-'+element);}
 for(const [width,height]of [[844,390],[568,320],[393,852]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(180);
  const s=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()}));
  assert.equal(s.width,s.scroll);assert.ok(s.canvas.width>150&&s.canvas.height>100);report.layouts.push(s);await shot('layout-'+width+'x'+height);
 }
 assert.deepEqual(await page.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],sessionStorage['dante.arrival3d.v1']]),['protected-real-characters','protected-real-progress']);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e);await shot('failure').catch(()=>{});}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(report.passed?'GRIPS189 PASS':'GRIPS189 FAIL');}
