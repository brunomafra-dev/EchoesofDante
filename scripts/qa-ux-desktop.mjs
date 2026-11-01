import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',out=process.env.QA_OUT??'docs/ux-general/qa/desktop';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1920,height:1080},hasTouch:false,isMobile:false});p.setDefaultTimeout(90000);
const r={base,method:'Native desktop context, mouse/keyboard, isolated advanced lab; no DEV globals. Existing fixture only, Vesper/Titan remain pending.',checks:[],errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
async function closeUpgrades(){for(let i=0;i<15;i++){const e=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await e.count())await e.click();await p.waitForTimeout(100);}}
async function gameKey(key){await p.waitForTimeout(350);await p.keyboard.down(key);await p.waitForTimeout(120);await p.keyboard.up(key);}
try{
 await p.goto(base+'/campaign-playtest.html?ux-review=1&permanence=icecave&v=0.1.180');await p.locator('.mission-tracker').waitFor();await p.waitForTimeout(1700);await closeUpgrades();
 assert.equal(await p.evaluate(()=>matchMedia('(pointer:coarse)').matches),false);await p.keyboard.press('j');await p.locator('.mission-dialog[open]').waitFor();assert.equal(await p.locator('.mission-picker').evaluate(e=>e.open),true);await p.screenshot({path:out+'/journal-native-desktop.jpg',type:'jpeg',quality:85});
 await p.setViewportSize({width:840,height:650});await p.waitForTimeout(200);assert.equal(await p.locator('.mission-picker').evaluate(e=>e.open),false);await p.setViewportSize({width:1920,height:1080});await p.waitForTimeout(200);assert.equal(await p.locator('.mission-picker').evaluate(e=>e.open),true);await p.keyboard.press('Escape');
 await gameKey('e');await p.locator('.mission-dialog[open]').waitFor();await p.screenshot({path:out+'/ivo-native-desktop.jpg',type:'jpeg',quality:85});await p.locator('[data-mission-action=services]').click();await p.locator('dialog[open]:not(.mission-dialog)').waitFor();await p.keyboard.press('Escape');
 await gameKey('m');await p.locator('[data-destination=base]').waitFor();r.vesperLocked=await p.locator('[data-destination=icenest]').isDisabled();assert.equal(r.vesperLocked,true,'atlas retains original glacier gate');await p.keyboard.press('Escape');
 await p.locator('.main-menu-button').click();await p.locator('[data-shell=equipment]').click();await p.locator('dialog[open]:not(.application-shell)').waitFor();await p.screenshot({path:out+'/inventory-native-desktop.jpg',type:'jpeg',quality:85});await p.keyboard.press('Escape');
 r.checks.push('Native desktop sidebar/detail and live window resize work; mouse reaches workshop, keyboard reaches atlas with Vesper still gated, pause menu reaches inventory');assert.deepEqual(r.errors,[]);r.passed=true;
}catch(e){r.failure=String(e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:85}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(r,null,2)+'\n');await b.close();console.log(JSON.stringify(r));}
