// Chrome integration checks. DEV positioning/clock overrides are explicit; no hardware claims.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/dante-journey/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless; keyboard/mouse, CDP touch and Gamepad API mock; DEV positions and cooldown expiry; no physical devices', errors };
const watch = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
const ready = page => page.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view?.active && document.querySelectorAll('.records-button').length === 1);
const state = page => page.evaluate(() => {
  const g = window.__danteGame, s = g.scene.getScene('Game');
  return { area: s.area, xp: s.progression.xp, level: s.progression.level, echoes: s.progression.echoes.size,
    hp: s.player.hp, maxHp: s.player.maxHp, p: { ...s.player.position }, dead: s.player.isDead,
    source: s.progression.sourceLocated, passage: s.progression.passageOpen, deep: s.deepPassageOpen,
    first: s.firstEchoSeen, gate: s.wardenGateOpen, won: s.wardenDefeated, landmark: s.valleyLandmarkSeen,
    routes: [...s.valleyRoutes], bestiary: s.bestiary.snapshot(), cooldowns: [...s.valleyHabitatCooldowns],
    residents: [...s.valleyResidents.keys()], enemies: s.enemies.filter(e => !e.isDead).length,
    paused: s.scene.isPaused(), open: s.records.isOpen, roots: document.querySelectorAll('.touch-controls').length,
    records: document.querySelectorAll('.records-dialog:not(.ability-upgrade-dialog)').length, objects: s.children.list.length,
    tweens: s.tweens.getTweens().length, method: s.controls.inputMethod, phase: s.charge.phase };
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); watch(page);
  await page.goto(base); await ready(page);
  async function key(code, ms = 80) { await page.keyboard.down(code); await page.waitForTimeout(ms); await page.keyboard.up(code); await page.waitForTimeout(100); }
  async function pos(x, y) { await page.evaluate(p => { const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position, p); s.player.invulnerableUntil = Infinity; }, { x, y }); await page.waitForTimeout(150); }
  async function reload() { await page.reload(); await ready(page); await page.waitForTimeout(450); }
  assert.equal((await state(page)).echoes, 0);
  await key('b'); assert.ok((await state(page)).paused && (await state(page)).open);
  const stopped = (await state(page)).p; await key('d', 300); assert.deepEqual((await state(page)).p, stopped);
  await key('b'); assert.equal((await state(page)).paused, false);
  await key('Space'); assert.equal((await state(page)).open, false); report.journalPausesAndReturnsFocus = true;
  // Actual investigation inputs: all Echoes, fissure and opening mechanism.
  for (const p of [[560,700],[1870,900],[1500,360]]) { await pos(...p); await key('e'); }
  assert.equal((await state(page)).echoes, 3); assert.equal((await state(page)).xp, 120);
  await reload(); assert.equal((await state(page)).echoes, 3); assert.equal((await state(page)).xp, 120);
  await pos(1500,360); await key('e'); assert.equal((await state(page)).xp, 120);
  await pos(1870,340); await key('e'); await pos(1670,290); await key('e'); await page.waitForTimeout(1700);
  await reload(); assert.ok((await state(page)).passage && (await state(page)).source);
  await pos(1870,335); await key('w', 360);
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'cavern');
  await page.waitForTimeout(650);
  await pos(1620,490); await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').deepPassageOpen);
  await pos(2120,700); await pos(2700,980); await pos(4600,740); await pos(4870,720); await key('e');
  await pos(5530,760); await key('e');
  await page.waitForFunction(() => { const s = window.__danteGame.scene.getScene('Game'); return s.firstEchoSeen && !s.cavern.wardenApproach.responding; });
  await reload(); assert.ok((await state(page)).first && (await state(page)).deep);
  await pos(6100,740); await key('e'); await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').wardenGateOpen);
  await pos(6240,740); await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'warden'); await page.waitForTimeout(650);
  await pos(900,760); await page.waitForTimeout(2400);
  // Pausing the journal must preserve telegraph and Dash deadlines, not skip them.
  const pauses = [];
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const s = window.__danteGame.scene.getScene('Game');
      s.warden.introduced = true; s.warden.beginAttack(s.time.now, 'slam', s.player.position);
      s.player.lastDashAt = s.time.now; s.records.open();
    });
    const before = await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return s.warden.stateUntil - s.time.now; });
    await page.evaluate(() => {
      document.querySelector('.records-dialog:not(.ability-upgrade-dialog)').addEventListener('close', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const s = window.__danteGame.scene.getScene('Game');
          window.qaPauseReturn = { state: s.warden.state, remaining: s.warden.stateUntil - s.time.now, dash: s.player.dashProgress };
        }));
      }, { once: true });
      window.qaPauseReturn = null;
    });
    await page.waitForTimeout(2100); await page.locator('[data-close]').click();
    await page.waitForFunction(() => window.qaPauseReturn);
    const after = await page.evaluate(() => window.qaPauseReturn);
    assert.equal(after.state, 'TELEGRAPH'); assert.ok(before - after.remaining < 350); assert.ok(after.dash < 0.2); pauses.push(after);
  }
  report.combatClockPausesWithJournal = pauses;
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game'); s.warden.health.current = 1;
    s.resolveSaberHits(s.time.now, [s.warden], 0); // Real damage/reward path, shortened boss solely for journey QA.
  });
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').signalPortal?.active);
  await pos(1450,830); await key('e'); await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'valley'); await page.waitForTimeout(650);
  assert.equal((await state(page)).enemies, 12); report.fullJourneyToValley = true;
  // Main/north/south regions preserve all existing obstacles and remain optional.
  for (const p of [[1050,760],[1270,555],[1510,1040],[2190,745]]) await pos(...p);
  await key('e'); assert.ok((await state(page)).landmark); assert.equal((await state(page)).routes.length, 3);
  const oldXp = (await state(page)).xp;
  await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game'), e = s.valleyResidents.get(900);
    e.health.current = 1; s.resolveSaberHits(s.time.now, [e], 0);
  }); await page.waitForTimeout(650);
  let after = await state(page); assert.equal(after.xp, oldXp + 15); assert.ok(!after.residents.includes(900));
  assert.equal(after.bestiary.carapace.defeats, 1);
  const wait = after.cooldowns.find(([id]) => id === 900)[1] - Date.now(); assert.ok(wait > 87_000 && wait <= 90_000);
  // Reload retains kills, cooldowns, bestiary, HP and region access.
  await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.player.health.current = 73; s.saveProgress(); });
  await reload(); after = await state(page);
  assert.equal(after.area, 'valley'); assert.equal(after.hp, 73); assert.equal(after.xp, oldXp + 15); assert.equal(after.level, 3);
  assert.ok(after.won && after.first && after.landmark); assert.equal(after.routes.length, 3); assert.equal(after.bestiary.carapace.defeats, 1); assert.ok(!after.residents.includes(900));
  // DEV expires the timer, but actual proximity safety still prevents a spawn in front of the player.
  await pos(900,855); await page.evaluate(() => window.__danteGame.scene.getScene('Game').valleyHabitatCooldowns.set(900, Date.now() - 1));
  await page.waitForTimeout(350); assert.ok(!(await state(page)).residents.includes(900));
  await pos(1860,570); await page.waitForTimeout(500); assert.ok((await state(page)).residents.includes(900));
  const count = (await state(page)).enemies; await page.waitForTimeout(800); assert.equal((await state(page)).enemies, count);
  await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'), e = s.valleyResidents.get(900); e.health.current = 1; s.resolveSaberHits(s.time.now, [e], 0); });
  assert.equal((await state(page)).xp, oldXp + 30); assert.equal((await state(page)).bestiary.carapace.defeats, 2);
  report.renewal = { delayMs: 90_000, safeDistance: 480, expiry: 'DEV timestamp override', repeatedKillXp: 15, reloadCannotResetCooldown: true };
  // Death/respawn/reload cycles retain one journal/root and bounded scene objects.
  const cycles = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.player.health.current = 1; s.player.invulnerableUntil = 0; s.enemyStrike(s.enemies[0], { damage: 11, ranged: true }); });
    await page.waitForTimeout(620); assert.ok((await state(page)).dead); await key('r'); await page.waitForTimeout(850); await reload();
    const r = await state(page); assert.equal(r.hp, r.maxHp); assert.equal(r.xp, oldXp + 30); assert.equal(r.bestiary.carapace.defeats, 2); assert.equal(r.roots, 1); assert.equal(r.records, 1);
    assert.deepEqual(r.p, { x: 1860, y: 570 }); assert.ok(!r.residents.includes(900)); cycles.push(r);
  }
  for (const c of cycles.slice(1)) for (const k of ['objects','tweens','enemies','roots','records']) assert.equal(c[k], cycles[0][k]);
  report.cycles = cycles;
  await pos(420,850); await key('e'); await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'warden'); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => window.__danteGame.scene.getScene('Game').warden), undefined);
  await pos(1450,830); await key('e'); await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'valley'); await page.waitForTimeout(700);
  // Cancel a PC charge upon opening the journal, no automatic release on return.
  await page.keyboard.down('q'); await page.waitForTimeout(350); assert.equal((await state(page)).phase, 'CHARGING');
  await key('b'); assert.equal((await state(page)).phase, 'READY'); await page.keyboard.up('q'); await key('b'); assert.equal((await state(page)).phase, 'READY');
  report.chargeCancelledByJournal = true;
  await page.evaluate(() => { window.qaPad = { connected: true, mapping: 'standard', axes: [0,0,0,0], buttons: Array.from({length:16}, () => ({value:0,pressed:false})) }; navigator.getGamepads = () => [window.qaPad]; window.qaPad.buttons[8].value=1; });
  await page.waitForTimeout(250); assert.ok((await state(page)).open);
  await page.evaluate(() => { window.qaPad.buttons[8].value=0; }); await page.waitForTimeout(100);
  await page.evaluate(() => { window.qaPad.buttons[1].value=1; }); await page.waitForTimeout(250); assert.equal((await state(page)).open, false);
  await pos(420,850);
  await page.evaluate(() => { window.qaPad.buttons[1].value=0; window.qaPad.buttons[8].value=1; });await page.waitForTimeout(250);assert.ok((await state(page)).open);
  await page.evaluate(() => { window.qaPad.buttons[8].value=0; });await page.waitForTimeout(100);
  await page.evaluate(() => { window.qaPad.buttons[0].value=1; });await page.waitForTimeout(450);
  assert.equal((await state(page)).open,false);assert.equal((await state(page)).area,'valley','A used to close the journal must not traverse the nearby portal');
  await page.evaluate(() => { window.qaPad.buttons[0].value=0; });await pos(1860,570);report.gamepadMenuActionConsumed=true;
  await page.evaluate(() => { navigator.getGamepads = () => []; }); report.gamepadJournalMock = true;
  for (const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]) {
    await page.setViewportSize({width,height}); await page.locator('.records-button').click();
    const bounds = await page.locator('.records-dialog[open]:not(.ability-upgrade-dialog)').boundingBox(); assert.ok(bounds.width <= width && bounds.height <= height);
    await page.screenshot({path:`${out}/records-${width}x${height}.png`}); await page.locator('[data-close]').click();
  }
  await page.setViewportSize({width:1280,height:720}); await pos(1860,570); await page.waitForTimeout(1000);
  report.performance = await page.evaluate(async () => {
    const g=window.__danteGame,s=g.scene.getScene('Game'); let writes=0;
    const original=Storage.prototype.setItem; Storage.prototype.setItem=function(...args){writes++;return original.apply(this,args);};
    const values=[]; for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,200));values.push(g.loop.actualFps);}
    Storage.prototype.setItem=original; return {meanFps:values.reduce((a,b)=>a+b,0)/values.length, writesDuringIdle:writes, objects:s.children.list.length, tweens:s.tweens.getTweens().length, saveBytes:localStorage.getItem('echoes-of-dante.journey.v1').length};
  }); assert.equal(report.performance.writesDuringIdle, 0);
  // Confirmed reset must not be overwritten by pagehide flushing the old journey.
  await page.locator('.records-button').click(); await page.locator('[data-reset]').click(); await page.locator('[data-cancel]').click(); assert.equal((await state(page)).xp, oldXp+30);
  await page.locator('[data-reset]').click(); await page.locator('[data-confirm]').click(); await page.waitForTimeout(900); await ready(page);
  assert.equal((await state(page)).area,'forest'); assert.equal((await state(page)).echoes,0); assert.equal((await state(page)).xp,0); assert.deepEqual((await state(page)).bestiary,{});
  report.confirmedReset = true;
  // Malformed/unsupported saves and unavailable storage must not break startup.
  for(const payload of ['{broken', JSON.stringify({schema:99}), JSON.stringify({schema:1,progression:{xp:-1,echoes:[],rewardedHollows:[]},flags:{},hp:100})]) {
    await page.addInitScript(value => localStorage.setItem('echoes-of-dante.journey.v1',value),payload);
    await reload(); assert.equal((await state(page)).area,'forest'); assert.equal((await state(page)).xp,0);
  }
  report.invalidSaveRecovery = true;
  const blocked = await browser.newPage(); watch(blocked);
  await blocked.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Unavailable','QuotaExceededError'); }; });
  await blocked.goto(base); await ready(blocked); await blocked.locator('.records-button').click(); assert.match(await blocked.locator('.records-status').innerText(),/salvar/); await blocked.close(); report.storageUnavailablePlayable = true;
  // Trusted touch: journal button, scrolling, close, joystick, directed strike and charge.
  const mobile = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const touch = await mobile.newPage(); watch(touch); await touch.goto(base); await ready(touch);
  const cdp=await mobile.newCDPSession(touch);
  await touch.locator('.records-button').tap(); await touch.waitForFunction(()=>window.__danteGame.scene.getScene('Game').scene.isPaused());assert.ok((await state(touch)).paused);
  const panel=await touch.locator('.records-dialog:not(.ability-upgrade-dialog) .records-content').boundingBox(),sx=panel.x+90,sy=panel.y+panel.height-25;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});
  for(const offset of [25,55,90,120]) { await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx,y:sy-offset,id:1}]});await touch.waitForTimeout(35); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(200);
  assert.ok(await touch.locator('.records-dialog:not(.ability-upgrade-dialog) .records-content').evaluate(el=>el.scrollTop>45));report.nativeTouchJournalScroll=true;
  await touch.screenshot({path:`${out}/touch-records.png`}); await touch.locator('[data-close]').tap();
  // Native dialog close dispatches its event asynchronously; wait for scene resume.
  await touch.waitForFunction(() => {
    const scene = window.__danteGame.scene.getScene('Game');
    return !scene.records.isOpen && !scene.scene.isPaused();
  });
  assert.equal((await state(touch)).paused,false);
  async function gesture(selector,dx=0,dy=0,ms=220) {
    const b=await touch.locator(selector).boundingBox();assert.ok(b);const x=b.x+b.width/2,y=b.y+b.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    if(dx||dy)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});
    await touch.waitForTimeout(ms);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(120);
  }
  const start=(await state(touch)).p;await gesture('.touch-move',40,0,350);assert.ok((await state(touch)).p.x>start.x+30);
  await gesture('[data-action="attack"]',35,-20);await gesture('[data-action="charge"]',40,0,450);await gesture('[data-action="dash"]');
  await touch.waitForTimeout(3300);
  const charge=await touch.locator('[data-action="charge"]').boundingBox(),cx=charge.x+charge.width/2,cy=charge.y+charge.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});await touch.waitForTimeout(300);
  assert.equal((await state(touch)).phase,'CHARGING');
  const records=await touch.locator('.records-button').boundingBox(),rx=records.x+records.width/2,ry=records.y+records.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},{x:rx,y:ry,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:cx,y:cy,id:1}]});await touch.waitForTimeout(150);
  assert.ok((await state(touch)).open);assert.equal((await state(touch)).phase,'READY');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.locator('[data-close]').tap();await touch.waitForTimeout(250);
  assert.equal(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').charge.wavePending),false);report.touchChargeCancelledBySecondFinger=true;
  assert.equal((await state(touch)).method,'touch');assert.equal(await touch.evaluate(()=>visualViewport.scale),1);report.touchEmulated=true;
  await mobile.close();
  assert.deepEqual(errors,[]);report.passed=true;await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} catch(e) { await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2)); throw e; }
finally { await browser.close(); }
