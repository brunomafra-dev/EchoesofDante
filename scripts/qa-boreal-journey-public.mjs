import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5193',out=process.env.QA_OUT??'docs/boreal-journey/qa/compiled';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(90000);
const report={base,method:'Production Chrome, direct regional links, real section selector and reload; no DEV globals, isolated real-save sentinel.',errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','public-boreal-real-save-sentinel'));
 for(const area of ['frost','icecave','icenest']){
  console.log('Compiled/public',area);const art=p.waitForResponse(r=>r.url().includes('/route-identity/'+area+'-v1.webp')&&r.status()===200);
  await p.goto(base+'/campaign-playtest.html?boreal=1&arrival='+area+'&v=0.1.147',{waitUntil:'domcontentloaded'});await art;await p.waitForFunction(()=>document.querySelector('[data-lab-notice]')?.textContent?.includes('Vésper vivo'));await p.locator('.mission-tracker').waitFor();
  assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');
  // Frost has no unspent point; later previews may open the upgrade dialog
  // after scene startup. Allow its scheduled opening before looking for it.
  await p.waitForTimeout(1200);
  for(let i=0;i<10;i++){const button=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await button.count())break;await button.click();await p.waitForTimeout(180);}
  await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);await p.locator('[name=route-preview]').selectOption(area);p.once('dialog',d=>d.accept());await p.locator('[data-route-preview]').click();await p.waitForFunction(()=>document.querySelector('[data-lab-notice]')?.textContent?.includes('Relatórios por investigar'));await p.waitForTimeout(1000);
  console.log('Selector passed',area);await p.reload({waitUntil:'domcontentloaded'});await p.locator('.mission-tracker').waitFor();await p.waitForFunction(()=>!document.querySelector('.application-shell[open]'));
  assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'public-boreal-real-save-sentinel');report.checks.push(area+': direct arrival, original art, explicit section preview and reload work; no DEV global or real-save mutation.');
 }
 const library=await fetch(base+'/test-library.html').then(r=>r.text());assert.ok(library.includes('0.1.147')&&library.includes('boreal=1'));assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
