import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/progression-threat/qa/public';await mkdir(out,{recursive:true});
const base='https://echosofdante.vercel.app/threat-playtest.html?region=forest&kit=basic';
const report={at:new Date().toISOString(),method:'Two Chrome contexts using published Vercel laboratory and real Render WSS, keyboard/mouse. No physical devices.',errors:[],checks:[]};
const browser=await chromium.launch({channel:'chrome',headless:true}),h=await browser.newPage({viewport:{width:1280,height:720}}),g=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});
let world,joined=[],frames=0;
for(const p of[h,g]){p.setDefaultTimeout(65000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});p.on('websocket',ws=>ws.on('framereceived',e=>{try{const m=JSON.parse(String(e.payload));if(m.type==='joined')joined.push({role:m.role,protocol:m.protocol});if(p===g&&m.type==='world'){world=m.world;frames++}}catch{}}))}
const until=async test=>{for(let i=0;i<300;i++){if(test())return;await g.waitForTimeout(100)}throw Error('Published snapshot condition timed out')};
const key=async(k,ms)=>{await g.keyboard.down(k);await g.waitForTimeout(ms);await g.keyboard.up(k);await g.waitForTimeout(180)};
try{
 report.health=await(await fetch('https://echoes-of-dante-rooms.onrender.com/coop/health',{signal:AbortSignal.timeout(60000)})).json();assert.equal(report.health.protocol,5);
 await h.goto(base);await h.locator('.threat-lab').waitFor();await h.locator('.threat-lab').evaluate(e=>e.open=false);await h.locator('.expedition-credits').waitFor();await h.keyboard.press('Escape');
 await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await h.locator('[name="coop-invite"]').waitFor();
 const link=await h.locator('[name="coop-invite"]').inputValue();const u=new URL(link);assert.equal(u.pathname,'/threat-playtest.html');assert.equal(u.searchParams.get('class'),'hunter');
 await g.goto(link);await g.locator('[data-shell="play-character"]').waitFor();assert.ok(!joined.some(m=>m.role==='guest'));await g.locator('[data-shell="play-character"]').click();await g.locator('.threat-lab').evaluate(e=>e.open=false);
 await until(()=>world?.partner&&joined.some(m=>m.role==='guest'));assert.ok(joined.every(m=>m.protocol===5));report.checks.push('Public protocol 5, real room creation, isolated invite and character confirmation');
 const before={...world.partner};await key('d',320);await until(()=>world.partner.x>before.x+20);await key('Space',100);await until(()=>world.partner.dashReady<.6);await g.waitForTimeout(1800);
 await g.keyboard.down('q');await until(()=>world.partner.phase==='CHARGING'&&world.partner.level>.2);await g.keyboard.up('q');await until(()=>world.partner.chargeReady<.4);report.checks.push('Published guest movement, Dash with cooldown and hold/release Q');
 await g.screenshot({path:out+'/guest.png'});report.frames=frames;report.pose={maxHp:world.partner.maxHp,dashCooldown:world.partner.dashCooldown,chargeCooldown:world.partner.chargeCooldown};
 assert.equal(await h.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);assert.equal(await g.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
 report.checks.push('Published laboratory preserves real localStorage');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{
 try{if(!await h.locator('.application-shell[open]').count())await h.keyboard.press('Escape');if(await h.locator('[data-shell="coop"]').count())await h.locator('[data-shell="coop"]').click({timeout:2000});if(await h.locator('[data-shell="coop-leave"]').count())await h.locator('[data-shell="coop-leave"]').click({timeout:2000})}catch{}
 await browser.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2));
}
console.log(report);
