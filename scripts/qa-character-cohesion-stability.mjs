import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/character-cohesion/qa/stability';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
const report={method:'One Chrome page; actual PartyActor render compared with local visual transforms; controlled Forest idle samples and three real scene death/restarts per class. No human/device approval.',errors:[],mirrors:[],performance:[],respawns:[]};
const S=(code,arg)=>p.evaluate(({code,arg})=>new Function('s','arg',code)(window.__danteGame.scene.getScene('Game'),arg),{code,arg});
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female']){
  await p.goto(`http://localhost:5184/character-cohesion.html?class=${cls}&sex=${sex}`);await ready();
  const mirrors=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game'),{PartyActor}=await import('/src/network/PartyActor.ts');s.scene.pause();
   const local=s.hunterArt??s.astralArt??s.xenoArt;
   const actor=new PartyActor(s,{id:'visual-audit',name:'Á Gabi',classId:s.classId,sex:s.player.sex,equipment:{}},{...s.player.position},100);
   const remote=actor.art??actor.astralArt??actor.xenoArt,position={...s.player.position};
   const pose={x:position.x,y:position.y,aim:0,hp:100,maxHp:100,dead:false,dash:false,phase:'READY',level:0,firing:false,strike:{phase:'READY',relativeAngle:-.42,worldAngle:0,swingProgress:0},releaseProgress:0,astral:s.astral?.snapshot(),xenobinder:s.xeno?.snapshot()};
   actor.render(pose,0,0);actor.player.view.setVisible(false);
   const limbs=(player,art)=>s.classId==='warrior'?[player.paintedArms.mainUpper,player.saberArm,player.supportUpperArm,player.supportArm,player.paintedArms.mainGlove,player.supportGlove]:s.classId==='hunter'?[...art.weapon.sleeves,...art.weapon.gloves]:[...art.limbs,art.freeHand,art.gauntlet];
   let cases=0,maxDifference=0;
   for(const tier of ['none','basic','reinforced','mixed']){
    const look=tier==='mixed'?{helmet:'reinforced',torso:'basic',gloves:'none',legs:'reinforced',boots:'basic'}:{helmet:tier,torso:tier,gloves:tier,legs:tier,boots:tier};s.setPlaytestAppearance(look);actor.player.setEquipmentLook(look);remote?.setEquipmentLook(look);
    for(let n=0;n<8;n++)for(const mode of ['idle','strike','hold','release']){
     const aim=n*Math.PI/4,heavy={phase:mode==='hold'?'CHARGING':mode==='release'?'RELEASE':'READY',level:.7,swingProgress:.6};
     const strike={phase:mode==='strike'?'SWING':'READY',relativeAngle:mode==='strike'?.4:-.42,worldAngle:aim+.4,swingProgress:.6};
     s.player.renderRemote(position,aim,strike,heavy,false,false);local?.update(position.x,position.y,aim,mode==='strike',false,heavy,'energy');
     actor.render({...pose,aim,phase:heavy.phase,level:heavy.level,releaseProgress:heavy.swingProgress,strike,firing:mode==='strike'},0,0);
     const a=limbs(s.player,local),b=limbs(actor.player,remote);
     for(let i=0;i<a.length;i++)for(const key of ['x','y','rotation','scaleX','scaleY'])maxDifference=Math.max(maxDifference,Math.abs(a[i][key]-b[i][key]));
     cases++;
    }
   }
   actor.destroy();s.scene.resume();return{classId:s.classId,cases,maxDifference};
  });
  report.mirrors.push({sex,...mirrors});assert.ok(mirrors.maxDifference<1e-5,JSON.stringify(mirrors));
  if(sex==='female')continue;
  await S('s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=Infinity');await p.waitForTimeout(4000);
  const sample=await p.evaluate(async()=>{
   const s=window.__danteGame.scene.getScene('Game'),counts=()=>({objects:s.children.list.length,tweens:s.tweens.getTweens().length,textures:s.textures.getTextureKeys().length,inputListeners:s.input.eventNames().reduce((n,k)=>n+s.input.listenerCount(k),0),touchRoots:document.querySelectorAll('.touch-controls').length});
   let frames=0;const count=()=>frames++;s.events.on('update',count);const start=performance.now(),before=counts();await new Promise(r=>setTimeout(r,4000));s.events.off('update',count);return{measuredFps:frames/((performance.now()-start)/1000),loopFps:s.game.loop.actualFps,before,after:counts()};
  });assert.deepEqual(sample.before,sample.after);report.performance.push({classId:cls,...sample});console.log('FPS',cls,sample.measuredFps);
  const cycles=[];
  for(let i=0;i<3;i++){
   await S('window.qaOldPlayer=s.player;s.player.health.current=0;s.handleDeath(s.player)');await p.waitForTimeout(650);await S('s.restart()');
   await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.player!==window.qaOldPlayer&&s.player?.view.active&&!s.player.isDead&&s.scene.isActive()});await p.waitForTimeout(450);
   cycles.push(await S('s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=Infinity;return{objects:s.children.list.length,textures:s.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,inputListeners:s.input.eventNames().reduce((n,k)=>n+s.input.listenerCount(k),0),touchRoots:document.querySelectorAll(".touch-controls").length}'));
  }
  assert.deepEqual(cycles[0],cycles[2]);report.respawns.push({classId:cls,cycles});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
