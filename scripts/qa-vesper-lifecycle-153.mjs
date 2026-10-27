import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/vesper-revision-02/qa/lifecycle';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(120000);
const report={method:'DEV position/HP fixtures isolate lethal contacts and real Dash; normal damage resolver, R respawn and cleanup. No victory simulated.',checks:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
const sceneReady=async()=>{await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.vesper);for(let i=0;i<24;i++){await p.waitForTimeout(180);const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}};
try{
 await p.goto((process.env.QA_BASE??'http://localhost:5185')+'/campaign-playtest.html?vesper=1&v=0.1.153');await sceneReady();
 for(const attack of ['tail','breath']){
  await p.evaluate(attack=>{const s=window.__danteGame.scene.getScene('Game'),b=s.vesper;Object.assign(s.player.position,{x:attack==='tail'?1620:1120,y:960});s.player.health.current=1;s.player.invulnerableUntil=0;b.facingAngle=Math.PI;b.beginAttack(s.time.now,attack,{x:1120,y:960});},attack);
  await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await p.waitForTimeout(100);
  const cleaned=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.vesper;return{stopped:b.stopped,warning:b.telegraph.visible,mist:b.ice.filter(i=>i.visible).length,frost:b.frost.patches.filter(i=>i.active).length,exposed:b.coreExposed,won:s.vesperDefeated,xp:s.progression.xp};});
  assert.equal(cleaned.stopped,true);assert.equal(cleaned.warning,false);assert.equal(cleaned.mist,0);assert.equal(cleaned.frost,0);assert.equal(cleaned.exposed,false);assert.equal(cleaned.won,false);report.checks.push({attack,cleaned});
  await p.waitForTimeout(650);await p.keyboard.press('r',{delay:180});await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return !s.player.isDead&&s.vesper?.state==='DORMANT'});await sceneReady();
 }
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.vesper;Object.assign(s.player.position,{x:1180,y:960});s.player.invulnerableUntil=0;b.facingAngle=0;b.frost.deposit(s.time.now,b.position,0,s.arena.obstacles);b.beginAttack(s.time.now,'tail',s.player.position);});
 await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.vesper.state==='EXECUTE'&&s.time.now-s.vesper.at>150});await p.keyboard.down('w');await p.waitForTimeout(30);await p.keyboard.press(' ',{delay:150});await p.waitForTimeout(90);await p.keyboard.up('w');
 await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').vesper.coreExposed);
 const dodged=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.vesper;s.scene.pause();return{hp:s.player.hp,max:s.player.maxHp,connected:b.tailConnected,cracked:b.tailCracked,exposed:b.coreExposed,fired:b.fired};});
 assert.equal(dodged.hp,dodged.max);assert.equal(dodged.connected,false);assert.equal(dodged.cracked,true);assert.equal(dodged.exposed,true);assert.deepEqual(dodged.fired,[true,true]);report.dodged=dodged;
 report.checks.push('A real Dash rejects the first contact without denying the clean combo opening after return');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await p.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await writeFile(out+'/lifecycle.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));}
