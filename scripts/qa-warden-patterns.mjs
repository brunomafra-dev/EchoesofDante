// Attack setup is explicit DEV QA; damage, collisions and real player inputs stay live.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://127.0.0.1:5182/',out=process.argv[3]??'docs/warden-boss/pattern-qa';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],report={method:'Chrome headless; explicit DEV attack setup, live damage and keyboard/mouse actions',errors};
try {
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto(base);await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='warden';s.firstEchoSeen=true;s.wardenGateOpen=true;s.scene.restart();});await page.waitForTimeout(800);
  const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden;return {hp:s.player.hp,bossHp:b.health.current,phase:b.phase,state:b.state,attack:b.attackName,canHit:b.canBeHit,objects:s.children.list.length,tweens:s.tweens.getTweens().length,graphics:s.children.list.filter(a=>a.type==='Graphics').length,shots:b.shots.filter(a=>a.active).length,marks:b.marks.filter(a=>a.visual.visible).length,p:{...s.player.position},boss:{...b.position}};});
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.warden.beginIntro(s.time.now);});await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.introComplete);
  const values={sweep:{warning:1000,damage:16},rush:{warning:1150,damage:20},slam:{warning:1250,damage:22},signal:{warning:1050,damage:14},echoes:{warning:1250,damage:24}};
  async function setup(attack){await page.evaluate(attack=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden;b.health.current=900;b._phase=3;b._attackName=null;Object.assign(b.position,{x:1170,y:735});Object.assign(s.player.position,{x:1020,y:735});s.player.health.current=s.player.maxHp;s.player.invulnerableUntil=0;b.beginAttack(s.time.now,attack,s.player.position);},attack);}
  report.attacks=[];
  for(const [attack,v]of Object.entries(values)) {
    await setup(attack);const start=await state();assert.equal(start.state,'TELEGRAPH');await page.waitForTimeout(500);assert.equal((await state()).hp,start.hp,'warning does not damage');
    await page.screenshot({path:`${out}/${attack}-warning.png`});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.state==='RECOVER',null,{timeout:6000});
    const hit=await state();assert.equal(hit.hp,start.hp-v.damage,`${attack} one activation damage`);assert.equal(hit.shots,0);assert.equal(hit.marks,0);
    await setup(attack);await page.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:820,y:1000}));const safe=await state();await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.state==='RECOVER',null,{timeout:6000});assert.equal((await state()).hp,safe.hp,`${attack} dodged outside committed geometry`);
    report.attacks.push({attack,warningMs:v.warning,damage:v.damage,singleHit:true,outsideSafe:true});
  }
  // Existing dash invulnerability consumes the activation, without delayed overlap damage.
  await setup('slam');await page.waitForTimeout(1100);await page.keyboard.down('s');await page.keyboard.down(' ');await page.waitForTimeout(80);await page.keyboard.up(' ');await page.keyboard.up('s');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.state==='RECOVER');assert.equal((await state()).hp,100);report.dashProtected=true;
  // Phase transitions clear pending marks/shots and delay the new full warning.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.warden._phase=1;s.warden.health.current=580;s.warden.setState('IDLE',s.time.now,2000);});await page.waitForTimeout(100);assert.equal((await state()).phase,2);assert.equal((await state()).state,'PHASE');assert.equal((await state()).canHit,false);
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.state==='TELEGRAPH');assert.equal((await state()).attack,'signal');
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').warden.health.current=260);await page.waitForTimeout(100);assert.equal((await state()).phase,3);assert.equal((await state()).state,'PHASE');assert.equal((await state()).shots,0);
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').warden.state==='TELEGRAPH');assert.equal((await state()).attack,'echoes');report.threeDistinctPhases=true;
  // Real Saber attack once, then real Q maximum hold/release once within the existing range.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.warden.health.current=900;s.warden.setState('RECOVER',s.time.now,6000);Object.assign(s.warden.position,{x:1170,y:735});Object.assign(s.player.position,{x:1070,y:735});s.player.health.current=100;});await page.waitForTimeout(200);
  const aim=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),c=s.cameras.main;return {x:s.warden.position.x-c.scrollX,y:s.warden.position.y-c.scrollY};});await page.mouse.move(aim.x,aim.y);await page.mouse.down();await page.waitForTimeout(130);await page.mouse.up();await page.waitForTimeout(300);assert.equal((await state()).bossHp,866);report.saberSingleHit34=true;
  const before=await state();await page.keyboard.down('q');await page.waitForTimeout(850);const held=await state();assert.deepEqual(held.p,before.p,'charge movement remains locked');await page.keyboard.up('q');await page.waitForTimeout(750);assert.equal((await state()).bossHp,790);report.chargeSingleHit76=true;
  // Restart removes the impact objects and returns the fixed pool before measuring.
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await page.waitForTimeout(800);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:1000,y:890});s.warden.beginIntro(s.time.now);});await page.waitForTimeout(4000);
  const baseline=await state();await page.waitForTimeout(20000);const later=await state();assert.equal(later.objects,baseline.objects);assert.equal(later.graphics,baseline.graphics);assert.equal(later.tweens,0);report.poolStable={before:baseline,after:later};
  report.performance=await page.evaluate(async()=>{const g=window.__danteGame,values=[];for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,200));values.push(g.loop.actualFps);}return{mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values)};});
  assert.deepEqual(errors,[]);report.passed=true;
}finally{await writeFile(`${out}/qa-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
