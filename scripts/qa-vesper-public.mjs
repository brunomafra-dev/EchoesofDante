import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5193',out=process.env.QA_OUT??'docs/vesper-counterplay/qa/compiled';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(120000);
const report={base,method:'Compiled Chrome, no DEV globals: real direct arrival/reload, keyboard encounter trigger, actual score requests and audition controls; real-save sentinel.',checks:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());if(r.url().includes('vesper-reaction-v1.webp')&&[200,304].includes(r.status()))report.newCrashArt=true});
try{
 await p.addInitScript(()=>{localStorage.setItem('echoes-of-dante.characters.v1','real-vesper-public-sentinel');localStorage.setItem('echoes-of-dante.settings.v1','real-settings-sentinel')});
 await p.goto(base+'/campaign-playtest.html?vesper=1&v=0.1.152',{waitUntil:'domcontentloaded'});
 await p.locator('.mission-tracker').waitFor({state:'attached'});await p.waitForTimeout(1200);
 for(let i=0;i<16;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await b.count())break;await b.click();await p.waitForTimeout(250)}
 await p.locator('.mission-tracker').waitFor();assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');
 await p.reload({waitUntil:'domcontentloaded'});await p.locator('.mission-tracker').waitFor({state:'attached'});await p.waitForTimeout(1500);await p.waitForFunction(()=>!document.querySelector('.application-shell[open]'));
 const music=p.waitForResponse(r=>r.url().includes('/score-149/vesper.mp3')&&[200,206].includes(r.status()));await p.keyboard.down('d');await p.waitForTimeout(2300);await p.keyboard.up('d');await music;
 await p.waitForTimeout(1000);await p.screenshot({path:out+'/encounter.png'});assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'real-vesper-public-sentinel');assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.settings.v1']),'real-settings-sentinel');report.checks.push('Compiled isolated arrival/reload and real keyboard encounter load new Vesper music; real saves/settings preserved');
 await p.goto(base+'/soundtrack-playtest.html?v=0.1.152',{waitUntil:'domcontentloaded'});await p.locator('#region').selectOption('frost');
 const frost=p.waitForResponse(r=>r.url().includes('/score-149/frost.mp3'));await p.locator('#explore').click();await frost;await p.waitForTimeout(200);
 const vesper=p.waitForResponse(r=>r.url().includes('/score-149/vesper.mp3'));await p.locator('#encounter').click();await vesper;await p.locator('[data-cue=rush]').click();await p.locator('#music').fill('0');await p.locator('#sfx').fill('0');await p.locator('#stop').click();report.checks.push('Public audition plays exploration/boss assets, cues, independent volume and stop controls');
 const library=await fetch(base+'/test-library.html').then(r=>r.text());assert.ok(library.includes('0.1.152')&&library.includes('soundtrack-playtest.html')&&library.includes('vesper=1'));assert.deepEqual(report.errors,[]);assert.equal(report.newCrashArt,true);report.passed=true;
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await browser.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
