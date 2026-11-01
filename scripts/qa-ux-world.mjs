import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5185',out='docs/ux-general/qa/world';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});p.setDefaultTimeout(90000);
const r={base,method:'DEV client, isolated advanced UX lab. Normal E/mission/service/atlas UI; DEV position changes only frame NPCs/objects, not objectives/rewards/bosses. Previous chapter prerequisites are explicit in the laboratory.',errors:[],checks:[],scenes:[]};p.on('pageerror',e=>r.errors.push(e.message));
async function ready(area){await p.waitForFunction(area=>{const s=window.__danteGame?.scene.keys.Game;return s?.missionUi&&!s.transitioning&&s.area===area&&!document.querySelector('.application-shell[open]')},area);for(let i=0;i<12;i++){const x=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await x.count())await x.tap();await p.waitForTimeout(100);}}
async function state(){return p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;return{missions:s.missions.snapshot(),credits:s.economy.credits,rewards:s.missionRewards,vesper:s.vesperDefeated,titan:s.titanDefeated};});}
try{
 await p.addInitScript(()=>{Element.prototype.requestFullscreen=undefined;});await p.goto(base+'/campaign-playtest.html?ux-review=1&permanence=icecave');await ready('base');await p.waitForTimeout(1400);await ready('base');const before=await state();
 await p.setViewportSize({width:568,height:320});await p.keyboard.press('e');await p.locator('.mission-dialog[open]').waitFor();assert.equal(await p.locator('.mission-content').getAttribute('data-mission'),'settle-icecave');
 const action=await p.locator('[data-mission-action=accept]').boundingBox();assert.ok(action.y>=0&&action.y+action.height<=308,JSON.stringify(action));
 await p.screenshot({path:out+'/ivo-offer-short.jpg',type:'jpeg',quality:86});await p.locator('[data-mission-action=accept]').tap();await p.waitForFunction(()=>!document.querySelector('.mission-dialog[open]'));
 const accepted=await state();assert.ok(accepted.missions.accepted.includes('settle-icecave'));assert.equal(accepted.credits,before.credits);assert.deepEqual(accepted.rewards,before.rewards);
 await p.keyboard.press('e');await p.locator('[data-mission-action=services]').tap();await p.waitForTimeout(350);assert.ok(await p.locator('dialog[open]:not(.mission-dialog)').count());await p.keyboard.press('Escape');
 r.checks.push('Ivo offer/action fit 568x320, actual acceptance closes dialogue and preserves credits/receipts; visible service button opens workshop normally');
 await p.setViewportSize({width:844,height:390});await p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x:395,y:755});});await p.waitForTimeout(350);await p.keyboard.press('e');await p.locator('.mission-dialog[open]').waitFor();
 await p.screenshot({path:out+'/lia-offer-mobile.jpg',type:'jpeg',quality:86});await p.keyboard.press('Escape');
 for(const[area,x,y]of [['base',650,750],['base',650,860],['springs',2020,1050],['icecave',1100,1180]]){
  if(await p.evaluate(()=>window.__danteGame.scene.keys.Game.area)!==area){await p.evaluate(area=>window.__danteGame.scene.keys.Game.transitionArea(area),area);await ready(area);}
  await p.evaluate(({x,y})=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x,y});s.player.invulnerableUntil=Infinity;},{x,y});
  for(const[w,h]of [[844,390],[1920,1080]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(400);
   const labels=await p.evaluate(()=>{const s=window.__danteGame.scene.keys.Game,cssScale=s.game.canvas.getBoundingClientRect().width/s.scale.gameSize.width;return s.children.list.filter(o=>o.getData?.('context-label')&&o.visible&&o.alpha>0).map(o=>({text:o.text,bounds:o.getBounds(),screenFont:parseFloat(o.style.fontSize)*o.scaleX*s.cameras.main.zoom*cssScale}));});
   assert.ok(labels.length<=2);for(const l of labels)assert.ok(l.screenFont>=11.5,JSON.stringify(l));if(labels.length===2){const[a,b]=labels.map(l=>l.bounds);assert.ok(a.x+a.width<b.x||b.x+b.width<a.x||a.y+a.height<b.y||b.y+b.height<a.y);}
   r.scenes.push({area,x,y,viewport:[w,h],labels});await p.screenshot({path:`${out}/labels-${area}-${x}-${y}-${w}.jpg`,type:'jpeg',quality:86});
  }
 }
 const end=await state();assert.equal(end.vesper,false);assert.equal(end.titan,false);assert.deepEqual(end.rewards,before.rewards);r.checks.push('Base/post/gallery context labels capped at two without overlap; screen font remains readable at sampled camera zooms; Vesper/Titan alive and no rewards fabricated');assert.deepEqual(r.errors,[]);r.passed=true;
}catch(e){r.failure=String(e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:85}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(r,null,2)+'\n');await b.close();console.log(JSON.stringify({passed:r.passed,failure:r.failure,checks:r.checks}));}
