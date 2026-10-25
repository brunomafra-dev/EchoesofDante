import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/sirocco-journey/qa/boss';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(60000);
const report={method:'Actual campaign boss/lifecycle with explicit attack, low-health and damage fixtures; real R/E, save/reload. Not a human boss balance playtest.',errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area==='sandpit'&&s.soterrado&&s.scene.isActive()&&!s.transitioning&&!s.respawning});
async function clear(){for(let i=0;i<10;i++){const button=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await button.count())break;await button.click();await p.waitForTimeout(100)}}
try{
 await p.goto(base+'/campaign-playtest.html?sirocco=1&arrival=sandpit',{waitUntil:'domcontentloaded'});await ready();await p.waitForTimeout(700);await clear();
 const original=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.missions.record('exp-arid-1');s.saveProgress();return{hp:s.soterrado.health.max,xp:s.progression.xp}});assert.ok(original.hp>0);
 for(const attack of ['sweep','rush','burrow','fissure']){
  await p.evaluate(a=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:1000,y:790});s.soterrado.beginAttack(s.time.now,a,s.player.position,s.arena.obstacles)},attack);await p.waitForTimeout(120);
  assert.ok(await p.evaluate(()=>{const b=window.__danteGame.scene.getScene('Game').soterrado;return b.state==='TELEGRAPH'&&(b.telegraph.visible||b.marks.some(m=>m.graphic.visible))}));await p.screenshot({path:out+'/'+attack+'.jpg',type:'jpeg',quality:83});await p.waitForTimeout(4300);
 }
 report.checks.push('All four Soterrado attacks retain visible warning and normal execution in the real campaign scene.');
 for(let i=0;i<2;i++){
  await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=0;s.player.health.current=1;s.enemyStrike(s.soterrado,{damage:24,ranged:true})});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await p.waitForTimeout(600);await p.keyboard.press('r',{delay:160});await p.waitForTimeout(900);await ready();
  const reset=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{hp:s.soterrado.health.current,state:s.soterrado.state,phase:s.soterrado.phase,xp:s.progression.xp,evidence:s.missions.has('exp-arid-1'),bosses:s.enemies.filter(e=>e===s.soterrado).length}});assert.deepEqual(reset,{hp:original.hp,state:'DORMANT',phase:1,xp:original.xp,evidence:true,bosses:1});
 }
 report.checks.push('Two deaths/R respawns reset HP, phase and attacks with exactly one boss; XP and regional evidence preserved.');
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),boss=s.soterrado;boss.phase=2;boss.health.current=1;boss.setState('RECOVER',s.time.now,3500);s.player.invulnerableUntil=Infinity;s.resolvePlayerHits(s.time.now,[boss],9999,0,0x5fe6d8,s.player.position,false)});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterradoDefeated);await p.waitForTimeout(5200);await clear();
 const win=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');const xp=s.progression.xp;s.resolvePlayerHits(s.time.now,[s.soterrado],9999,0,0x5fe6d8,s.player.position,false);s.saveProgress();return{xp,after:s.progression.xp,rewards:s.progression.snapshot().bossRewards,clue:s.soterradoClueSeen}});assert.equal(win.xp,win.after);assert.equal(win.rewards.filter(id=>id==='soterrado').length,1);assert.equal(win.clue,false);
 await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{SANDPIT}=await import('/src/config/soterrado.ts');Object.assign(s.player.position,SANDPIT.clue)});await p.waitForTimeout(400);await p.keyboard.press('e',{delay:180});await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterradoClueSeen);
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();sessionStorage.setItem('echoes-of-dante.launch-once',s.journey.owner)});await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area==='sandpit'&&s.player&&s.scene.isActive()&&!s.transitioning});assert.ok(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.soterradoDefeated&&s.soterradoClueSeen&&s.progression.snapshot().bossRewards.filter(id=>id==='soterrado').length===1&&!s.soterrado}));
 report.checks.push('Victory XP/receipt awarded once, original record requires E, won state survives reload without recreating a live boss.');assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/boss.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
