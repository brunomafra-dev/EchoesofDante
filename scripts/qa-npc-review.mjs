import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/settlement-motion/qa/npc-review',base=process.env.QA_BASE??'http://localhost:5185';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1366,height:768}}),report={base,checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
async function ready(area){await page.waitForFunction(a=>{const s=window.__danteGame?.scene.getScene('Game');return s?.hud&&s.area===a&&!s.transitioning&&s.settlementLife},area,{timeout:120000});for(let i=0;i<12;i++){await page.waitForTimeout(120);const button=page.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await button.count())await button.click();else if(i>5)break}}
const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,people:s.settlementLife.snapshot(),missions:s.missions.snapshot(),bosses:[s.soterradoDefeated,s.vesperDefeated,s.titanDefeated],position:s.player.position,clear:s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>=o.radius+s.player.radius-.2),rewards:s.missionRewards,credits:s.economy.credits}});
try{
 await page.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='npc-review-real-sentinel';localStorage['echoes-of-dante.settings.v1']='npc-review-settings-sentinel'});
 await page.goto(base+'/campaign-playtest.html?npc-review=base&npc=lia');await page.waitForFunction(()=>sessionStorage['dante-npc-review-v1.warrior.npc-stop']==='base:lia');await ready('base');
 report.visits=[];
 for(const[stop,area,ids,focus]of [['base','base',['ivo','lia','nara'],'ivo'],['base','base',['ivo','lia','nara'],'lia'],['base','base',['ivo','lia','nara'],'nara'],['departure','base',['ivo','lia','nara','caio','elisa'],'caio'],['departure','base',['ivo','lia','nara','caio','elisa'],'elisa'],['camp','terraces',['caio','elisa'],'caio'],['camp','terraces',['caio','elisa'],'elisa'],['arrivals','terraces',['caio','elisa','mara','tomas'],'mara'],['arrivals','terraces',['caio','elisa','mara','tomas'],'tomas']]){
  await page.locator('.npc-review-help summary').click();await page.locator(`[data-npc-review-stop=${stop}][data-npc-review-focus=${focus}]`).click();await page.waitForFunction(k=>sessionStorage['dante-npc-review-v1.warrior.npc-stop']===k,stop+':'+focus);await ready(area);
  const s=await state();assert.deepEqual(s.people.map(n=>n.id).sort(),ids.sort());assert.deepEqual(s.bosses,[false,false,false]);assert.ok(s.clear,stop+' arrival collision');const n=s.people.find(n=>n.id===focus);assert.ok(Math.hypot(n.x-s.position.x,n.y-s.position.y)<180,focus+' close arrival');assert.ok(!s.rewards.includes('settle-arrivals'));assert.ok(!s.missions.completed.includes('settle-arrivals'));
  if(area==='terraces')assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies.length),0);
  if(stop==='arrivals'){assert.ok(s.missions.evidence.includes('pc-receive'));assert.ok(!s.missions.evidence.includes('pc-home'));}report.visits.push({stop,focus,area,people:s.people.map(n=>n.id)});
  if(['lia','nara','caio','mara','tomas'].includes(focus))await page.screenshot({path:`${out}/${stop}-${focus}.jpg`,type:'jpeg',quality:82});
 }
 report.checks.push('All nine individual approaches cover seven NPCs across Base/Terraces and four occupancy presets, with clear arrivals, quiet camp and later bosses alive');
 const before=await state();await page.reload();await ready('terraces');const after=await state();assert.deepEqual(after.missions,before.missions);assert.deepEqual(after.rewards,before.rewards);assert.equal(after.credits,before.credits);report.checks.push('Reload keeps the selected visit without preparing/rewarding it again');
 await page.locator('.npc-review-help summary').click();await page.locator('[data-npc-review-stop=base][data-npc-review-focus=lia]').click();await ready('base');assert.deepEqual((await state()).people.map(n=>n.id).sort(),['ivo','lia','nara']);await page.keyboard.press('e',{delay:100});await page.locator('.mission-dialog[open]').waitFor();await page.keyboard.press('Escape');
 await page.setViewportSize({width:844,height:390});await page.locator('.npc-review-help summary').click();await page.screenshot({path:out+'/panel-844.jpg',type:'jpeg',quality:82});await page.locator('[data-npc-review-stop=arrivals][data-npc-review-focus=mara]').click();await ready('terraces');await page.screenshot({path:out+'/arrivals-844.jpg',type:'jpeg',quality:82});
 assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'npc-review-real-sentinel');assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.settings.v1']),'npc-review-settings-sentinel');
 report.checks.push('Actual Lia E remains available; compact visit panel works at 844x390; real-save/settings sentinels untouched');
 await page.goto(base+'/?npc-review=arrivals');await page.waitForTimeout(2000);assert.ok(!await page.locator('.npc-review-help').count());report.checks.push('Production entry with the review query never loads the lab panel or temporary preset');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
