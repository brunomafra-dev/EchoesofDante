import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5176/';
const out = 'docs/playtest-readability';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], report = { method: 'Chrome headless; inputs reais e preparação DEV; sem dispositivo físico', errors };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(base);
  await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
  const guide = () => page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    return { title: s.hud.signalObjective.text, hint: s.hud.explorationHint.text, action: s.hud.actionHint.text,
      label: s.explorationGuide.label.text, labelVisible: s.explorationGuide.label.visible, message: s.hud.discoveryMessage.text,
      echoes: s.progression.echoes.size, source: s.progression.sourceLocated, open: s.progression.passageOpen };
  });
  async function position(x, y) {
    await page.evaluate(({ x, y }) => { const s = window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position, { x, y }); s.player.invulnerableUntil = Infinity; }, { x, y });
    await page.waitForTimeout(120);
  }
  async function investigate() { await page.keyboard.down('e'); await page.waitForTimeout(70); await page.keyboard.up('e'); await page.waitForTimeout(140); }
  const steps = [await guide()];
  assert.match(steps[0].title, /INVESTIGUE OS ECOS.*0\/3/);
  assert.match(steps[0].hint, /Vestígio desconhecido/);
  await page.screenshot({ path: `${out}/inicio-pt.png` });
  await position(1870, 340); assert.equal((await guide()).title, 'PASSAGEM SELADA');
  await investigate(); assert.equal((await guide()).open, false);
  await position(1670,290);await investigate();assert.match((await guide()).message,/MECANISMO INATIVO/);assert.equal((await guide()).open,false);
  for (const [x, y] of [[560, 700], [1870, 900], [1500, 360]]) {
    await position(x, y);
    assert.match((await guide()).action, /\[E\] INVESTIGAR/);
    assert.ok((await guide()).labelVisible);
    if (x === 560) await page.screenshot({ path: `${out}/eco-pt.png` });
    await investigate(); steps.push(await guide());
  }
  assert.equal((await guide()).echoes, 3);
  assert.equal((await guide()).title, 'SIGA O SINAL AO NORTE');
  await page.waitForTimeout(1300); assert.match((await guide()).message, /SINAL SINCRONIZADO/);
  await position(1670,290);await investigate();assert.match((await guide()).message,/Investigue a fissura/);assert.equal((await guide()).source,false);
  await position(1870, 340); await investigate();
  assert.equal((await guide()).title, 'ATIVE O MECANISMO'); steps.push(await guide());
  await page.screenshot({ path: `${out}/fissura-pt.png` });
  await position(1670, 290); assert.match((await guide()).label, /Mecanismo ancestral/);
  await investigate(); await page.waitForTimeout(1550);
  assert.equal((await guide()).title, 'ENTRE NA CAVERNA'); steps.push(await guide());
  await position(1870, 335); await page.keyboard.down('w'); await page.waitForTimeout(400); await page.keyboard.up('w');
  await page.waitForFunction(() => window.__danteGame.scene.getScene('Game').area === 'cavern');
  await page.waitForTimeout(500); assert.equal((await guide()).title, 'EXPLORE A CAVERNA');
  report.guidedSteps = steps;
  // Isolate visual actors without changing their actual AI implementations.
  await page.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.deepPassageOpen = true; s.deeperEntered = true; s.scene.restart(); });
  await page.waitForTimeout(650); await position(3400, 850);
  report.motion = await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    const foes = ['skitter', 'spitter'].map(kind => s.enemies.find(e => e.kind === kind));
    s.enemies.forEach(e => { e.qaUpdate = e.update; e.update = () => {}; });
    return foes.map((e, index) => {
      const rotations = [], facing = [], walkFrames = new Set();
      let now = 20000;
      for (let d = 0; d < 8; d++) {
        const angle = d * Math.PI / 4;
        Object.assign(e.position, { x: 3200 + index * 130, y: 860 });
        e.state = 'CHASE'; e.hurtUntil = 0; e.attackAt = now;
        const gap = e.kind === 'skitter' ? 240 : 350;
        const target = { x: e.position.x + Math.cos(angle) * gap, y: e.position.y + Math.sin(angle) * gap };
        for (let step = 0; step < 12; step++) {
          e.qaUpdate(now += 16, 0.016, target, false, [], () => {});
          walkFrames.add(Number(e.body.frame.name)); rotations.push(e.view.rotation);
        }
        facing.push({ direction: d, flipX: e.body.flipX });
      }
      e.state = 'CHASE';
      const x = e.position.x, y = e.position.y, r = e.radius, phase = e.travelPhase;
      for (let step = 0; step < 15; step++) e.qaUpdate(now += 16, 0.016, { x: x + 350, y }, false, [], () => {}, { left: x-r, right: x+r, top: y-r, bottom: y+r });
      const blocked = { frame: Number(e.body.frame.name), phaseUnchanged: e.travelPhase === phase };
      e.state = 'CHASE'; e.attackAt = -Infinity;
      const target = { x: e.position.x + 30, y: e.position.y };
      e.qaUpdate(now += 16, 0.016, target, false, [], () => {});
      const anticipation = Number(e.body.frame.name);
      e.qaUpdate(now += 720, 0.016, target, false, [], () => {});
      const release = Number(e.body.frame.name);
      e.hurt(now, { x: e.position.x - 30, y: e.position.y });
      e.qaUpdate(now += 16, 0.016, target, false, [], () => {});
      const hurt = Number(e.body.frame.name);
      // Display two walking poses on the actual cavern floor for inspection.
      Object.assign(e.position, { x: 3200 + index * 140, y: 900 });
      e.view.setPosition(e.position.x, e.position.y).setDepth(e.position.y).setRotation(0);
      e.body.setFrame(index + 1).setFlipX(index === 1);
      e.shadow.setPosition(e.position.x, e.position.y + 12); e.telegraph.setVisible(false); e.aimGuide?.setVisible(false);
      s.cameras.main.stopFollow().centerOn(3240, 850);
      return { kind: e.kind, uprightAllDirections: rotations.every(v => v === 0), facing, walkFrames: [...walkFrames].sort(), blocked, anticipation, release, hurt, groundOrigin: e.body.originY };
    });
  });
  for (const motion of report.motion) {
    assert.ok(motion.uprightAllDirections); assert.ok(motion.walkFrames.length >= 3);
    assert.ok(motion.blocked.phaseUnchanged); assert.equal(motion.blocked.frame, 0);
    assert.equal(motion.anticipation, 5); assert.equal(motion.release, 6); assert.equal(motion.hurt, 7);
    assert.equal(motion.groundOrigin, 244/256);
  }
  await page.waitForTimeout(100); await page.screenshot({ path: `${out}/criaturas-apoiadas.png` });
  const english = /\b(INVESTIGATE|FOLLOW|FOREST|CAVERN|CHARGING|RESPAWN|STRIKE|SIGNAL|VITALS|LEVEL UP|ROTATE DEVICE|DRAG TO AIM)\b/;
  const visibleTexts = await page.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game');
    return s.children.list.filter(o => o.type === 'Text' && o.visible).map(o => o.text);
  });
  assert.ok(visibleTexts.every(text => !english.test(text)), JSON.stringify(visibleTexts));
  assert.ok(visibleTexts.every(text => !/[A-ZÁÉÍÓÚÇÃÕ]+\?[A-ZÁÉÍÓÚÇÃÕ]+/.test(text)));
  // Layout boundaries of translated HUD, at all supported viewport sizes.
  report.resolutions = [];
  for (const [width, height] of [[1280,720],[1366,768],[1920,1080],[844,390]]) {
    await page.setViewportSize({width,height}); await page.waitForTimeout(160);
    assert.ok(await page.evaluate(() => {
      const h=window.__danteGame.scene.getScene('Game').hud;
      return [h.signalObjective,h.explorationHint,h.actionHint].every(t=>t.getBounds().right<=280)
        && h.hpText.getBounds().right<=236
        && h.controlHints.every(t=>t.getBounds().left>=0&&t.getBounds().right<=1280);
    }));
    report.resolutions.push(`${width}x${height}`);
  }
  const mobile = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
  const touch = await mobile.newPage();touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto(base);await touch.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await touch.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:560,y:700});s.player.invulnerableUntil=Infinity;});await touch.waitForTimeout(200);
  assert.match(await touch.locator('.touch-actions').innerText(),/GOLPE/);
  const cdp=await mobile.newCDPSession(touch),box=await touch.locator('[data-action="interact"]').boundingBox();assert.ok(box);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForTimeout(200);
  assert.equal(await touch.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.echoes.size),1);
  await touch.screenshot({path:`${out}/touch-pt.png`});
  await touch.setViewportSize({width:390,height:844});await touch.waitForTimeout(200);
  assert.match(await touch.locator('.touch-rotate').innerText(),/GIRE O DISPOSITIVO/);await mobile.close();
  report.portugueseUi=true;report.touchInvestigate=true;report.portraitMessage=true;
  assert.equal(errors.length,0);
  await writeFile(`${out}/checks.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
