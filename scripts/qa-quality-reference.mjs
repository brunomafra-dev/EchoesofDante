// Integration/visual evidence. Chrome headless, with explicit DEV positioning;
// touch and gamepad emulation are not physical-device or human approval.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/quality-reference/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless; real browser keyboard/mouse, CDP touch, Gamepad API mock; DEV positions; no hardware playtest', errors, comparisons: [], restarts: [] };
const watch = p => {
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
const pos = async (p, x, y) => { await p.evaluate(v => {
  const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position, v); s.player.invulnerableUntil = Infinity;
}, { x, y }); await p.waitForTimeout(130); };
const key = async (p, code, ms = 100) => { await p.keyboard.down(code); await p.waitForTimeout(ms); await p.keyboard.up(code); };
const geometry = p => p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return {
  bounds: s.arena.bounds, obstacles: s.arena.obstacles.filter(o => o.x >= 480 && o.x <= 1680 && o.y >= 380 && o.y <= 1120).sort((a,b)=>a.x-b.x || a.y-b.y),
}; });
const counts = p => p.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return {
  objects: s.children.list.length, textures: s.textures.getTextureKeys().length,
  tweens: s.tweens.getTweens().length, graphics: s.children.list.filter(o=>o.type==='Graphics').length,
  renderTextures: s.children.list.filter(o=>o.type==='RenderTexture').length,
  pointers: s.input.listenerCount('pointerdown'), keyboard: s.input.keyboard.listenerCount('keydown'),
  touchRoots: document.querySelectorAll('.touch-controls').length, journals: document.querySelectorAll('.records-dialog').length,
}; });
try {
  const context = await browser.newContext();
  const page = await context.newPage(); watch(page); await page.setViewportSize({width:1280,height:720});
  await page.goto(base); await ready(page);
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').saveProgress());
  let saved = await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1'));
  assert.ok(saved);
  let baselineGeometry;
  for (const mode of ['baseline', 'reference']) {
    await page.goto(`${base}quality-reference.html${mode==='baseline'?'?baseline=1':''}`); await ready(page); await page.waitForTimeout(900);
    // The normal page legitimately flushes on pagehide. From here onward the
    // lab must preserve that exact finalized record, including its timestamp.
    if (mode==='baseline') saved = await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1'));
    else assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1')),saved);
    assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').area),'cavern');
    const physical = await geometry(page);
    if (mode==='baseline') baselineGeometry = physical; else assert.deepEqual(physical,baselineGeometry);
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>{e.qaUpdate=e.update;e.update=()=>{};});s.cameras.main.stopFollow().centerOn(1070,750);});
    await pos(page,1080,820); await page.mouse.move(940,420);
    await page.waitForTimeout(10100); // Startup help has the same lifetime.
    for (const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]) {
      await page.setViewportSize({width,height}); await page.waitForTimeout(200);
      await page.screenshot({path:`${out}/${mode}-${width}x${height}.png`});
      assert.ok(await page.locator('.quality-navigation').evaluate(n=>{const b=n.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight;}));
    }
    await page.setViewportSize({width:1280,height:720}); await page.waitForTimeout(600);
    const idle = await counts(page);
    const fps = await page.evaluate(()=>new Promise(resolve=>{let frames=0;const start=performance.now();function frame(){frames++;if(performance.now()-start>=3000)resolve(frames*1000/(performance.now()-start));else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
    assert.deepEqual(await counts(page),idle);
    report.comparisons.push({mode,fps,...idle});
  }
  report.physicalFootprintsUnchanged = true;
  for (const [x,y] of [[500,410],[1650,410],[500,1090],[1650,1090]]) {
    await pos(page,x,y);await page.evaluate(v=>window.__danteGame.scene.getScene('Game').cameras.main.centerOn(v.x,v.y),{x,y});
    await page.waitForTimeout(100);
    assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),f=s.children.getByName('reference-continuous-ground').getBounds(),c=s.cameras.main.worldView;
      return f.left<=c.left&&f.right>=c.right&&f.top<=c.top&&f.bottom>=c.bottom;}));
  }
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').cameras.main.centerOn(1070,750));
  report.noFloorEdgeInCamera = true;
  // Real movement and saber rig. Both hands must remain attached for all aims.
  await pos(page,1000,800);
  for (const code of ['w','a','s','d']) { const before=await page.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position})); await key(page,code,180);
    const after=await page.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position})); assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>15); }
  for (const [x,y] of [[900,400],[640,600],[380,400],[640,180]]) {
    await page.mouse.move(x,y); await page.waitForTimeout(70);
    assert.ok(await page.evaluate(()=>{const p=window.__danteGame.scene.getScene('Game').player,
      a=p.weapon.view.getWorldTransformMatrix().transformPoint(p.weapon.supportGripX,0),b=p.supportGlove.getWorldTransformMatrix().transformPoint(0,0);
      return Math.hypot(a.x-b.x,a.y-b.y)<0.001;}));
  }
  report.movementAndWeaponGrips = true;
  // Exactly the existing solid rock footprint, with movement into its edge.
  await pos(page,795,595); await key(page,'d',500);
  assert.ok(await page.evaluate(()=>{const p=window.__danteGame.scene.getScene('Game').player.position;return Math.hypot(p.x-885,p.y-595)>=74-0.01;}));
  await key(page,'s',300); await key(page,'d',430); report.rockCollisionAndDetour = true;
  await pos(page,1000,820); await page.mouse.move(710,430);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.enemies[0].position,{x:1070,y:820});s.enemies[0].update=s.enemies[0].qaUpdate;});
  await page.mouse.down(); await page.waitForTimeout(85); await page.mouse.up();
  await page.waitForTimeout(65);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies[0].health.current),34);
  assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').referenceImpacts.bursts.some(b=>b.label.visible)));
  await page.screenshot({path:`${out}/saber-hit.png`}); report.saberDamageAndImpact = true;
  // Aim during charge; moving input must not move the logical player.
  await page.waitForTimeout(400); await page.mouse.move(730,430);
  await page.keyboard.down('q'); await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  const held = await page.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));
  await key(page,'d',400); assert.deepEqual(await page.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position})),held);
  await page.screenshot({path:`${out}/charge-hold.png`});
  // Arrange the target inside the existing wave band, rather than depending
  // on its chase stopping exactly at the wave's 55-unit inner edge.
  const aimPoint = await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies[0];
    Object.assign(e.position,{x:s.player.position.x+90,y:s.player.position.y});e.update=()=>{};
    return {x:e.position.x-s.cameras.main.scrollX,y:e.position.y-s.cameras.main.scrollY};});
  await page.mouse.move(aimPoint.x,aimPoint.y);await page.waitForTimeout(50);
  await page.keyboard.up('q'); await page.waitForTimeout(550);
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.xp),15); report.chargeHoldReleaseAndXp=true;
  await key(page,'Space',90); assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.dashProgress<1)); report.dash=true;
  // Death through the actual incoming hit path, then the actual R respawn.
  for (let i=0;i<3;i++) {
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.isDashing=false;s.player.invulnerableUntil=0;const e=s.enemies[0];Object.assign(e.position,s.player.position);s.enemyStrike(e);});
    assert.ok(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.isDead));
    await page.waitForTimeout(650); await key(page,'r'); await page.waitForTimeout(850);
    assert.ok(await page.evaluate(()=>{const p=window.__danteGame.scene.getScene('Game').player;return !p.isDead&&p.hp===p.maxHp&&p.position.x===630&&p.position.y===950;}));
    assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1')),saved);
    report.restarts.push(await counts(page));
  }
  assert.deepEqual(report.restarts[1],report.restarts[0]); assert.deepEqual(report.restarts[2],report.restarts[0]); report.saveIsolationAndRespawn=true;
  // Standard Gamepad API mock. No vendor-specific mappings.
  await page.evaluate(()=>{window.qaPad={id:'QA Standard',index:0,connected:true,mapping:'standard',timestamp:0,axes:[.8,0,1,0],buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false}))};navigator.getGamepads=()=>[window.qaPad];});
  await page.waitForTimeout(200); assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.inputMethod),'gamepad');
  for (const index of [7,5,6]) { await page.evaluate(i=>window.qaPad.buttons[i]={pressed:true,value:1,touched:true},index);await page.waitForTimeout(120);
    if(index===6) assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
    await page.evaluate(i=>window.qaPad.buttons[i]={pressed:false,value:0,touched:false},index);await page.waitForTimeout(500); }
  report.gamepadMock=true; await page.reload();await ready(page);assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1')),saved);
  await page.locator('.records-button').click();await page.locator('[data-reset]').click();await page.locator('[data-confirm]').click();await page.waitForTimeout(900);await ready(page);
  assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.journey.v1')),saved);report.labJournalResetDoesNotDeleteJourney=true;await context.close();
  const touchContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});
  const touch=await touchContext.newPage();watch(touch);await touch.goto(`${base}quality-reference.html`);await ready(touch);await touch.waitForTimeout(900);
  const cdp=await touchContext.newCDPSession(touch),send=(type,touchPoints=[])=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  const center=async sel=>{const b=await touch.locator(sel).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
  const move=await center('.touch-move'),strike=await center('[data-action="attack"]'),charge=await center('[data-action="charge"]');
  await send('touchStart',[{...move,id:1}]);await send('touchMove',[{x:move.x+100,y:move.y,id:1}]);await touch.waitForTimeout(240);
  await send('touchStart',[{x:move.x+100,y:move.y,id:1},{...strike,id:2}]);await send('touchMove',[{x:move.x+100,y:move.y,id:1},{x:strike.x-60,y:strike.y-45,id:2}]);
  await send('touchEnd',[{x:strike.x-60,y:strike.y-45,id:2}]);await send('touchEnd');await touch.waitForTimeout(500);
  await send('touchStart',[{...charge,id:3}]);await send('touchMove',[{x:charge.x-70,y:charge.y-40,id:3}]);await touch.waitForTimeout(400);
  assert.equal(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.phase),'CHARGING');
  await touch.screenshot({path:`${out}/touch-charge.png`});await send('touchEnd');await touch.waitForTimeout(450);
  await touch.locator('[data-action="dash"]').tap();assert.equal(await touch.evaluate(()=>visualViewport.scale),1);report.touchEmulated=true;
  await touch.setViewportSize({width:390,height:844});await touch.waitForTimeout(250);assert.ok(await touch.locator('.touch-rotate').isVisible());await touchContext.close();
  assert.deepEqual(errors,[]);report.passed=true;await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} catch(e) {await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2));throw e;} finally {await browser.close();}
