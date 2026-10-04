// Chrome real input with DEV state setup; no claim of physical device testing.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5176/';
const out = process.argv[3] ?? 'docs/warden-preparation';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless, real keyboard/mouse, Gamepad API mock, CDP touch emulation; DEV setup', errors };
const watch = p => {
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(page);
  const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view?.active);
  const state = () => page.evaluate(() => {
    const g = window.__danteGame, s = g.scene.getScene('Game');
    return { p: { ...s.player.position }, hp: s.player.hp, maxHp: s.player.maxHp, xp: s.progression.xp, level: s.progression.level,
      echoes: s.progression.echoes.size, passage: s.progression.passageOpen, deep: s.deepPassageOpen,
      first: s.firstEchoSeen, warden: s.wardenReached, response: s.cavern?.wardenApproach.responding,
      area: s.area, gateOpen: s.wardenGateOpen, bossState: s.warden?.state ?? null,
      objects: s.children.list.length, textures: g.textures.getTextureKeys().length,
      rt: s.children.list.filter(o => o.type === 'RenderTexture').length, tweens: s.tweens.getTweens().length,
      timers: s.time._active.length + s.time._pendingInsertion.length, listeners: [s.input.listenerCount('pointerdown'), s.input.keyboard.listenerCount('keydown')],
      footprints: s.arena.obstacles.length, enemies: s.enemies.length, musicFocus: s.sounds.musicFocus,
      message: s.hud.discoveryMessage.text, objective: s.hud.signalObjective.text };
  });
  async function key(k, ms = 80) { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); await page.waitForTimeout(70); }
  async function position(x, y) { await page.evaluate(({x,y}) => { const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position,{x,y}); s.player.invulnerableUntil = Infinity; },{x,y}); await page.waitForTimeout(100); }
  async function walk(x, y) {
    for (let i = 0; i < 100; i++) {
      const { p } = await state(), dx = x-p.x, dy = y-p.y;
      if (Math.hypot(dx,dy) < 14) return;
      const keys=[]; if(Math.abs(dx)>7)keys.push(dx>0?'d':'a'); if(Math.abs(dy)>7)keys.push(dy>0?'s':'w');
      for(const k of keys)await page.keyboard.down(k);
      await page.waitForTimeout(65);
      for(const k of keys)await page.keyboard.up(k);
    }
    throw new Error(`Blocked route ${x},${y}: ${JSON.stringify((await state()).p)}`);
  }
  await page.goto(base); await ready(page); assert.equal((await state()).first,false);
  // Old flow is exercised fully by qa-cavern-exterior; here keep its real interactions.
  for(const [x,y] of [[560,700],[1870,900],[1500,360]]) { await position(x,y); await key('e'); }
  await position(1870,340);await key('e');await position(1670,290);await key('e');await page.waitForTimeout(1800);
  await position(1870,335);await key('w',400);await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='cavern');await page.waitForTimeout(450);
  await position(1620,525);await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').deepPassageOpen);
  // Explicit arrival setup; traverse both sides of the approved arch using actual movement.
  await position(5150,710);await walk(5270,670);await walk(5350,630);await walk(5440,740);await walk(5530,760);
  assert.equal((await state()).first,false);await key('e');assert.equal((await state()).first,false,'First Echo follows the exterior fragment');
  await walk(5440,740);await walk(5350,630);await walk(5270,670);await walk(5150,710);
  await walk(5030,740);await walk(4870,720);await key('e');assert.equal((await state()).xp,120);
  for(const [x,y] of [[5030,740],[5150,710],[5270,670],[5350,630],[5440,740],[5530,760]])await walk(x,y);
  await page.screenshot({path:`${out}/first-echo-before.png`});
  const before=await state();assert.equal(before.musicFocus,0.55);
  // Record actual HUD deliveries; screenshot latency must not skip a short message window.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.qaEchoMessages=[];const show=s.hud.showDiscovery.bind(s.hud);s.hud.showDiscovery=message=>{s.qaEchoMessages.push({message,at:s.time.now});show(message);};});
  await key('e');const response=await state();assert.ok(response.first&&response.response);assert.match(response.message,/ASSINATURA HUMANA/);
  assert.equal(response.xp,before.xp);assert.equal(response.echoes,3);assert.equal(response.musicFocus,0.2);
  await page.screenshot({path:`${out}/first-echo-response.png`});
  const start=response.p;await key('d',220);assert.ok((await state()).p.x>start.x+25,'Movement stays available during response');
  await page.mouse.move(1100,360);await page.mouse.down();await page.waitForTimeout(80);await page.mouse.up();
  assert.notEqual(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').attack.pose(window.__danteGame.scene.getScene('Game').time.now,0).phase),'READY');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').qaEchoMessages.some(m=>m.message.includes('COMPATIBILIDADE')));
  if((await state()).message.includes('COMPATIBILIDADE'))await page.screenshot({path:`${out}/first-echo-confirmation.png`});
  await page.waitForFunction(()=>!window.__danteGame.scene.getScene('Game').cavern.wardenApproach.responding);
  const stages=await page.evaluate(()=>window.__danteGame.scene.getScene('Game').qaEchoMessages);
  assert.match(stages[0].message,/ASSINATURA HUMANA/);assert.match(stages[1].message,/COMPATIBILIDADE/);assert.match(stages[2].message,/INSCRIÇÕES/);
  assert.ok(stages[1].at-stages[0].at>=2950&&stages[2].at-stages[0].at>=5150);report.firstEchoStages=stages;
  assert.equal((await state()).response,false);assert.match((await state()).message,/INSCRIÇÕES/);
  await position(5530,760);await key('e');assert.equal((await state()).response,false);assert.equal((await state()).xp,120);
  report.firstEchoOnceNoRewardControlFree=true;
  for(const [x,y]of[[5645,810],[5820,790],[5950,740],[6000,740]])await walk(x,y);
  assert.ok((await state()).warden);await page.waitForTimeout(1000);await page.screenshot({path:`${out}/threshold.png`});
  assert.match((await state()).objective,/LIMIAR/);
  await key('d',800);assert.ok((await state()).p.x>=6120&&(await state()).p.x<6140,'Sealed gate blocks walking at the visible stone face');
  await page.screenshot({path:`${out}/gate-contact.png`});
  await page.waitForTimeout(1500);await key(' ',200);await page.waitForTimeout(500);assert.ok((await state()).p.x<6140,'Sealed gate blocks dash');
  const targets=(await state()).enemies;await page.keyboard.down('q');await page.waitForTimeout(800);await page.keyboard.up('q');await page.waitForTimeout(900);
  assert.equal((await state()).enemies,targets);assert.equal((await state()).area,'cavern');assert.equal((await state()).gateOpen,false);
  assert.equal((await state()).bossState,null,'The boss belongs to the separate area after the threshold');
  report.thresholdClosedBeforeInteraction=true;
  for(const [x,y]of[[5950,740],[5820,790],[5645,810],[5530,760],[5440,740],[5350,630],[5270,670],[5150,710]])await walk(x,y);
  report.returnThroughArch=true;
  // Use the existing damage/death path; repeat three death->respawn cycles.
  const saved=await state();const stable=[];
  for(let i=0;i<3;i++) {
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});const e=s.enemies.find(e=>!e.kind);s.player.health.current=1;s.player.invulnerableUntil=0;Object.assign(e.position,{x:s.player.position.x+20,y:s.player.position.y});s.enemyStrike(e);});
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.isDead);await page.waitForTimeout(650);await key('r');await page.waitForTimeout(1000);
    const s=await state();assert.deepEqual(s.p,{x:5430,y:740});assert.equal(s.hp,s.maxHp);assert.equal(s.xp,saved.xp);assert.equal(s.level,saved.level);assert.equal(s.echoes,3);assert.ok(s.first&&s.warden&&s.passage&&s.deep);
    assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.arena.obstacles.every(o=>Math.hypot(o.x-s.player.position.x,o.y-s.player.position.y)>=o.radius+18);}));
    stable.push(s);await walk(5530,760);await key('e');assert.equal((await state()).response,false);
  }
  for(const s of stable.slice(1))for(const k of ['objects','textures','rt','tweens','timers','footprints','enemies','listeners'])assert.deepEqual(s[k],stable[0][k],`Stable ${k}`);
  report.threeDeathsSessionStateSafe=stable;
  // Real boundary approach from diagonals, obstacle contact, and normal ability state.
  await walk(5645,810);await walk(5820,790);await walk(6000,820);await key('d',800);await key('w',240);assert.ok((await state()).p.x<=6162);
  await position(5530,760);await key('w',600);assert.ok((await state()).p.y>=747,'Archive base is solid');
  report.collisionNavigation=true;
  await position(5530,760);await page.evaluate(()=>{window.qaPad={mapping:'standard',connected:true,axes:[0,0,1,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};navigator.getGamepads=()=>[window.qaPad];});await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
  await page.evaluate(()=>window.qaPad.axes[0]=1);await page.waitForTimeout(200);await page.evaluate(()=>window.qaPad.axes[0]=0);
  assert.ok((await state()).p.x>5550);await page.waitForTimeout(2800);await page.evaluate(()=>window.qaPad.buttons[6].value=1);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await page.evaluate(()=>window.qaPad.buttons[6].value=0);await page.waitForTimeout(130);assert.notEqual(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await page.evaluate(()=>navigator.getGamepads=()=>[]);report.gamepadMovementChargeMock=true;
  // Fresh response via gamepad A, interrupted by death; no duplicate on restart.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.firstEchoSeen=false;s.wardenReached=false;s.scene.restart();});await page.waitForTimeout(700);
  await position(5530,760);await page.evaluate(()=>{navigator.getGamepads=()=>[window.qaPad];window.qaPad.buttons[0].value=1;});await page.waitForTimeout(180);await page.evaluate(()=>window.qaPad.buttons[0].value=0);
  assert.ok((await state()).response);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;const e=s.enemies.find(e=>!e.kind);Object.assign(e.position,{x:5550,y:760});s.enemyStrike(e);navigator.getGamepads=()=>[];});await page.waitForTimeout(650);await key('r');await page.waitForTimeout(800);
  assert.ok((await state()).first);assert.equal((await state()).response,false);report.deathDuringResponsePreserved=true;
  await position(5990,740);await page.waitForTimeout(4500);
  const settled=await state();await page.waitForTimeout(6500);const idle=await state();for(const k of ['objects','textures','rt','tweens','footprints','enemies'])assert.equal(idle[k],settled[k]);report.stableIdle=idle;
  report.performance=await page.evaluate(async()=>{const g=window.__danteGame,values=[];for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,200));values.push(g.loop.actualFps);}return {mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values)};});
  report.resolutions=[];
  for(const [width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(350);const box=await page.locator('canvas').boundingBox();assert.ok(box.width<=width+1&&box.height<=height+1);report.resolutions.push(`${width}x${height}`);await page.screenshot({path:`${out}/threshold-${width}x${height}.png`});
  }
  const mobile=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const touch=await mobile.newPage();watch(touch);await touch.goto(base);await ready(touch);
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.deepPassageOpen=true;s.exteriorEntered=true;s.fragmentSeen=true;s.scene.restart();});await touch.waitForTimeout(750);
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:5530,y:760});s.player.invulnerableUntil=Infinity;});await touch.waitForTimeout(550);
  const cdp=await mobile.newCDPSession(touch);
  async function gesture(selector,dx=0,dy=0,ms=160){const b=await touch.locator(selector).boundingBox();assert.ok(b);const x=b.x+b.width/2,y=b.y+b.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});if(dx||dy)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});await touch.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(100);}
  await gesture('[data-action="interact"]');assert.ok(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').firstEchoSeen));await touch.screenshot({path:`${out}/touch-first-echo.png`});
  await gesture('.touch-move',45,0,200);assert.ok(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').player.position.x>5550));
  await gesture('[data-action="attack"]',35,-20);await gesture('[data-action="charge"]',45,0,400);await gesture('[data-action="dash"]');await touch.waitForTimeout(4500);
  assert.equal(await touch.evaluate(()=>window.visualViewport.scale),1);assert.equal(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').cavern.wardenApproach.responding),false);report.touchInteractionCombatEmulated=true;
  await touch.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:5990,y:740}));await touch.waitForTimeout(650);await touch.screenshot({path:`${out}/touch-threshold.png`});await mobile.close();
  await page.reload();await ready(page);assert.equal((await state()).first,true);assert.equal((await state()).echoes,3);report.reloadRetainsJourney=true;
  // Deliberate reset, with confirmation, starts the independent gate prerequisite test.
  await page.locator('.records-button').click();await page.locator('[data-reset]').click();await page.locator('[data-confirm]').click();await ready(page);
  assert.equal((await state()).first,false);assert.equal((await state()).echoes,0);report.confirmedNewJourney=true;
  // New session: investigate the First Echo, deliberately open the threshold,
  // then WALK through it into the separate boss area. Earlier tests stay outside.
  await page.setViewportSize({width:1280,height:720});
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.deepPassageOpen=true;s.exteriorEntered=true;s.fragmentSeen=true;s.scene.restart();});await page.waitForTimeout(750);
  await position(6100,740);await key('e');assert.equal((await state()).gateOpen,false,'The threshold cannot respond before the First Echo');
  await position(5530,760);await key('e');await page.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.firstEchoSeen&&!s.cavern.wardenApproach.responding;});
  await position(6100,740);const closed=await state();assert.equal(closed.area,'cavern');assert.equal(closed.bossState,null);
  await key('e');assert.equal((await state()).gateOpen,false,'The opening has a visible response before access');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').wardenGateOpen);
  const opened=await state();assert.equal(opened.footprints,closed.footprints-1,'The seal footprint is removed once');
  await key('e');assert.equal((await state()).footprints,opened.footprints,'Repeated interaction does not duplicate opening');
  await page.screenshot({path:`${out}/threshold-open.png`});
  await page.keyboard.down('d');
  await page.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.area==='warden'&&s.warden?.state==='DORMANT';});
  await page.keyboard.up('d');await page.waitForTimeout(300);
  const entered=await state();assert.equal(entered.area,'warden');assert.equal(entered.bossState,'DORMANT');assert.equal(entered.enemies,1);
  assert.ok(entered.first&&entered.gateOpen);assert.ok(entered.p.x>=650&&entered.p.x<850,'Arrival is safe before the introduction');
  await page.screenshot({path:`${out}/beyond-threshold.png`});
  report.thresholdInteractionOpensSeparateArea={closedFootprints:closed.footprints,openFootprints:opened.footprints,arrival:entered.p,bossState:entered.bossState};
  assert.deepEqual(errors,[]);report.passed=true;
} finally {await writeFile(`${out}/qa-report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
