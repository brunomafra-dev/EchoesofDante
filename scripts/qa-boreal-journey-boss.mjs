import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/boreal-journey/qa/boss';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(60000);
const report={method:'Actual campaign boss/lifecycle with explicit attack, low-health and damage fixtures; real R/E, save/reload. Not a human boss balance playtest.',errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area==='icenest'&&s.vesper&&s.scene.isActive()&&!s.transitioning&&!s.respawning});
async function clear(){for(let i=0;i<10;i++){const button=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await button.count())break;await button.click();await p.waitForTimeout(100)}}
try{
 await p.goto(base+'/campaign-playtest.html?boreal=1&arrival=icenest',{waitUntil:'domcontentloaded'});await ready();await p.waitForTimeout(700);await clear();
 const original=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.missions.record('exp-icecave-1');s.saveProgress();return{hp:s.vesper.health.max,xp:s.progression.xp}});assert.ok(original.hp>0);
 for(const attack of ['breath','tail','rush','eruption']){
  await p.evaluate(a=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:1100,y:990});s.vesper.beginAttack(s.time.now,a,s.player.position,s.arena.obstacles)},attack);await p.waitForTimeout(120);
  assert.ok(await p.evaluate(()=>{const b=window.__danteGame.scene.getScene('Game').vesper;return b.state==='TELEGRAPH'&&(b.telegraph.visible||b.marks.some(m=>m.image.visible))}));await p.screenshot({path:out+'/'+attack+'.jpg',type:'jpeg',quality:83});await p.waitForTimeout(4300);
 }
 report.checks.push('All four Vesper attacks retain visible warning and normal execution in the real campaign scene.');
 for(let i=0;i<2;i++){
  await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=0;s.player.health.current=1;s.enemyStrike(s.vesper,{damage:24,ranged:true})});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await p.waitForTimeout(600);await p.keyboard.press('r',{delay:160});await p.waitForTimeout(900);await ready();
  const reset=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{hp:s.vesper.health.current,state:s.vesper.state,phase:s.vesper.phase,xp:s.progression.xp,evidence:s.missions.has('exp-icecave-1'),bosses:s.enemies.filter(e=>e===s.vesper).length}});assert.deepEqual(reset,{hp:original.hp,state:'DORMANT',phase:1,xp:original.xp,evidence:true,bosses:1});
 }
 report.checks.push('Two deaths/R respawns reset HP, phase and attacks with exactly one boss; XP and regional evidence preserved.');
 // Cross the real awakening threshold after the last respawn before lethal
 // damage; the save validator correctly rejects victory without reaching it.
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:1000,y:990})});
 await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').vesperReached);await p.waitForTimeout(2400);
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),boss=s.vesper;boss.phase=2;boss.health.current=1;boss.setState('RECOVER',s.time.now,3500);s.player.invulnerableUntil=Infinity;s.resolvePlayerHits(s.time.now,[boss],9999,0,0x5fe6d8,s.player.position,false)});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').vesperDefeated);await p.waitForTimeout(5200);await clear();
 const win=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');const xp=s.progression.xp;s.resolvePlayerHits(s.time.now,[s.vesper],9999,0,0x5fe6d8,s.player.position,false);s.saveProgress();return{xp,after:s.progression.xp,rewards:s.progression.snapshot().bossRewards,clue:s.vesperClueSeen}});assert.equal(win.xp,win.after);assert.equal(win.rewards.filter(id=>id==='vesper').length,1);assert.equal(win.clue,false);
 await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{GLACIER}=await import('/src/config/glacier.ts');Object.assign(s.player.position,{x:GLACIER.icenest.relay.x+80,y:GLACIER.icenest.relay.y+40})});await p.waitForTimeout(400);await p.keyboard.press('e',{delay:180});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').vesperClueSeen);
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();sessionStorage.setItem('echoes-of-dante.launch-once',s.journey.owner)});await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area==='icenest'&&s.player&&s.scene.isActive()&&!s.transitioning});assert.ok(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.vesperDefeated&&s.vesperClueSeen&&s.progression.snapshot().bossRewards.filter(id=>id==='vesper').length===1&&!s.vesper}));
 report.checks.push('Victory XP/receipt awarded once, original record requires E, won state survives reload without recreating a live boss.');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/boss.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
