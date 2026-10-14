import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'https://echosofdante.vercel.app';
const out=process.env.QA_OUT??'docs/prologue-menu/qa/public';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={base,method:'Public compiled build, one Chrome context, reduced motion, no DEV exports; automatic full prologue with no skip/advance input.',errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});
 await page.addInitScript(()=>{
  window.qaTimeline=[];
  new MutationObserver(()=>{
   const take=document.querySelector('.prologue')?.dataset.take;
   if(take&&window.qaTimeline.at(-1)?.take!==take)window.qaTimeline.push({take,at:performance.now()});
   if(!take&&window.qaTimeline.length&&!window.qaIntroDone)window.qaIntroDone=performance.now();
  }).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-take']});
 });
 await page.goto(base+'/campaign-playtest.html');
 for(const id of ['play','new-game','new-character','choose-warrior'])await page.locator(`[data-shell="${id}"]`).click();
 await page.locator('[name=character-name]').fill('Chegada automatica');await page.locator('[data-shell=create]').click();
 await page.waitForFunction(()=>window.qaIntroDone&&window.qaTimeline.length===5,{},{timeout:65000});
 report.timeline=await page.evaluate(()=>({takes:window.qaTimeline,end:window.qaIntroDone}));
 assert.deepEqual(report.timeline.takes.map(t=>t.take),['earth','evacuation','voyage','dante','landing']);
 report.durations=report.timeline.takes.map((take,i)=>(report.timeline.takes[i+1]?.at??report.timeline.end)-take.at);
 for(const duration of report.durations)assert.ok(duration>=7600&&duration<=11000,`Take duration ${duration}ms`);
 assert.ok(await page.locator('.prologue').count()===0);assert.equal(await page.locator('.application-shell').evaluate(d=>d.open),false);
 const saved=await page.evaluate(()=>{const registry=JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')),hero=registry.characters.find(p=>p.id===registry.selected);return {introSeen:hero.campaign.introSeen,area:JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.'+hero.id)).area};});
 assert.equal(saved.introSeen,true);assert.equal(saved.area,'base');assert.deepEqual(report.errors,[]);report.saved=saved;report.passed=true;
 console.log(JSON.stringify({passed:true,durations:report.durations,saved},null,2));
}catch(error){report.failure=String(error);throw error;}finally{await browser.close();await writeFile(out+'/timeline-report.json',JSON.stringify(report,null,2));}
