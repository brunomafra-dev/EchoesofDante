// Real browser input; controlled DEV chapter/attack setup is explicit, not a physical playtest.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5184/',out=process.argv[3]??'docs/soterrado-boss/qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],report={method:'Chrome headless; keyboard/mouse, Gamepad API mock, CDP touch; controlled chapter, attack and final HP setup; no physical devices',errors};
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});};
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state=p=>p.evaluate(()=>{const g=window.__danteGame,s=g.scene.getScene('Game'),b=s.soterrado;return {
  area:s.area,p:{...s.player.position},hp:s.player.hp,maxHp:s.player.maxHp,dead:s.player.isDead,xp:s.progression.xp,level:s.progression.level,
  points:s.progression.upgradePointsAvailable,ranks:s.progression.abilityUpgradeRanks,echoes:s.progression.echoes.size,won:s.soterradoDefeated,clue:s.soterradoClueSeen,
  boss:b?{state:b.state,attack:b.attackName,phase:b.phase,hp:b.health.current,canHit:b.canBeHit,solid:b.solid,p:{...b.position},rotation:b.body.rotation,
    marks:b.marks.filter(m=>m.graphic.visible).map(m=>({x:m.x,y:m.y})),warning:b.telegraph.visible}:null,
  objects:s.children.list.length,graphics:s.children.list.filter(o=>o.type==='Graphics').length,rt:s.children.list.filter(o=>o.type==='RenderTexture').length,
  textures:g.textures.getTextureKeys().length,enemies:s.enemies.length,tweens:s.tweens.getTweens().length,obstacles:s.arena.obstacles.length,
  listeners:[s.input.listenerCount('pointerdown'),s.input.keyboard.listenerCount('keydown')],charge:s.charge.phase,dashing:s.player.isDashing,
  music:s.sounds.area,musicStopped:s.sounds.musicStopped,method:s.controls.inputMethod,message:s.hud.discoveryMessage.text};});
try {
  const page=await browser.newPage({viewport:{width:1280,height:720}});watch(page);await page.goto(base);await ready(page);
  assert.equal((await state(page)).area,'forest');assert.equal((await state(page)).echoes,0);report.freshForest=true;
  const key=async(k,ms=85)=>{await page.keyboard.down(k);await page.waitForTimeout(ms);await page.keyboard.up(k);await page.waitForTimeout(100);};
  const pos=async(x,y)=>{await page.evaluate(({x,y})=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x,y}),{x,y});await page.waitForTimeout(100);};
  const setup=async(area,xp=700)=>{await page.evaluate(async({area,xp})=>{
    const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');
    for(const flag of JOURNEY_FLAGS)s[flag]=!flag.startsWith('soterrado');
    s.progression.restore({xp,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,
      rewardedHollows:[],rewardedRoutes:[],abilityUpgrades:{chargeWidth:1}});s.area=area;s.scene.restart();
  },{area,xp});await page.waitForTimeout(700);};
  await setup('dunes');await pos(2640,1160);assert.equal((await state(page)).boss,null);await key('e');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='sandpit');await page.waitForTimeout(500);
  let s=await state(page);assert.deepEqual(s.p,{x:430,y:790});assert.equal(s.boss.state,'DORMANT');assert.equal(s.boss.hp,850);assert.equal(s.enemies,1);assert.equal(s.music,'soterrado');
  await page.screenshot({path:`${out}/entry.png`});
  assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>=o.radius+18);}));
  await pos(345,790);await key('e');await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='dunes');await page.waitForTimeout(500);
  assert.deepEqual((await state(page)).p,{x:2390,y:1160});await pos(2640,1160);await key('e');await page.waitForTimeout(700);
  assert.equal((await state(page)).area,'sandpit');await key('d',1600);assert.equal((await state(page)).boss.state,'INTRO');assert.equal((await state(page)).boss.canHit,false);
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='IDLE');report.entryAndAscent=true;
  const attack=async(name,x=1000,y=790)=>{await page.evaluate(({name,x,y})=>{const s=window.__danteGame.scene.getScene('Game'),b=s.soterrado;
    Object.assign(b.position,{x:1080,y:760});Object.assign(s.player.position,{x,y});s.player.invulnerableUntil=0;s.player.health.current=s.player.maxHp;
    b.beginAttack(s.time.now,name,s.player.position,s.arena.obstacles);},{name,x,y});await page.waitForTimeout(50);};
  report.attacks={};
  for(const name of ['sweep','rush','burrow','fissure']) {
    await attack(name,name==='rush'?1250:1000,760);const before=await state(page);
    assert.equal(before.boss.state,'TELEGRAPH');assert.ok(before.boss.warning||before.boss.marks.length);
    if(name==='burrow') {
      const target=before.boss.marks[0];await pos(820,1000);await page.waitForTimeout(400);
      assert.equal((await state(page)).boss.canHit,false);assert.equal((await state(page)).boss.solid,false);
      assert.deepEqual((await state(page)).boss.marks[0],target);
      await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='RECOVER');
      assert.deepEqual((await state(page)).boss.p,target);assert.equal((await state(page)).hp,before.hp);
      report.attacks[name]={lockedTarget:true,avoidable:true,hiddenInvulnerability:true};
    } else {
      if(name==='fissure')assert.equal(before.boss.marks.length,3);
      await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='RECOVER');
      const after=await state(page);assert.ok(after.hp<before.hp,name+' deals damage in its marked area');
      report.attacks[name]={damage:before.hp-after.hp,telegraph:true,recovery:true};
    }
  }
  await attack('burrow',1000,760);const buriedHp=(await state(page)).hp;
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='RECOVER');
  assert.equal(buriedHp-(await state(page)).hp,26);report.attacks.burrow.damageWhenRemainingOnMark=26;
  // Real Dash avoids the locked rush lane; it changes no encounter damage rules.
  await attack('rush',1250,760);await page.keyboard.down('s');await page.keyboard.down('Space');await page.waitForTimeout(90);
  assert.ok((await state(page)).dashing);await page.keyboard.up('Space');await page.keyboard.up('s');await page.waitForTimeout(1900);
  assert.equal((await state(page)).hp,(await state(page)).maxHp);report.dashAvoidsRush=true;
  // Real saber and a held/released kinetic charge, against an exposed recovery window.
  const recovery=async()=>{await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.soterrado;
    b.clearWarnings();b.attackName=null;b.setState('RECOVER',s.time.now,3500);Object.assign(b.position,{x:1080,y:760});Object.assign(s.player.position,{x:980,y:760});});await page.waitForTimeout(150);};
  const aim=async()=>{const p=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),c=s.cameras.main;return{x:s.soterrado.position.x-c.scrollX,y:s.soterrado.position.y-c.scrollY};});await page.mouse.move(p.x,p.y);};
  await recovery();await aim();let hp=(await state(page)).boss.hp;await page.mouse.down();await page.waitForTimeout(180);await page.mouse.up();
  assert.ok((await state(page)).boss.hp<hp);report.realSaberDamage=hp-(await state(page)).boss.hp;
  await page.waitForTimeout(650);await recovery();await aim();hp=(await state(page)).boss.hp;await page.keyboard.down('q');await page.waitForTimeout(700);
  assert.equal((await state(page)).charge,'CHARGING');const held=(await state(page)).p;await key('w',160);assert.deepEqual((await state(page)).p,held);
  await page.keyboard.up('q');await page.waitForTimeout(250);assert.ok((await state(page)).boss.hp<hp);report.realChargeDamage=hp-(await state(page)).boss.hp;
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.soterrado.health.current=400;s.soterrado.setState('IDLE',s.time.now,900);});
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state==='PHASE');assert.equal((await state(page)).boss.phase,2);
  await page.screenshot({path:`${out}/phase-2.png`});await page.waitForTimeout(1700);
  const retries=[];
  for(const pattern of ['burrow','rush','fissure']) {
    await attack(pattern);await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike(s.soterrado,{damage:24,ranged:true});});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);assert.equal((await state(page)).boss.marks.length,0);assert.equal((await state(page)).boss.warning,false);
    await page.waitForTimeout(650);await key('r');await page.waitForTimeout(700);s=await state(page);
    assert.deepEqual(s.p,{x:430,y:790});assert.equal(s.hp,s.maxHp);assert.equal(s.boss.hp,850);assert.equal(s.boss.phase,1);assert.equal(s.boss.state,'DORMANT');assert.equal(s.enemies,1);assert.equal(s.xp,700);assert.equal(s.echoes,3);
    retries.push(Object.fromEntries(['objects','graphics','rt','textures','enemies','obstacles','listeners'].map(k=>[k,s[k]])));
  }
  assert.deepEqual(retries[1],retries[0]);assert.deepEqual(retries[2],retries[0]);report.threeDeathsAndStableRespawn=retries;
  // Level crossing + boss point, with actual final saber input after explicit low-HP setup.
  await setup('sandpit',900);await pos(730,790);await page.waitForTimeout(2300);await recovery();
  await page.evaluate(()=>{const b=window.__danteGame.scene.getScene('Game').soterrado;b.phase=2;b.health.current=1;});await aim();await page.mouse.down();await page.waitForTimeout(180);await page.mouse.up();
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterradoDefeated);
  assert.equal((await state(page)).xp,1080);assert.equal((await state(page)).points,2);
  assert.equal(await page.locator('.ability-upgrade-dialog').evaluate(e=>e.open),false,'collapse precedes upgrade choice');
  await page.waitForFunction(()=>document.querySelector('.ability-upgrade-dialog')?.open);
  await page.locator('[data-upgrade="saberReach"]').click();await page.waitForTimeout(180);
  // One milestone and one boss point: spend the remaining point through the same existing dialog.
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').showAvailableUpgrade());await page.locator('[data-upgrade="dashCooldown"]').click();await page.waitForTimeout(300);
  const won=await state(page);assert.equal(won.enemies,0);assert.equal(won.points,0);assert.equal(won.musicStopped,true);
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').soterrado.die());assert.equal((await state(page)).xp,1080);
  await pos(1430,790);await key('e');assert.equal((await state(page)).clue,true);await page.screenshot({path:`${out}/revealed-clue.png`});
  await page.reload();await ready(page);await page.waitForTimeout(500);s=await state(page);
  assert.equal(s.area,'sandpit');assert.equal(s.won,true);assert.equal(s.clue,true);assert.equal(s.boss,null);assert.equal(s.xp,1080);assert.equal(s.ranks.saberReach,1);assert.equal(s.ranks.dashCooldown,1);assert.equal(s.points,0);assert.equal(s.musicStopped,true);
  report.uniqueReward={xp:180,bossPoint:1,milestonePoint:1,ranksPreserved:true,cluePersisted:true,noBossRespawnAfterVictory:true};
  await pos(345,790);await key('e');await page.waitForTimeout(700);assert.equal((await state(page)).area,'dunes');await pos(2640,1160);await key('e');await page.waitForTimeout(700);assert.equal((await state(page)).boss,null);report.returnAfterVictory=true;
  await setup('sandpit');
  await page.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[1,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});await page.waitForTimeout(400);await page.evaluate(()=>window.qaPad.axes[0]=0);
  assert.ok((await state(page)).p.x>480);assert.equal((await state(page)).method,'gamepad');
  await page.evaluate(()=>window.qaPad.buttons[7].value=1);await page.waitForTimeout(80);
  assert.notEqual(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.attack.pose(s.time.now,0).phase;}),'READY');
  await page.evaluate(()=>window.qaPad.buttons[7].value=0);
  await page.evaluate(()=>window.qaPad.buttons[5].value=1);await page.waitForTimeout(70);assert.ok((await state(page)).dashing);await page.evaluate(()=>window.qaPad.buttons[5].value=0);await page.waitForTimeout(350);
  await page.evaluate(()=>window.qaPad.buttons[6].value=1);await page.waitForTimeout(500);assert.equal((await state(page)).charge,'CHARGING');await page.evaluate(()=>window.qaPad.buttons[6].value=0);await page.waitForTimeout(150);assert.notEqual((await state(page)).charge,'CHARGING');
  await page.evaluate(()=>navigator.getGamepads=()=>[]);report.gamepadMock=true;
  await pos(820,990);await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity);await page.waitForTimeout(2300);
  report.resolutions=[];
  for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(350);const b=await page.locator('canvas').boundingBox();assert.ok(b.width<=width+1&&b.height<=height+1);await page.screenshot({path:`${out}/boss-${width}x${height}.png`});report.resolutions.push(`${width}x${height}`);}
  report.performance=await page.evaluate(async()=>{const g=window.__danteGame,s=g.scene.getScene('Game'),samples=[],start=s.children.list.length;
    for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,200));samples.push(g.loop.actualFps);}
    return{meanFps:samples.reduce((a,b)=>a+b)/samples.length,minFps:Math.min(...samples),startObjects:start,endObjects:s.children.list.length,
      graphics:s.children.list.filter(o=>o.type==='Graphics').length,renderTextures:s.children.list.filter(o=>o.type==='RenderTexture').length,tweens:s.tweens.getTweens().length};});
  assert.ok(Math.abs(report.performance.endObjects-report.performance.startObjects)<5);
  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),m=await mobile.newPage();watch(m);await m.goto(base);await ready(m);
  await m.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');for(const flag of JOURNEY_FLAGS)s[flag]=!flag.startsWith('soterrado');
    s.progression.restore({xp:700,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[],abilityUpgrades:{chargeWidth:1}});s.area='dunes';s.scene.restart();});await m.waitForTimeout(600);
  await m.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:2640,y:1160}));await m.waitForTimeout(160);
  await m.locator('[data-action="interact"]').tap();await m.waitForTimeout(700);assert.equal((await state(m)).area,'sandpit');
  const cdp=await mobile.newCDPSession(m);
  const gesture=async(selector,dx=0,dy=0,hold=200,assertHeld)=>{const b=await m.locator(selector).boundingBox();assert.ok(b);const x=b.x+b.width/2,y=b.y+b.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});if(dx||dy)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});await m.waitForTimeout(hold);if(assertHeld)await assertHeld();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await m.waitForTimeout(90);};
  await gesture('.touch-move-zone',60,0,450);assert.ok((await state(m)).p.x>480);
  await gesture('[data-action="attack"]',50,-30);await gesture('[data-action="dash"]');await m.waitForTimeout(450);
  await gesture('[data-action="charge"]',40,-35,700,async()=>assert.equal((await state(m)).charge,'CHARGING'));assert.notEqual((await state(m)).charge,'CHARGING');
  await m.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:820,y:990});s.player.invulnerableUntil=Infinity;});
  await m.waitForFunction(()=>window.__danteGame.scene.getScene('Game').soterrado.state!=='DORMANT'&&window.__danteGame.scene.getScene('Game').soterrado.state!=='INTRO');
  assert.equal(await m.evaluate(()=>window.visualViewport.scale),1);await m.screenshot({path:`${out}/touch.png`});report.touchEmulated={descent:true,movement:true,strikeDragRelease:true,dash:true,chargeHoldDragRelease:true};await mobile.close();
  assert.deepEqual(errors,[]);report.passed=true;
} finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
