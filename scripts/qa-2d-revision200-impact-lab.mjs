import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const revision=process.env.QA_REVISION??'200',preset=process.env.QA_PRESET;
const base=process.env.QA_BASE??'http://localhost:5194',out=process.env.QA_OUT??'docs/2d-refinement/qa/200/impact-lab';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),report={passed:false,base,fixture:'Explicit isolated lab of three passive 500HP targets, 100 bond. Native Q; no boss wins/campaign prerequisites.',cases:[],errors:[]};
try{
 for(const pet of ['bulwark','frostling']){
  const p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(60000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
  await p.goto(base+'/character-playtest.html?refinement='+revision+'&class=xenobinder&pet='+pet+'&targets=1'+(preset?'&preset='+preset:''));
  await p.waitForFunction(()=>window.__dante2dReview?.().impactTargets?.length===3);await p.locator('.playtest-navigation summary').click();
  const before=await p.evaluate(()=>window.__dante2dReview());assert.ok(before.impactTargets.every(t=>t.hp===500));
  await p.mouse.move(700,360);await p.keyboard.down('q');await p.waitForTimeout(650);await p.keyboard.up('q');
  await p.waitForFunction(()=>window.__dante2dReview?.().impactTargets.every(t=>t.hp<500));
  const after=await p.evaluate(()=>window.__dante2dReview());await p.screenshot({path:out+'/'+pet+'-area.jpg',type:'jpeg',quality:92});
  const damages=after.impactTargets.map(t=>500-t.hp);assert.ok(damages.every(d=>d===damages[0]&&d>0));
  if(pet==='bulwark'){assert.ok(after.guard.remaining>0);assert.ok(await p.locator('canvas').count());}
  else assert.equal(after.guard.remaining,0);
  await p.waitForTimeout(800);assert.deepEqual((await p.evaluate(()=>window.__dante2dReview())).impactTargets.map(t=>500-t.hp),damages,'No extra damage from lingering FX');
  report.cases.push({pet,damages,guard:after.guard});await p.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(revision+' native group Q',report.passed);}
