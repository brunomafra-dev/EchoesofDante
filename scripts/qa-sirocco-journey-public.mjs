import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5193',out=process.env.QA_OUT??'docs/sirocco-journey/qa/compiled';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(90000);
const report={base,method:'Production Chrome, direct regional links, real section selector and reload; no DEV globals, isolated real-save sentinel.',errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','public-sirocco-real-save-sentinel'));
 for(const area of ['valley','arid','dunes','sandpit']){
  console.log('Compiled/public',area);const art=p.waitForResponse(r=>r.url().includes('/route-identity/'+area+'-v1.webp')&&r.status()===200);
  await p.goto(base+'/campaign-playtest.html?sirocco=1&arrival='+area+'&v=0.1.146',{waitUntil:'domcontentloaded'});await art;await p.waitForFunction(()=>document.querySelector('[data-lab-notice]')?.textContent?.includes('Soterrado vivo'));await p.locator('.mission-tracker').waitFor();
  assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');
  for(let i=0;i<10;i++){const button=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await button.count())break;await button.click();}
  await p.locator('.campaign-lab-help').evaluate(e=>e.open=true);await p.locator('[name=route-preview]').selectOption(area);p.once('dialog',d=>d.accept());await p.locator('[data-route-preview]').click();await p.waitForFunction(()=>document.querySelector('[data-lab-notice]')?.textContent?.includes('Relatórios por investigar'));await p.waitForTimeout(1000);
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('.mission-tracker').waitFor();await p.waitForFunction(()=>!document.querySelector('.application-shell[open]'));
  assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'public-sirocco-real-save-sentinel');report.checks.push(area+': direct arrival, original art, explicit section preview and reload work; no DEV global or real-save mutation.');
 }
 const library=await fetch(base+'/test-library.html').then(r=>r.text());assert.ok(library.includes('0.1.146')&&library.includes('sirocco=1'));assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await b.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
