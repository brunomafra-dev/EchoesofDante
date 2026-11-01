import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/visual-integration/qa/pressure',base=process.env.QA_BASE??'http://127.0.0.1:5185';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(90000);
const r={base,method:'Existing isolated water-chapter arrival. Acceptance staged explicitly by Missions API solely to inspect the active pressure surface. DEV travel/approach only; warning and damage run on normal game clock, final entry uses W. No real saves/bosses/receipts changed.',errors:[]};p.on('pageerror',e=>r.errors.push(e.message));
async function ready(area){await p.waitForFunction(area=>{const s=window.__danteGame?.scene.keys.Game;return s?.missionUi&&!s.transitioning&&s.area===area&&!document.querySelector('.application-shell')?.open;},area);for(let i=0;i<12;i++){const e=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await e.count())await e.click();await p.waitForTimeout(100);}}
try{
 await p.goto(base+'/campaign-playtest.html?permanence=water&v=0.1.181');await ready('base');await p.waitForTimeout(1500);await ready('base');
 await p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;s.missions.act('accept','settle-water');s.transitionArea('springs');});await ready('springs');await p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x:1550,y:1120});});await p.waitForTimeout(250);
 await p.waitForFunction(()=>window.__danteGame.scene.keys.Game.children.getByName('water-pressure')?.alpha>=.65);await p.screenshot({path:out+'/active-pressure-desktop.jpg',type:'jpeg',quality:88});
 r.before=await p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game,j=s.children.getByName('water-pressure');return{hp:s.player.hp,x:s.player.position.x,y:s.player.position.y,texture:j.texture.key,alpha:j.alpha,width:j.displayWidth,height:j.displayHeight};});
 await p.keyboard.down('w');await p.waitForTimeout(410);await p.keyboard.up('w');await p.waitForTimeout(4100);
 r.after=await p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;return{hp:s.player.hp,x:s.player.position.x,y:s.player.position.y,completed:s.missions.status('settle-water')==='completed',bosses:[s.vesperDefeated,s.titanDefeated]};});
 assert.equal(r.before.texture,'water-pressure-r1');assert.ok(r.after.y<1050&&r.after.y>975);assert.ok(r.after.hp<r.before.hp);assert.equal(r.after.completed,false);assert.deepEqual(r.after.bosses,[false,false]);assert.deepEqual(r.errors,[]);r.passed=true;
}catch(e){r.failure=String(e);await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(r,null,2)+'\n');await b.close();}
