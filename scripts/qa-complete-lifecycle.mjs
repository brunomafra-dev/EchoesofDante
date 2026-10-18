import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const p=await browser.newPage({viewport:{width:1280,height:720}});
const base=process.env.QA_BASE??'http://localhost:5184';
const report={passed:false,errors:[],classes:[]};
p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));
const S=fn=>p.evaluate(fn=>new Function('s',`return (${fn})(s)`)(window.__danteGame.scene.getScene('Game')),fn.toString());
const counts=()=>S(s=>({objects:s.children.list.length,textures:s.textures.getTextureKeys().length,actors:s.textures.getTextureKeys().filter(k=>k.startsWith('complete-dressed-')).length,tweens:s.tweens.getTweens().length,listeners:s.events.listenerCount('shutdown'),touch:document.querySelectorAll('.touch-controls').length}));
try{
 for(const cls of ['warrior','hunter','astral','xenobinder']){
  await p.goto(`${base}/character-cohesion.html?class=${cls}&sex=female&kit=basic`);
  await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
  await p.waitForTimeout(1200);const before=await counts(),cycles=[];
  for(let i=0;i<3;i++){
   const old=await S(s=>s.player.view.getData('completeActor').body.texture.key);
   await S(s=>{s.player.health.current=0;s.handleDeath(s.player);});
   assert.ok(await S(s=>s.player.isDead));await p.waitForTimeout(650);await p.keyboard.press('r',{delay:90});
   await p.waitForFunction(old=>{const s=window.__danteGame.scene.getScene('Game');return !s.player.isDead&&s.player.view.getData('completeActor').body.texture.key!==old},old);
   await p.waitForTimeout(1200);const sample=await counts();assert.equal(sample.actors,1);assert.equal(sample.textures,before.textures);assert.equal(sample.listeners,before.listeners);assert.equal(sample.touch,before.touch);cycles.push(sample);
  }
  assert.equal(cycles[0].objects,cycles[2].objects);assert.equal(cycles[0].tweens,cycles[2].tweens);
  report.classes.push({classId:cls,before,cycles});console.log('Three death/R/respawn cycles:',cls);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);throw error;}
finally{await writeFile((process.env.QA_OUT??'docs/complete-actors/qa')+'/lifecycle.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
