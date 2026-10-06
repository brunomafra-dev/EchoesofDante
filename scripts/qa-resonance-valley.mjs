// Real Chrome inputs + explicitly controlled DEV states. No hardware claims.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/resonance-valley/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless; DEV encounter setup, real keyboard/mouse/CDP touch and Gamepad API mock; no physical device', errors };
const watch = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
const ready = page => page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
const snapshot = page => page.evaluate(() => {
  const g = window.__danteGame, s = g.scene.getScene('Game');
  return { area:s.area, p:{...s.player.position}, hp:s.player.hp, maxHp:s.player.maxHp, xp:s.progression.xp, level:s.progression.level,
    echoes:s.progression.echoes.size, won:s.wardenDefeated, portal:s.signalPortal?.active, landmark:s.valleyLandmarkSeen,
    end:s.valleyEndSeen, checkpoint:s.valleyCheckpointReached, enemies:s.enemies.length,
    objects:s.children.list.length, rt:s.children.list.filter(o=>o.type==='RenderTexture').length,
    tweens:s.tweens.getTweens().length, textures:g.textures.getTextureKeys().length,
    roots:document.querySelectorAll('.touch-controls').length, listeners:[s.input.listenerCount('pointerdown'),s.input.keyboard.listenerCount('keydown')],
    message:s.hud.discoveryMessage.text, dead:s.player.isDead, method:s.controls.inputMethod };
});
try {
  const page = await browser.newPage({ viewport:{width:1280,height:720} }); watch(page);
  await page.goto(base); await ready(page);
  async function key(k, ms=90) { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); await page.waitForTimeout(90); }
  async function position(x,y) { await page.evaluate(p=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,p),{x,y}); await page.waitForTimeout(90); }
  async function walk(x,y) {
    for(let n=0;n<110;n++) {
      const p=(await snapshot(page)).p, dx=x-p.x,dy=y-p.y;if(Math.hypot(dx,dy)<16)return;
      const keys=[];if(Math.abs(dx)>8)keys.push(dx>0?'d':'a');if(Math.abs(dy)>8)keys.push(dy>0?'s':'w');
      for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(Math.min(90,Math.max(25,Math.hypot(dx,dy)/245*1000)));for(const k of keys)await page.keyboard.up(k);
    }
    throw new Error(`Blocked route to ${x},${y}: ${JSON.stringify((await snapshot(page)).p)}`);
  }
  // Previous journey QA covers Forest/Echoes/First Echo. Here, kill through the real damage path.
  await page.evaluate(()=>{
    const s=window.__danteGame.scene.getScene('Game');for(const id of ['northern-ruin','mineral-signal','unknown-trace'])s.progression.discover(id);
    s.progression.locateSource();s.progression.openPassage();s.deepPassageOpen=true;s.firstEchoSeen=true;s.wardenGateOpen=true;s.area='warden';s.scene.restart();
  });await page.waitForTimeout(800);
  assert.equal((await snapshot(page)).portal,false);
  await position(1500,830);await key('e');assert.equal((await snapshot(page)).area,'warden');
  await page.evaluate(()=>{
    const s=window.__danteGame.scene.getScene('Game');s.warden.introduced=true;s.warden._phase=3;s.warden.setState('RECOVER',s.time.now,10000);
    s.warden.health.current=1;Object.assign(s.player.position,{x:1075,y:735});
  });await page.waitForTimeout(100);await page.mouse.move(900,355);await page.mouse.down();await page.waitForTimeout(350);await page.mouse.up();
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').wardenDefeated);
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').signalPortal?.active);
  report.portalUnlockAfterVictory=true;
  await position(1450,830);await page.waitForTimeout(400);
  await page.screenshot({path:`${out}/portal.png`});
  const before=await snapshot(page);await key('e');await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='valley');await page.waitForTimeout(750);
  const arrived=await snapshot(page);for(const k of ['hp','xp','level','echoes','won'])assert.equal(arrived[k],before[k]);assert.equal(arrived.enemies,12);assert.deepEqual(arrived.p,{x:530,y:850});
  assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>o.radius+18);}));
  report.entry=arrived;
  // Real navigation with live enemies; invulnerability isolates route quality from difficulty.
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity);
  for(const p of [[650,850],[900,820],[1050,740],[1210,650],[1270,590],[1320,610],[1320,860],[1530,860],[1680,820],[1850,730],[1990,740],[2190,745]])await walk(...p);
  assert.equal((await snapshot(page)).enemies,12);
  const poiBefore=await snapshot(page);await key('e');assert.ok((await snapshot(page)).landmark);assert.equal((await snapshot(page)).xp,poiBefore.xp);await key('e');assert.equal((await snapshot(page)).xp,poiBefore.xp);
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=0);
  await page.screenshot({path:`${out}/landmark.png`});
  for(const p of [[2330,780],[2440,860]])await walk(...p);assert.ok((await snapshot(page)).end);report.explorationWithoutKills=true;
  // Isolate each original creature; actual attack timing, moving away and combat inputs.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>{e.qaUpdate=e.update;e.update=()=>{};});});
  async function isolate(kind) {
    await page.evaluate(kind=>{
      const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});const e=s.enemies.find(e=>e.kind===kind);
      Object.assign(e.position,{x:1700,y:820});e.home={x:1700,y:820};e.state='IDLE';e.attackAt=-Infinity;e.hurtUntil=0;e.recoverUntil=0;e.clearShots();e.update=e.qaUpdate;
      s.player.health.current=s.player.maxHp;s.player.invulnerableUntil=0;Object.assign(s.player.position,{x:kind==='carapace'?1780:1910,y:820});
    },kind);await page.waitForTimeout(120);
  }
  await isolate('carapace');const tankHp=(await snapshot(page)).hp;await page.waitForTimeout(1100);assert.equal((await snapshot(page)).hp,tankHp-18);
  await isolate('carapace');await walk(1860,820);await page.waitForTimeout(1000);assert.equal((await snapshot(page)).hp,(await snapshot(page)).maxHp);report.meleeTelegraphDodge=true;
  await isolate('thorn');const rangedHp=(await snapshot(page)).hp;await page.waitForTimeout(1950);assert.equal((await snapshot(page)).hp,rangedHp-11);report.rangedVolley=true;
  // Projectiles must stop on a solid obstacle instead of damaging through it.
  await isolate('thorn');await page.evaluate(()=>{
    const s=window.__danteGame.scene.getScene('Game'),e=s.enemies.find(e=>e.kind==='thorn');e.state='RECOVER';e.recoverUntil=Infinity;
    Object.assign(e.shots[1],{active:true,x:1400,y:730,angle:0,distance:0});Object.assign(s.player.position,{x:1520,y:730});
  });await page.waitForTimeout(800);assert.equal((await snapshot(page)).hp,(await snapshot(page)).maxHp);report.projectileObstacle=true;
  // Visible displacement cycles authored feet-planted frames; no spinning sprites.
  await isolate('carapace');await position(1920,850);
  await page.evaluate(()=>{const e=window.__danteGame.scene.getScene('Game').enemies.find(e=>e.kind==='carapace');e.state='CHASE';e.attackAt=Infinity;});
  const frames=[];for(let i=0;i<15;i++){await page.waitForTimeout(80);frames.push(await page.evaluate(()=>{const e=window.__danteGame.scene.getScene('Game').enemies.find(e=>e.kind==='carapace');return {frame:e.body.frame.name,rotation:e.view.rotation,y:e.body.y,origin:e.body.originY};}));}
  assert.ok(new Set(frames.map(f=>f.frame)).size>=3);assert.ok(frames.every(f=>f.rotation===0&&f.y===13&&f.origin===244/256));report.walkFrames=frames;
  // Use Saber followed by hold/release Charge. Damage and XP come from existing systems.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});const e=s.enemies.find(e=>e.kind==='carapace');Object.assign(e.position,{x:2000,y:840});Object.assign(s.player.position,{x:1910,y:840});e.health.current=34;s.player.invulnerableUntil=Infinity;});
  await page.waitForTimeout(250);const xp=(await snapshot(page)).xp;
  const aim = async()=>{const v=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),p=s.player.position,c=s.cameras.main;return{x:(p.x+95-c.scrollX),y:(p.y-c.scrollY)};});await page.mouse.move(v.x,v.y);};
  await aim();await page.mouse.down();await page.waitForTimeout(400);await page.mouse.up();assert.equal((await snapshot(page)).xp,xp+15);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies.find(e=>e.kind==='thorn');Object.assign(e.position,{x:2030,y:840});e.health.current=50;});await page.waitForTimeout(400);
  await aim();await key('q',850);await page.waitForTimeout(350);assert.equal((await snapshot(page)).xp,xp+30);report.saberChargeXp=true;
  await position(1860,730);await key('d',120);await key(' ',70);assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.dashProgress<1));report.dash=true;
  await page.waitForTimeout(450);
  // Three deaths/restarts: progress remains, actor and listener counts remain bounded.
  const deaths=[], expectedRespawnEnemies=(await snapshot(page)).enemies;for(let i=0;i<3;i++){
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike(s.enemies[0],{damage:11,ranged:true});});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await page.waitForTimeout(620);await key('r');await page.waitForTimeout(1100);
    const s=await snapshot(page);assert.equal(s.area,'valley');assert.deepEqual(s.p,{x:1860,y:570});assert.equal(s.hp,s.maxHp);assert.ok(s.landmark&&s.end&&s.portal&&s.won);assert.equal(s.xp,xp+30);assert.equal(s.enemies,expectedRespawnEnemies);
    assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>o.radius+18);}));deaths.push(s);
    assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.enemies.every(e=>Math.hypot(e.position.x-s.player.position.x,e.position.y-s.player.position.y)>({carapace:340,thorn:370}[e.kind]));}));
  }
  for(const d of deaths.slice(1))for(const k of ['objects','rt','textures','roots','listeners','enemies','tweens'])assert.deepEqual(d[k],deaths[0][k]);report.deaths=deaths;
  // Defeated habitats stay empty through respawn; a different living resident awards XP.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies.find(e=>e.kind==='carapace');e.health.current=1;s.resolveSaberHits(s.time.now,[e],0);});assert.equal((await snapshot(page)).xp,xp+45);const afterRewardCount=(await snapshot(page)).enemies;report.rewardPerResident=true;
  await position(420,850);const returnBefore=await snapshot(page);await key('e');await page.waitForTimeout(900);assert.equal((await snapshot(page)).area,'warden');assert.equal((await snapshot(page)).hp,returnBefore.hp);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').warden),undefined);
  await key('e');await page.waitForTimeout(950);assert.equal((await snapshot(page)).area,'valley');assert.ok((await snapshot(page)).landmark);report.returnPortal=true;
  // Standard API mock exercises the same valley controls without changing input code.
  await page.evaluate(()=>{window.qaPad={connected:true,mapping:'standard',axes:[1,0,1,0],buttons:Array.from({length:16},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});
  const gp=(await snapshot(page)).p;await page.waitForTimeout(350);assert.ok((await snapshot(page)).p.x>gp.x+35);assert.equal((await snapshot(page)).method,'gamepad');
  await page.evaluate(()=>{window.qaPad.axes=[0,0,1,0];window.qaPad.buttons[6].value=1;});await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await page.evaluate(()=>{window.qaPad.buttons[6].value=0;});await page.waitForTimeout(500);await page.evaluate(()=>navigator.getGamepads=()=>[]);report.gamepadMock=true;
  // Four layouts and a warmed live simulation (bounded projectile pools).
  report.resolutions=[];for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]){
    await page.setViewportSize({width,height});await position(2100,775);await page.waitForTimeout(500);const b=await page.locator('canvas').boundingBox();assert.ok(b.width<=width+1&&b.height<=height+1);report.resolutions.push(`${width}x${height}`);
    if(width===1280)await page.screenshot({path:`${out}/valley.png`});
  }
  await page.setViewportSize({width:1280,height:720});await position(1850,760);await page.waitForTimeout(5000);
  report.performance=await page.evaluate(async()=>{const g=window.__danteGame,s=g.scene.getScene('Game'),values=[];for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,200));values.push(g.loop.actualFps);}return{mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values),objects:s.children.list.length,tweens:s.tweens.getTweens().length,rt:s.children.list.filter(o=>o.type==='RenderTexture').length};});
  const stable=await snapshot(page);await page.waitForTimeout(5500);const later=await snapshot(page);
  assert.ok(later.objects<=stable.objects+6);assert.equal(later.rt,stable.rt);assert.ok(later.textures<=stable.textures+1);
  assert.equal(later.roots,stable.roots);assert.deepEqual(later.listeners,stable.listeners);assert.ok(later.tweens<=stable.tweens+4);report.idleStable={before:stable,after:later};
  // Reload resumes the journey; defeated habitat cooldowns are also retained.
  await page.reload();await ready(page);const reloaded=await snapshot(page);assert.equal(reloaded.area,'valley');assert.equal(reloaded.echoes,3);assert.equal(reloaded.won,true);assert.equal(reloaded.xp,xp+45);assert.ok(reloaded.enemies<=afterRewardCount);report.reloadRetainsJourney={before:afterRewardCount,after:reloaded.enemies};
  assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} catch(e){await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2));throw e;}finally{await browser.close();}
