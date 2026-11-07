import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'https://echosofdante.vercel.app',out=process.env.QA_OUT??'docs/2d-refinement/qa/203/public-solo';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),report={passed:false,base,cases:[],errors:[],fixture:'Fresh isolated native characters, no boss or progression fixture. Published entry and actual world, native basic/Q/movement; no canonical profile writes.'};
try{
 for(const cls of ['astral','xenobinder'])for(const sex of ['male','female']){
  const p=await b.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='public-canonical-profile';});
  const click=id=>p.locator(`[data-shell=${id}]`).click();await p.goto(`${base}/campaign-playtest.html?refinement=203&presets=1&preset=hunter&class=${cls}&sex=${sex}&v=0.1.203`);await p.waitForFunction(()=>document.querySelector('.hero-preview-host canvas')?.__previewRead?.().ready);const preview=await p.locator('.hero-preview-host canvas').evaluate(e=>e.__previewRead());assert.equal(preview.identity,cls);assert.equal(preview.visualPreset,'hunter');assert.equal(preview.sex,sex);
  await p.locator('[name=character-name]').fill('Batedor '+cls);await click('replay');await p.waitForFunction(()=>document.querySelector('.hero-preview-host canvas')?.dataset.demoPhase==='release');await p.screenshot({path:`${out}/${cls}-${sex}-demo.jpg`,type:'jpeg',quality:86});await click('create');await click('difficulty-normal');await click('prologue-skip');await p.waitForFunction(()=>!document.querySelector('.application-shell')?.open&&window.__dante2dReview?.().ready);
  const first=await p.evaluate(()=>window.__dante2dReview());assert.equal(first.actor.identity,cls);assert.equal(first.actor.visualPreset,'hunter');assert.equal(first.actor.sex,sex);assert.equal(first.area,'base');
  await p.keyboard.down('a');await p.waitForTimeout(350);await p.keyboard.up('a');const moved=await p.evaluate(()=>window.__dante2dReview());assert.ok(Math.hypot(first.position.x-moved.position.x,first.position.y-moved.position.y)>10);await p.mouse.move(940,360);await p.mouse.down();await p.waitForTimeout(300);await p.mouse.up();await p.keyboard.down('q');await p.waitForTimeout(450);await p.keyboard.up('q');await p.screenshot({path:`${out}/${cls}-${sex}-world.jpg`,type:'jpeg',quality:86});
  assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'public-canonical-profile');report.cases.push({profession:cls,sex,body:moved.actor.visualPreset,area:moved.area});await p.close();console.log('Published scout',cls,sex);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await b.close();console.log('203 public solo',report.passed);}
