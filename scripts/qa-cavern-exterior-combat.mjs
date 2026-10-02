// Supplemental mixed-combat assertion and live combat render stability sample.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5176/';
const out=process.argv[3]??'docs/expansion-sprint-02',errors=[];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless; controlled DEV combat setup + actual LMB/Q; no physical playtest',errors};
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  async function ready(){await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);}
  await page.goto(base);await ready();
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.deepPassageOpen=true;s.deepCavernEntered=true;s.deeperEntered=true;s.scene.restart();});await page.waitForTimeout(600);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:3700,y:900});s.player.invulnerableUntil=Infinity;s.cameras.main.stopFollow().centerOn(3700,900);});await page.waitForTimeout(150);
  await page.evaluate(()=>{
    const s=window.__danteGame.scene.getScene('Game');
    const targets=[14,15,16].map(id=>s.enemies.find(e=>s.hollowSpawnIds.get(e)===id));
    s.enemies.forEach((e,i)=>{e.qaUpdate=e.update;e.update=()=>{};Object.assign(e.position,{x:1200+i*5,y:950});});
    targets.forEach((e,i)=>{Object.assign(e.position,{x:3780,y:875+i*20});e.update=e.qaUpdate;e.state='IDLE';});window.qaMixed=targets;
  });
  const hp=await page.evaluate(()=>window.qaMixed.map(e=>e.health.current));
  await page.mouse.move(720,360);await page.mouse.click(720,360);await page.waitForTimeout(190);
  assert.deepEqual(await page.evaluate(()=>window.qaMixed.map(e=>e.health.current)),hp.map(v=>v-34));
  await page.screenshot({path:`${out}/mixed-combat.png`});
  await page.waitForTimeout(190);await page.keyboard.down('q');await page.waitForTimeout(820);await page.keyboard.up('q');await page.waitForTimeout(700);
  const afterWave=await page.evaluate(()=>window.qaMixed.map(e=>e.health.current));
  assert.ok(afterWave.some((v,i)=>v<hp[i]-34));
  // Active foes may move behind the wave's starting point or retreat beyond it.
  // Finish those survivors with actual melee, rather than assuming a stationary trio.
  for(let index=0;index<3;index++){
    for(let strike=0;strike<3;strike++){
      if(await page.evaluate(i=>window.qaMixed[i].isDead,index))break;
      await page.evaluate(i=>{const s=window.__danteGame.scene.getScene('Game'),e=window.qaMixed[i];Object.assign(s.player.position,{x:e.position.x-70,y:e.position.y});s.cameras.main.centerOn(s.player.position.x,s.player.position.y);},index);
      await page.waitForTimeout(60);await page.mouse.move(720,360);await page.mouse.click(720,360);await page.waitForTimeout(380);
    }
  }
  assert.ok(await page.evaluate(()=>window.qaMixed.every(e=>e.isDead)));
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.xp),45);
  report.mixedStrikeAndWave={types:['spitter','crawler','skitter'],basicDamagePerTarget:34,hpAfterWave:afterWave,allThreeKilledWithMeleeFollowup:true,totalXp:45};
  // Fresh scene: all 19 actors active, actual combat around the deeper habitats.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.exteriorEntered=true;s.scene.restart();});await page.waitForTimeout(650);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:3950,y:900});s.player.invulnerableUntil=Infinity;s.cameras.main.stopFollow().centerOn(3950,850);});
  await page.waitForTimeout(8000);
  report.activeCombat=await page.evaluate(async()=>{
    const g=window.__danteGame,s=g.scene.getScene('Game'),fps=[];
    for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,200));fps.push(g.loop.actualFps);}
    return {meanFps:fps.reduce((a,b)=>a+b,0)/fps.length,minFps:Math.min(...fps),maxFps:Math.max(...fps),enemies:s.enemies.length,attacking:s.enemies.filter(e=>['ATTACK','WINDUP','LUNGE'].includes(e.state)).length,projectiles:s.enemies.filter(e=>e.shot).length,objects:s.children.list.length,tweens:s.tweens.getTweens().length};
  });
  await page.screenshot({path:`${out}/deeper-combat.png`});
  const baseline=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {objects:s.children.list.length,tweens:s.tweens.getTweens().length,textures:window.__danteGame.textures.getTextureKeys().length};});
  await page.waitForTimeout(8000);
  const after=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {objects:s.children.list.length,tweens:s.tweens.getTweens().length,textures:window.__danteGame.textures.getTextureKeys().length};});
  assert.deepEqual(after,baseline);report.liveCombatStable=after;
  assert.equal(errors.length,0);await writeFile(`${out}/combat-checks.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
