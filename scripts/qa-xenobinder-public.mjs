import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out=process.argv[2]??'docs/xenobinder/qa/public',base=process.argv[3]??'https://echosofdante.vercel.app/';await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),method:'Browser-facing production-compatible QA: real UI, keyboard/mouse, asset loading and WebSocket frames; no DEV globals needed. Local/published service explicitly identified.',base,errors:[],checks:[],joined:[]};
const browser=await chromium.launch({channel:'chrome',headless:true});
const h=await browser.newPage({viewport:{width:1280,height:720}}),g=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
let world;
for(const p of[h,g]){p.setDefaultTimeout(65000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});p.on('websocket',ws=>ws.on('framereceived',e=>{try{const m=JSON.parse(String(e.payload));if(m.type==='joined')report.joined.push({role:m.role,protocol:m.protocol});if(p===g&&m.type==='world')world=m.world;}catch{}}));}
const until=async f=>{for(let i=0;i<600;i++){if(f())return;await g.waitForTimeout(100)}throw Error('Snapshot timed out')};
async function open(p,params){await p.goto(base+'xenobinder-playtest.html?'+params,{waitUntil:'domcontentloaded',timeout:90000});await p.locator('.xenobinder-panel').waitFor();await p.locator('.threat-lab').evaluate(e=>e.open=false);for(let i=0;i<15;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();}await p.waitForTimeout(400);}
try{
 for(const sex of['male','female']){
  await open(h,'sex='+sex+'&kit=basic');await h.mouse.move(1050,360);await h.keyboard.down('q');await h.waitForTimeout(450);await h.keyboard.up('q');await h.waitForTimeout(250);assert.match(await h.locator('.xenobinder-panel').innerText(),/Vínculo 0\/100/);await h.screenshot({path:out+'/'+sex+'.png'});
 }
 await open(h,'sex=female&kit=advanced&region=obsidian');await h.keyboard.press('d');await h.keyboard.press('Space');await h.screenshot({path:out+'/garganta.png'});
 assert.equal(await h.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);report.checks.push('Both presentations and advanced volcanic kit load without broken assets, Q spends resource and real saves stay untouched');
 const healthUrl=base.startsWith('http://localhost')?base+'coop/health':'https://echoes-of-dante-rooms.onrender.com/coop/health';
 try{report.health=await(await fetch(healthUrl,{signal:AbortSignal.timeout(55000)})).json();}catch(e){report.coop={status:'unreachable-service',reason:String(e)};}
 if(report.health?.protocol===9){
  await h.goto(base+'xenobinder-playtest.html?class=warrior&kit=basic');await h.locator('.expedition-credits').waitFor();await h.locator('.threat-lab').evaluate(e=>e.open=false);await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await h.locator('[name="coop-invite"]').waitFor();
  const invitation=new URL(await h.locator('[name="coop-invite"]').inputValue());assert.equal(invitation.pathname,'/xenobinder-playtest.html');invitation.searchParams.set('class','xenobinder');
  await g.goto(invitation.href);await g.locator('[data-shell="play-character"]').waitFor();assert.ok(!report.joined.some(m=>m.role==='guest'));await g.locator('[data-shell="play-character"]').click();await g.locator('.threat-lab').evaluate(e=>e.open=false);await until(()=>world?.partner?.xenobinder?.active);
  await g.keyboard.down('q');await until(()=>world.partner.phase==='CHARGING'&&world.partner.level>.2);await g.keyboard.up('q');await until(()=>world.partner.xenobinder.bond===0);assert.ok(report.joined.every(m=>m.protocol===9));assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
  report.coop={status:'passed',companion:true,bond:world.partner.xenobinder.bond};await g.screenshot({path:out+'/guest.png'});report.checks.push('Real creation/invite/character confirmation, Xenobinder guest and authoritative command, temporary storage on both browsers');
 }else if(report.health)report.coop={status:'blocked-relay-deployment',required:9,observed:report.health.protocol};
 assert.deepEqual(report.errors,[]);report.soloPassed=true;report.passed=report.soloPassed&&report.coop.status==='passed';
}catch(e){report.failure=String(e);throw e}finally{
 try{if(report.joined.length){await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click({timeout:1000});await h.locator('[data-shell="coop-leave"]').click({timeout:1000});}}catch{}
 await browser.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2));
}
console.log(report);
