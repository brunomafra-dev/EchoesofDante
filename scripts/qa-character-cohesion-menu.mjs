import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5190',out=process.env.QA_OUT??'docs/character-cohesion/qa/menu';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
const report={base,method:'Compiled-build character selection; actual UI changes, both presentations of all four classes, finite manual demo and screenshots. Human visual assessment pending.',errors:[],previews:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
const click=id=>p.locator(`[data-shell="${id}"]`).click();
try{
 await p.goto(base+'/campaign-playtest.html');await click('play');await click('new-game');
 for(const sex of ['male','female']){
  for(const cls of ['warrior','hunter','astral','xenobinder']){
   await click('choose-'+cls);await p.locator('[name=character-sex]').selectOption(sex);
   const card=p.locator(`[data-class="${cls}"]`);await p.waitForFunction(cls=>document.querySelector(`[data-class="${cls}"] .showcase-canvas`)?.dataset.demoPhase==='idle',cls);
   assert.equal(await p.locator('[name=character-sex]').inputValue(),sex);assert.equal(await card.getAttribute('aria-pressed'),'true');
   assert.equal(await card.locator('.showcase-caption').textContent().then(t=>t.includes('INDISPONÍVEL')),false);
   await click('replay');await p.waitForFunction(cls=>document.querySelector(`[data-class="${cls}"] .showcase-canvas`)?.dataset.demoPhase==='charge',cls);
   await p.waitForFunction(cls=>document.querySelector(`[data-class="${cls}"] .showcase-canvas`)?.dataset.demoPhase==='idle',cls);
   await p.waitForTimeout(600); // Let the finite playback settle, rather than capture its inter-attack idle.
   report.previews.push({classId:cls,sex,idle:true,chargeDemo:true});
  }
  await p.screenshot({path:`${out}/selection-${sex}.png`});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
