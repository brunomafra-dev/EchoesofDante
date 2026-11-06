import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/199/lifecycle';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'}),report={passed:false,base,checks:[],errors:[],warnings:[]};p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.warnings.push(m.text());});
try{
 await p.route('**/*motion-v4.png',async route=>{await new Promise(r=>setTimeout(r,120));await route.continue().catch(()=>{});});
 await p.goto(base+'/campaign-playtest.html?refinement=199');await p.locator('[data-shell=play]').click();await p.locator('[data-shell=new-game]').click();await p.locator('[data-shell=choose-hunter]').click();
 for(let i=0;i<12;i++){await p.locator('[name=character-sex]').selectOption(i%2?'male':'female');await p.waitForTimeout(35);}
 await p.waitForFunction(()=>[...document.querySelectorAll('.showcase-canvas')].length===4&&[...document.querySelectorAll('.showcase-canvas')].every(c=>c.__previewRead?.().ready));
 assert.equal(await p.locator('.showcase-canvas').count(),4);report.checks.push('Twelve native gender switches while model sheets are deliberately delayed finish with exactly four working previews; no destroyed-loader callbacks.');
 for(let i=0;i<3;i++){await p.locator('[data-shell=back]').click();await p.locator('[data-shell=new-game]').click();await p.locator('[data-shell=choose-astral]').click();await p.waitForFunction(()=>[...document.querySelectorAll('.showcase-canvas')].every(c=>c.__previewRead?.().ready));}
 report.checks.push('Repeated selector entry/exit recreates complete previews with valid source lifetimes.');assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('2D lifecycle',report.passed,report.checks);}
