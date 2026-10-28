import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5193',out=process.env.QA_OUT??'docs/settlement-motion/qa/npc-review-compiled';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true}),report={base,method:'Compiled build, no DEV globals; direct links and real touch panel navigation, isolated saves and reload.',checks:[],errors:[]};
page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
async function ready(key){await page.waitForFunction(k=>sessionStorage['dante-npc-review-v1.warrior.npc-stop']===k,key);await page.locator('.mission-tracker').waitFor();for(let i=0;i<15;i++){await page.waitForTimeout(150);const button=page.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await button.count())await button.click();else if(i>6)break;}}
const saved=()=>page.evaluate(()=>JSON.parse(sessionStorage[Object.keys(sessionStorage).find(k=>k.startsWith('dante-npc-review-v1.warrior.')&&k.includes('echoes-of-dante.journey.v1.character.'))]));
try{
 await page.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='npc-public-real-sentinel';localStorage['echoes-of-dante.settings.v1']='npc-public-settings-sentinel'});
 for(const[stop,focus,area]of [['base','lia','base'],['departure','caio','base'],['camp','elisa','terraces'],['arrivals','mara','terraces']]){
  await page.goto(`${base}/campaign-playtest.html?npc-review=${stop}&npc=${focus}&v=0.1.165`);await ready(stop+':'+focus);assert.equal(await page.evaluate(()=>typeof window.__danteGame),'undefined');const s=await saved();assert.equal(s.area,area);for(const k of ['soterradoDefeated','vesperDefeated','titanDefeated'])assert.equal(s.flags[k],false);assert.ok(!s.missionRewards.includes('settle-arrivals'));await page.screenshot({path:`${out}/${stop}.jpg`,type:'jpeg',quality:83});report.checks.push('Direct '+stop+' link reaches '+area+' with protected saves and later bosses alive');
 }
 const before=await saved();await page.reload();await ready('arrivals:mara');const after=await saved();assert.deepEqual(after.missions,before.missions);assert.deepEqual(after.missionRewards,before.missionRewards);assert.equal(after.economy.credits,before.economy.credits);
 for(const viewport of [{width:844,height:390},{width:568,height:320}]){
  await page.setViewportSize(viewport);await page.locator('.npc-review-help summary').tap();await page.screenshot({path:`${out}/panel-${viewport.width}.jpg`,type:'jpeg',quality:83});await page.locator('[data-npc-review-stop=base][data-npc-review-focus=nara]').tap();await ready('base:nara');await page.locator('.npc-review-help summary').tap();await page.locator('[data-npc-review-stop=arrivals][data-npc-review-focus=mara]').tap();await ready('arrivals:mara');
 }
 assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'npc-public-real-sentinel');assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.settings.v1']),'npc-public-settings-sentinel');
 const library=await fetch(base+'/test-library.html').then(r=>r.text());for(const stop of ['base','departure','camp','arrivals'])assert.ok(library.includes('npc-review='+stop));assert.deepEqual(report.errors,[]);report.checks.push('Reload preserves the visit; touch switches maps/focus at 844x390 and 568x320; real-save/settings sentinels and library links preserved');report.passed=true;
}catch(error){report.failure=String(error);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
