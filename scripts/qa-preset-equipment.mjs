import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const revision=process.env.QA_REVISION??'202',base=process.env.QA_BASE??'http://localhost:5194',out=process.env.QA_OUT??('docs/2d-refinement/qa/'+revision+'/mixed-gear');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(90000);
const report={passed:false,base,cases:[],errors:[],fixture:'Isolated visual lab equipment URLs only; no character ownership, boss victory or progress simulated.'};p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const cls of revision==='203'?['astral','xenobinder']:['warrior'])for(const[sex,kit,helmet]of[['female','reinforced','none'],['male','reinforced','none'],['female','clothes','reinforced']]){
  await p.goto(`${base}/character-playtest.html?refinement=${revision}&preset=hunter&class=${cls}&sex=${sex}&kit=${kit}&helmet=${helmet}`,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__dante2dReview?.().ready);const s=await p.evaluate(()=>window.__dante2dReview());assert.equal(s.actor.visualPreset,'hunter');assert.equal(s.actor.identity,cls);
  await p.locator('.playtest-navigation').evaluate(e=>e.open=false);await p.screenshot({path:`${out}/${cls}-${sex}-${kit}-helmet-${helmet}.jpg`,type:'jpeg',quality:90});report.cases.push({cls,sex,kit,helmet,actor:s.actor});
 }
 const original=revision==='203'?'xenobinder':'warrior';
 await p.locator('.playtest-navigation').evaluate(e=>e.open=true);assert.equal(await p.locator('[name=visual-preset]').inputValue(),'hunter');await p.locator('[name=visual-preset]').selectOption(original);await p.waitForFunction(cls=>window.__dante2dReview?.().actor?.visualPreset===cls,original);
 await p.locator('[name=visual-preset]').selectOption('hunter');await p.waitForFunction(()=>window.__dante2dReview?.().actor?.visualPreset==='hunter');
 await p.locator('[name=visual-preset]').selectOption(original);await p.waitForFunction(cls=>window.__dante2dReview?.().actor?.visualPreset===cls,original);
 const next=await p.locator('[data-choice=class][data-value=hunter]').getAttribute('href');assert.ok(!next.includes('preset='+original));await p.goto(base+next);await p.waitForFunction(()=>window.__dante2dReview?.().actor?.identity==='hunter');assert.equal((await p.evaluate(()=>window.__dante2dReview())).actor.visualPreset,'hunter');
 report.checks=['Helmet removal/equipment mixing preserves selected visual; screenshots recorded for inspection.','Laboratory repeatedly compares original and scout on the same profession; navigation does not carry an invalid cross-pair.'];assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log(revision+' equipment',report.passed);}
