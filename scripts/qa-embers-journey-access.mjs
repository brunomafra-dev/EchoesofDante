import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/embers-journey/qa/access';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(60000);
const report={method:'Isolated Volcanic lab; deliberately polluted visited list, real atlas and backend travel checks. No victory simulated.',errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const area of ['cinder','obsidian','caldera']){
  await p.goto(base+'/campaign-playtest.html?embers=1&arrival='+area,{waitUntil:'domcontentloaded'});await p.waitForFunction(a=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area===a&&s.regional&&s.scene.isActive()&&!s.transitioning},area);await p.waitForTimeout(500);
  for(let i=0;i<20;i++){await p.waitForTimeout(200);const button=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await button.count())await button.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}

  const blocked=area==='cinder'?['obsidian','caldera']:area==='obsidian'?['caldera']:[];
  const checks=await p.evaluate(async({area,blocked})=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;
   s.economy.visited.push(...blocked);const locked=blocked.every(a=>!s.unlockedRegion(a));
   if(area==='caldera'){return{locked,bossAlive:!s.titan.isDead,sealed:!s.calderaRelaySeen&&s.caldera.obstacles.some(o=>o.x===2090&&o.radius===110)}}
   const relay=area==='cinder'?{x:1910,y:700}:{x:2020,y:630};s.navigation.refreshGeometry();const route=s.navigation.findRoute(s.navigation.nearest(s.player.position),s.navigation.nearest(relay));return{locked,signalPath:route.length};
  },{area,blocked});assert.ok(checks.locked);if(area==='caldera'){assert.ok(checks.bossAlive);assert.ok(checks.sealed);await p.waitForTimeout(300);await p.screenshot({path:out+'/sealed-throat.jpg',type:'jpeg',quality:88});}else assert.ok(checks.signalPath>0);
  await p.evaluate(()=>window.__danteGame.scene.getScene('Game').transitionArea('base'));await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.area==='base'&&s.scene.isActive()&&!s.transitioning&&s.basePanel});await p.waitForTimeout(600);
  await p.keyboard.press('m',{delay:160});await p.locator('.base-dialog[open]').waitFor();for(const target of blocked)assert.equal(await p.locator('[data-destination='+target+']').isDisabled(),true);
  assert.ok(await p.evaluate(targets=>{const s=window.__danteGame.scene.getScene('Game');return targets.every(a=>s.baseTravel(a)===false)},blocked));report.checks.push(area==='caldera'?'Caldera: living Incandescente behind original sealed throat; no relay simulated.':area+': original signal route connected; future regions stay disabled in atlas and rejected by travel despite visited-list pollution.');
 }
 await p.goto(base+'/campaign-playtest.html?embers=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.player&&s.scene.isActive()});assert.ok(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.area==='base'&&!s.wardenDefeated&&!s.soterradoDefeated&&!s.vesperDefeated&&!s.titanDefeated&&s.progression.snapshot().bossRewards.length===0}));report.checks.push('Volcanic lab without arrival starts at base with no boss victories.');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.state=await p.evaluate(()=>{const s=window.__danteGame?.scene.getScene('Game');return{area:s?.area,transitioning:s?.transitioning,paused:s?.scene.isPaused(),dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.className)}}).catch(()=>null);await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e}finally{await b.close();await writeFile(out+'/access.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
