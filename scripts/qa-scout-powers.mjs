import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5195',out=process.env.QA_OUT??'docs/2d-refinement/qa/203/astral';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(60000);
const report={passed:false,base,cases:[],errors:[],fixture:'Explicit three passive 500 HP targets with full Astral resource; native basic/F/Q only, no boss victories or real saves.'};p.on('pageerror',e=>report.errors.push(e.stack));
try{
 for(const sex of ['male','female'])for(const [index,element]of ['energy','fire','water','earth'].entries()){
  const samples=[];
  for(const preset of ['astral','hunter']){
   await p.goto(`${base}/character-playtest.html?refinement=203&class=astral&preset=${preset}&sex=${sex}&targets=1`);await p.waitForFunction(()=>window.__dante2dReview?.().impactTargets?.length===3);await p.locator('.playtest-navigation').evaluate(e=>e.open=false);
   for(let i=0;i<index;i++)await p.keyboard.press('f',{delay:70});await p.mouse.move(940,360);await p.mouse.down();await p.waitForTimeout(40);await p.mouse.up();await p.waitForFunction(()=>window.__dante2dReview().impactTargets.some(t=>t.hp<500));
   const basic=await p.evaluate(()=>window.__dante2dReview().impactTargets.map(t=>t.hp));
   await p.keyboard.down('q');await p.waitForTimeout(60);await p.keyboard.up('q');await p.waitForFunction(total=>window.__dante2dReview().impactTargets.reduce((s,t)=>s+t.hp,0)<total,basic.reduce((a,c)=>a+c,0));
   await p.waitForTimeout(300);if(preset==='hunter')await p.screenshot({path:`${out}/${sex}-${element}.jpg`,type:'jpeg',quality:87});await p.waitForTimeout(3400);
   const after=await p.evaluate(()=>window.__dante2dReview());assert.equal(after.actor.identity,'astral');assert.equal(after.actor.visualPreset,preset);const hp=after.impactTargets.map(t=>t.hp);assert.ok(hp.reduce((a,c)=>a+c,0)<basic.reduce((a,c)=>a+c,0),'Q does real damage');await p.waitForTimeout(500);assert.deepEqual(await p.evaluate(()=>window.__dante2dReview().impactTargets.map(t=>t.hp)),hp,'No damage after FX expires');samples.push({preset,basic,hp});
  }
  assert.deepEqual(samples[0].basic,samples[1].basic,'Basic damage remains identical');report.cases.push({sex,element,samples});console.log('Astral basic parity / native Q',sex,element);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:85}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await b.close();console.log('203 Astral',report.passed);}
