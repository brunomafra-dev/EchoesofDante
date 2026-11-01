import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/ux-general/qa/delivery',base='http://127.0.0.1:5185';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:568,height:320},hasTouch:true,isMobile:true});p.setDefaultTimeout(90000);
const r={method:'Isolated advanced DEV lab. Explicit QA fixture adds only the three analyses of exp-cavern to stage a ready regional report beside the available icecave chapter. Actual NPC dialogue delivery/ledger/reload tested. No Vesper/Titan victory or real save changes.',errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
async function ready(){await p.waitForFunction(()=>window.__danteGame?.scene.keys.Game?.missionUi&&!window.__danteGame.scene.keys.Game.transitioning);await p.waitForTimeout(1300);for(let i=0;i<14;i++){const e=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await e.count())await e.tap();await p.waitForTimeout(80);}}
async function state(){return p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;return{credits:s.economy.credits,receipts:[...s.missionRewards],vesper:s.vesperDefeated,titan:s.titanDefeated};});}
try{
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;});await p.goto(base+'/campaign-playtest.html?ux-review=1&permanence=icecave');await ready();
 r.fixture=await p.evaluate(async()=>{const s=window.__danteGame.scene.keys.Game,{missionById}=await import('/src/config/missions.ts');s.missions.act('accept','exp-cavern');const d=missionById('exp-cavern');for(const g of d.goals)s.missions.record(g.id);s.saveProgress();return{report:d.id,analyses:d.goals.map(g=>g.id),credits:d.credits};});
 r.before=await state();await p.locator('[data-action=interact]').tap();await p.locator('.mission-dialog[open]').waitFor();assert.equal(await p.locator('.mission-content').getAttribute('data-mission'),'exp-cavern','ready regional report takes priority over available chapter');
 const rect=await p.locator('[data-mission-action=deliver]').boundingBox();assert.ok(rect.y+rect.height<=308);await p.screenshot({path:out+'/ready-report.jpg',type:'jpeg',quality:85});
 await p.locator('[data-mission-action=deliver]').tap();await p.waitForFunction(()=>!document.querySelector('.mission-dialog[open]'));r.after=await state();assert.equal(r.after.credits,r.before.credits+r.fixture.credits);assert.equal(r.after.receipts.filter(id=>id==='exp-cavern').length,1);
 await p.waitForTimeout(350);await p.locator('[data-action=interact]').tap();await p.locator('.mission-dialog[open]').waitFor();assert.equal(await p.locator('[data-mission-action=deliver]').count(),0);await p.keyboard.press('Escape');
 await p.reload();await ready();r.reloaded=await state();assert.deepEqual(r.reloaded,r.after);assert.equal(r.after.vesper,false);assert.equal(r.after.titan,false);assert.deepEqual(r.errors,[]);r.passed=true;
}catch(e){r.failure=String(e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:85}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(r,null,2)+'\n');await b.close();console.log(JSON.stringify(r));}
