import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5193',out=process.env.QA_OUT??'docs/2d-refinement/qa/boss-labs';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'}),report={passed:false,base,checks:[],cases:[],errors:[],method:'Compiled/native boss laboratory arrival and class links; explicit previous campaign fixture. Boss HP inspected read-only. No victory, combat commands, invulnerability or damage simulation.'};p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
try{
 await p.addInitScript(()=>{if(!localStorage['echoes-of-dante.characters.v1'])localStorage['echoes-of-dante.characters.v1']='boss-lab-real-save';});
 for(const[boss,area]of[['soterrado','sandpit'],['vesper','icenest']]){
  await p.goto(`${base}/campaign-playtest.html?refinement=198&${boss}=1&class=astral&v=0.1.198`);
  for(const cls of ['astral','hunter']){
   await p.waitForFunction(({area,boss,cls})=>{const s=window.__dante2dReview?.();return s?.ready&&s.area===area&&s.actor?.identity===cls&&s.bosses.some(b=>b.id===boss&&b.hp>0&&!b.dead);},{area,boss,cls});
   const s=await p.evaluate(()=>window.__dante2dReview());assert.equal(await p.locator('[data-refinement=bond]').count(),0);assert.ok(s.namespace.includes(boss+'.'+cls));assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'boss-lab-real-save');
   report.cases.push({boss,classId:cls,area:s.area,bosses:s.bosses,namespace:s.namespace});await p.screenshot({path:`${out}/${boss}-${cls}.jpg`,type:'jpeg',quality:88});
   if(cls==='astral'){await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);const link=p.locator(`.campaign-lab-help a[href*="${boss}=1"][href*="class=hunter"]`);assert.equal(await link.count(),1);assert.ok((await link.getAttribute('href')).includes('refinement=198'));await link.click();}
  }
 }
 report.checks.push('Vesper and Soterrado direct links arrive with living bosses and correct classes; native class navigation keeps the new isolated review and independent class fixture.');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:88}).catch(()=>{});throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('Boss lab links',report.passed);}
