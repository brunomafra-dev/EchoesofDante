import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5193',out=process.env.QA_OUT??'docs/early-journey/qa/compiled';await mkdir(out,{recursive:true});
const report={checks:[],errors:[],browsers:[]};
for(const [name,engine,options]of [['Chrome',chromium,{channel:'chrome'}],['WebKit mobile',webkit,{}]]){
 if(process.env.QA_BROWSER==='webkit'&&name==='Chrome'||process.env.QA_BROWSER==='chrome'&&name!=='Chrome')continue;console.log('Browser',name);
 const b=await engine.launch(options);try{const p=await b.newPage({viewport:name==='Chrome'?{width:1366,height:768}:{width:844,height:390},hasTouch:name!=='Chrome',isMobile:name!=='Chrome'});p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(name+': '+e.message));
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','public-real-save-sentinel'));
 await p.goto(base+'/campaign-playtest.html?route=1&v=0.1.142');await p.locator('.mission-tracker').waitFor();await p.waitForFunction(()=>!document.querySelector('.application-shell[open]'));
 assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');
 for(const area of ['forest','cavern']){console.log(name,area);
  await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);await p.locator('[name=route-preview]').selectOption(area);p.once('dialog',d=>d.accept());await p.locator('[data-route-preview]').click();await p.waitForTimeout(2300);await p.locator('[data-lab-notice]').waitFor({state:'attached'});assert.ok((await p.locator('[data-lab-notice]').textContent()).includes('Bosses vivos'));
  if(name==='Chrome'&&process.env.QA_SCREENSHOTS!=='0')await p.screenshot({path:out+'/'+name.replaceAll(' ','-')+'-'+area+'.png'});
 }
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'public-real-save-sentinel');report.browsers.push(name);report.checks.push(name+': compiled lab starts, both explicit previews work with bosses alive, no DEV global, real storage untouched');
 for(const area of ['forest','cavern']){
  const response=p.waitForResponse(r=>r.url().includes(area==='forest'?'living-basin-v1.webp':'cavern-landmarks-v1.webp')&&r.status()===200);
  await p.goto(base+`/campaign-playtest.html?route=1&arrival=${area}&v=0.1.142`);await response;
  await p.waitForFunction(()=>document.querySelector('[data-lab-notice]')?.textContent?.includes('Bosses vivos'));await p.waitForTimeout(1800);
  assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');
  if(name==='Chrome'&&process.env.QA_SCREENSHOTS!=='0')await p.screenshot({path:out+'/direct-'+area+'.png'});
  await p.reload();await p.locator('.mission-tracker').waitFor();await p.waitForFunction(()=>!document.querySelector('.application-shell[open]'));
 }
 report.checks.push(name+': both new direct links preload the authored art, enter automatically and resume on reload without DEV globals');
 }finally{await b.close()}
}
const library=await fetch(base+'/test-library.html').then(r=>r.text());assert.ok(library.includes('arrival=forest')&&library.includes('0.1.142'));assert.deepEqual(report.errors,[]);report.passed=true;await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
