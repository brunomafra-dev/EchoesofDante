// Chrome QA: real walking/AI in the new region; setup/teleports shorten the old chapters.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base=process.argv[2]??'http://localhost:5184/';
const out=process.argv[3]??'docs/sirocco-interior-and-sound/qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],report={method:'Chrome headless; real keyboard walking and active enemy AI; DEV chapter setup; gamepad mock and CDP touch; no physical devices',errors};
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});};
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const state=p=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {area:s.area,p:{...s.player.position},hp:s.player.hp,maxHp:s.player.maxHp,dead:s.player.isDead,xp:s.progression.xp,level:s.progression.level,
  echoes:s.progression.echoes.size,ruins:s.dunesRuinsSeen,depth:s.dunesDepthSeen,routes:[...s.progression.rewardedRoutes],enemies:s.enemies.length,
  charge:s.charge.phase,dashing:s.player.isDashing,music:s.sounds.area,musicPaused:s.sounds.music?.paused,objects:s.children.list.length,
  tweens:s.tweens.getTweens().length,renderTextures:s.children.list.filter(o=>o.type==='RenderTexture').length,
  listeners:[s.input.listenerCount('pointerdown'),s.input.keyboard.listenerCount('keydown')],hud:s.hud.signalObjective.text};});
try {
  const context=await browser.newContext({viewport:{width:1280,height:720}});
  const page=await context.newPage();watch(page);let mp3Requests=0;page.on('request',r=>{if(r.url().endsWith('.mp3'))mp3Requests++;});
  await page.goto(base);await ready(page);await page.waitForTimeout(300);
  assert.equal((await state(page)).area,'forest');assert.equal((await state(page)).echoes,0);
  assert.equal(mp3Requests,0,'music does not download before the first user gesture');
  await page.keyboard.press('d');
  await page.waitForFunction(()=>!window.__danteGame.scene.getScene('Game').sounds.music.paused);
  report.autoplay={silentUntilGesture:true,startedAfterKeyboard:true};
  report.tracks=await page.evaluate(async()=>{
    const {AUDIO}=await import('/src/config/audio.ts'),results=[];
    for(const [region,file] of Object.entries(AUDIO.tracks)){
      const a=new Audio(`assets/audio/${file}`);a.preload='metadata';a.loop=true;
      await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error(`metadata timeout: ${file}`)),15000);
        a.onloadedmetadata=()=>{clearTimeout(t);resolve();};a.onerror=()=>{clearTimeout(t);reject(new Error(`decode failed: ${file}`));};});
      const duration=a.duration;await a.play();
      await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error(`seek timeout: ${file}`)),12000);
        a.onseeked=()=>{clearTimeout(t);resolve();};a.currentTime=duration-.15;});
      for(let i=0;i<40&&a.currentTime>duration/2;i++)await new Promise(r=>setTimeout(r,100));
      results.push({region,duration,looped:a.currentTime<duration/2&&!a.paused});
      a.pause();a.removeAttribute('src');a.load();
    }return results;
  });
  assert.equal(report.tracks.length,10);
  for(const t of report.tracks){assert.ok(t.duration>=119&&t.duration<180,t.region);assert.ok(t.looped,t.region);}
  // Rapid region changes release the superseded voice. Unlock cannot override stop.
  await page.evaluate(()=>{const a=window.__danteGame.scene.getScene('Game').sounds;a.setArea('cavern');a.setArea('deep');a.setArea('sirocco');});
  await page.waitForTimeout(2200);
  assert.ok(await page.evaluate(()=>{const a=window.__danteGame.scene.getScene('Game').sounds;return !a.outgoing&&!a.fadeFrame&&a.currentGain===1&&!a.music.paused;}));
  await page.evaluate(()=>{const a=window.__danteGame.scene.getScene('Game').sounds;a.stopMusic();a.unlock();});
  assert.ok(await page.evaluate(()=>{const a=window.__danteGame.scene.getScene('Game').sounds;return a.music.paused&&a.musicStopped&&!a.outgoing;}));
  report.crossfade={settlesToOneVoice:true,stopPreservedAfterGesture:true};
  const position=async(x,y)=>{await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x,y});s.player.view.setPosition(x,y).setDepth(y);},{x,y});await page.waitForTimeout(130);};
  const key=async(k,ms=85)=>{await page.keyboard.down(k);await page.waitForTimeout(ms);await page.keyboard.up(k);await page.waitForTimeout(100);};
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');
    s.progression.restore({xp:700,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[],abilityUpgrades:{chargeWidth:1}});
    Object.assign(s,{deepPassageOpen:true,firstEchoSeen:true,wardenGateOpen:true,wardenDefeated:true,
      valleyVisited:true,valleyFrontierReached:true,valleyFrontierSignalSeen:true,valleyFrontierEndSeen:true,
      aridVisited:true,aridSignalSeen:true,aridFrontierEntered:true,aridFrontierReached:true,area:'arid'});s.scene.restart();});
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='arid');await page.waitForTimeout(600);
  assert.equal((await state(page)).music,'sirocco');
  await position(4990,805);await key('e');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='dunes');await page.waitForTimeout(600);
  assert.deepEqual((await state(page)).p,{x:520,y:1090});assert.equal((await state(page)).music,'dunes');
  report.forwardPortal={destination:'dunes',entry:(await state(page)).p};
  await page.screenshot({path:`${out}/dunes-entry.png`});
  const walk=async(x,y)=>{for(let i=0;i<320;i++){
    const s=await state(page);assert.equal(s.dead,false,'player survived the exploratory route');
    const dx=x-s.p.x,dy=y-s.p.y;if(Math.hypot(dx,dy)<18)return;
    const keys=[];if(Math.abs(dx)>7)keys.push(dx>0?'d':'a');if(Math.abs(dy)>7)keys.push(dy>0?'s':'w');
    for(const k of keys)await page.keyboard.down(k);await page.waitForTimeout(55);for(const k of keys)await page.keyboard.up(k);
  }throw new Error(`Blocked walk to ${x},${y}: ${JSON.stringify((await state(page)).p)}`);};
  for(const [x,y] of [[620,900],[950,820],[990,690],[1290,470]])await walk(x,y);
  assert.ok((await state(page)).routes.includes('dunes-wind-shelf'));assert.equal((await state(page)).xp,720);
  await page.screenshot({path:`${out}/wind-shelf.png`});
  for(const [x,y] of [[1500,690],[1700,850],[1830,850]])await walk(x,y);
  await key('e');assert.equal((await state(page)).ruins,true);await page.screenshot({path:`${out}/buried-ruins.png`});
  for(const [x,y] of [[2040,1090],[2130,1440],[1790,1520],[1550,1690]])await walk(x,y);
  assert.ok((await state(page)).routes.includes('dunes-buried-vein'));assert.equal((await state(page)).xp,740);
  await page.screenshot({path:`${out}/buried-vein.png`});
  for(const [x,y] of [[1870,1840],[2260,1810],[2450,1540],[2640,1160]])await walk(x,y);
  assert.equal((await state(page)).depth,true);assert.equal((await state(page)).enemies,7);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').warden===undefined),true);
  report.exploration={bothRoutes:true,ruinsInvestigated:true,hollowReached:true,remainingResidents:7,bossImplemented:false,hp:(await state(page)).hp};
  await page.screenshot({path:`${out}/sand-depression.png`});
  // Preserve a screenshot with actual AI. Isolate input/damage checks from enemy timing afterwards.
  await page.evaluate(()=>{window.__danteGame.scene.getScene('Game').enemies.forEach(e=>e.update=()=>{});});
  await page.mouse.move(900,360);await page.mouse.down();await page.waitForTimeout(60);
  assert.notEqual(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.attack.pose(s.time.now,0).phase;}),'READY');await page.mouse.up();await page.waitForTimeout(600);
  await page.keyboard.down('d');await page.keyboard.down('Space');await page.waitForTimeout(80);assert.equal((await state(page)).dashing,true);await page.keyboard.up('Space');await page.keyboard.up('d');await page.waitForTimeout(450);
  await page.keyboard.down('q');await page.waitForTimeout(500);assert.equal((await state(page)).charge,'CHARGING');
  const held=(await state(page)).p;await key('d',200);assert.deepEqual((await state(page)).p,held);
  await page.keyboard.up('q');await page.waitForTimeout(90);assert.equal((await state(page)).charge,'RELEASE');await page.waitForTimeout(700);
  const xp=(await state(page)).xp;
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies[0];e.health.current=1;s.resolveSaberHits(s.time.now,[e],0);});
  assert.equal((await state(page)).xp,xp+15);report.combat={saber:true,dash:true,chargeHoldStationaryRelease:true,enemyXp:15};
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');window.pad={connected:true,mapping:'standard',axes:[1,0,0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[window.pad];});
  const padX=(await state(page)).p.x;await page.waitForTimeout(300);assert.ok((await state(page)).p.x>padX+25);await page.evaluate(()=>{navigator.getGamepads=()=>[];});report.gamepadMock=true;
  const saved=await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1'));
  await page.reload();await ready(page);assert.equal((await state(page)).area,'dunes');assert.equal((await state(page)).ruins,true);assert.equal((await state(page)).depth,true);assert.equal((await state(page)).xp,755);
  assert.deepEqual((await state(page)).p,{x:1940,y:1020});assert.equal((await state(page)).routes.length,2);
  const deathCounts=[];
  for(let i=0;i<3;i++){
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike(s.enemies[0],{damage:100,ranged:true});});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await page.waitForTimeout(650);await key('r');
    await page.waitForFunction(()=>!window.__danteGame.scene.getScene('Game').player.isDead);await page.waitForTimeout(550);
    const s=await state(page);assert.deepEqual(s.p,{x:1940,y:1020});assert.equal(s.hp,s.maxHp);assert.equal(s.xp,755);assert.equal(s.depth,true);deathCounts.push({objects:s.objects,tweens:s.tweens,listeners:s.listeners});
  }
  assert.deepEqual(deathCounts[1],deathCounts[0]);assert.deepEqual(deathCounts[2],deathCounts[0]);report.persistence={reload:true,checkpoint:true,threeRespawns:deathCounts};
  report.layouts=[];
  for(const [width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(180);report.layouts.push(`${width}x${height}`);}
  report.performance=await page.evaluate(async()=>{const g=window.__danteGame,s=g.scene.getScene('Game'),fps=[];for(let i=0;i<15;i++){await new Promise(r=>setTimeout(r,200));fps.push(g.loop.actualFps);}return{meanFps:fps.reduce((a,b)=>a+b)/fps.length,minFps:Math.min(...fps),objects:s.children.list.length,tweens:s.tweens.getTweens().length};});
  await position(320,1090);await key('e');await page.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.area==='arid'&&s.player.position.x===4770;});assert.deepEqual((await state(page)).p,{x:4770,y:805});report.returnPortal=true;
  // Each old region selects its own score through gameplay geography.
  report.regionSelection=[];
  for(const [area,x,y,music]of[['forest',600,700,'forest'],['cavern',600,740,'cavern'],['cavern',2050,800,'deep'],['cavern',3500,740,'deeper'],['cavern',4900,740,'exterior'],['valley',2000,700,'valley'],['warden',650,760,'warden']]){
    await page.evaluate(({area,x,y})=>{const s=window.__danteGame.scene.getScene('Game');s.area=area;s.wardenDefeated=area!=='warden';s.scene.restart();},{area,x,y});await page.waitForTimeout(750);await position(x,y);
    assert.equal((await state(page)).music,music);report.regionSelection.push(music);
  }
  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const m=await mobile.newPage();watch(m);await m.addInitScript(saved=>localStorage.setItem('echoes-of-dante.journey.v1',saved),saved);await m.goto(base);await ready(m);await m.waitForTimeout(400);
  const cdp=await mobile.newCDPSession(m);const send=(type,points=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({...p,radiusX:5,radiusY:5,force:1}))});
  const center=async(selector)=>{const b=await m.locator(selector).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2};};
  const origin=await center('.touch-move-zone'),move={x:origin.x+65,y:origin.y,id:1};
  const before=(await state(m)).p.x;await send('touchStart',[{...origin,id:1}]);await send('touchMove',[move]);await m.waitForTimeout(300);await send('touchEnd');assert.ok((await state(m)).p.x>before+25);
  const strike=await center('[data-action="attack"]');await send('touchStart',[{...strike,id:2}]);await send('touchMove',[{x:strike.x+45,y:strike.y-60,id:2}]);await send('touchEnd');await m.waitForTimeout(650);
  const charge=await center('[data-action="charge"]');await send('touchStart',[{...charge,id:3}]);await m.waitForTimeout(300);assert.equal((await state(m)).charge,'CHARGING');await send('touchMove',[{x:charge.x+40,y:charge.y-65,id:3}]);await m.waitForTimeout(400);await send('touchEnd');await m.waitForTimeout(90);assert.equal((await state(m)).charge,'RELEASE');
  await m.screenshot({path:`${out}/dunes-touch.png`});await m.setViewportSize({width:390,height:844});await m.waitForTimeout(400);assert.ok(await m.locator('.touch-rotate').isVisible());report.touch={movement:true,strikeDrag:true,chargeHoldDragRelease:true,portraitNotice:true};
  assert.deepEqual(errors,[]);await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  await mobile.close();await context.close();
}catch(e){await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2));throw e;}finally{await browser.close();}
