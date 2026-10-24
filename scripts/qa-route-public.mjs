import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5193',arc=process.env.QA_ARC??'sirocco',out=process.env.QA_OUT??`.local/route-public-${arc}`,version=process.env.QA_VERSION??'0.1.143';
const areas={sirocco:['valley','arid','dunes','sandpit'],boreal:['frost','icecave','icenest'],embers:['cinder','obsidian','caldera']}[arc];await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(90000);const report={arc,version,base,errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','real-route-save-sentinel'));
 for(const area of areas){
  const response=p.waitForResponse(r=>r.url().includes(`/route-identity/${area}-v1.webp`)&&r.status()===200);
  await p.goto(base+`/world-finish-playtest.html?area=${area}&trails=1&v=${version}`);await response;await p.waitForFunction(()=>document.querySelector('.mobile-vitals'));await p.waitForTimeout(900);
  assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');assert.ok((await p.locator('.world-finish-lab summary').textContent()).includes('TRILHAS'));
  await p.locator('.world-finish-lab').evaluate(e=>e.open=true);await p.locator('[name=spot]').selectOption('1');await p.locator('.mobile-vitals').waitFor();await p.waitForTimeout(600);
  assert.equal(await p.locator('[name=spot]').inputValue(),'1');assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'real-route-save-sentinel');report.checks.push(area+': new art loads, direct preview and section selector work, production has no DEV globals, real save untouched');console.log('Public',area);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await b.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
