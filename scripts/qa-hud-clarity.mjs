// HUD review in real Chrome. DEV changes stage locations/feedback, not gameplay values.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/hud-clarity/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { method: 'Chrome headless; DEV area/feedback staging; real keyboard/mouse, touch emulation, standard Gamepad API mock; no physical hardware', errors: [] };
const watch = page => {
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
};
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view?.active);
try {
  const page = await browser.newPage({ viewport: { width:1280, height:720 } }); watch(page);
  await page.goto(base); await ready(page); await page.waitForTimeout(900);
  await page.screenshot({path:`${out}/forest-start.png`});
  await page.waitForTimeout(10100);
  assert.ok(await page.evaluate(() => window.__danteGame.scene.getScene('Game').hud.controlHints.every(h=>!h.visible)));
  report.controlsHintExpires=true;
  await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game'); Object.assign(s.player.position,{x:560,y:700}); s.player.invulnerableUntil=Infinity; });
  await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => {const h=window.__danteGame.scene.getScene('Game').hud;return h.actionHint.visible&&!h.explorationHint.visible&&h.discoveryPrompt.visible;}));
  await page.keyboard.press('e'); await page.waitForTimeout(150);
  report.echoFeedback=await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game');return {xp:s.progression.xp,text:s.hud.experienceText.text,background:s.hud.experienceText.style.backgroundColor}; });
  assert.equal(report.echoFeedback.xp,40); assert.equal(report.echoFeedback.text,'+40 XP'); assert.ok(!report.echoFeedback.background);
  await page.waitForTimeout(1300); assert.ok(await page.evaluate(() => !window.__danteGame.scene.getScene('Game').hud.experienceText.visible));
  await page.keyboard.down('b'); await page.waitForTimeout(100); await page.keyboard.up('b'); await page.locator('.records-dialog[open]').waitFor(); await page.locator('.records-controls summary').click(); assert.match(await page.locator('.records-controls').innerText(),/WASD.*Gamepad.*Touch/s); await page.locator('[data-close]').click();
  const before = await page.evaluate(() => ({...window.__danteGame.scene.getScene('Game').player.position}));
  await page.keyboard.down('d'); await page.waitForTimeout(220); await page.keyboard.up('d');
  assert.ok(await page.evaluate(p=>window.__danteGame.scene.getScene('Game').player.position.x>p.x+20,before));
  await page.mouse.move(850,380); await page.mouse.click(850,380); await page.keyboard.down('Space'); await page.waitForTimeout(90); await page.keyboard.up('Space'); await page.waitForTimeout(220);
  await page.keyboard.down('q'); await page.waitForTimeout(600);
  assert.match(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').hud.chargeText.text),/CARGA · \d+%/);
  await page.keyboard.up('q'); await page.waitForTimeout(400);report.keyboardActionsAndHelp=true;
  // Compare authored states at every supported viewport; all text must fit the canvas.
  report.layouts=[];
  for(const area of ['forest','cavern','valley','warden']){
    await page.evaluate(area=>{const s=window.__danteGame.scene.getScene('Game');s.area=area;s.wardenDefeated=area==='valley';s.valleyVisited=true;s.valleyCheckpointReached=true;s.progression.xp=400;s.progression.level=4;s.scene.restart();},area);
    await page.waitForTimeout(850);
    if(area==='warden') await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.warden.introduced=true;s.warden.setState('RECOVER',s.time.now,60000);});
    for(const [width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(220);
      await page.evaluate(()=>{const h=window.__danteGame.scene.getScene('Game').hud;h.showLevelUp(4,130,10);h.showExperience(20,'EXPLORAÇÃO');});
      const layout=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),h=s.hud;const texts=[h.hpText,h.progressText,h.progressHint,h.signalObjective,h.explorationHint,h.actionHint,h.dashText,h.chargeText,h.areaSubtitle,h.levelMessage,h.experienceText].filter(t=>t.visible);return {fits:texts.every(t=>{const b=t.getBounds();return b.left>=0&&b.right<=1280&&b.top>=0&&b.bottom<=720;}),supportingLines:Number(h.explorationHint.visible)+Number(h.actionHint.visible),xp:h.experienceText.text,xpBackground:h.experienceText.style.backgroundColor,feedbackGap:h.experienceText.getBounds().top-h.levelMessage.getBounds().bottom,progressGap:h.progressHint.getBounds().top-h.progressText.getBounds().bottom,barGap:h.xpFill.y-h.progressHint.getBounds().bottom};});
      assert.ok(layout.fits);assert.equal(layout.supportingLines,1);assert.match(layout.xp,/^\+\d+ XP$/);assert.ok(!layout.xpBackground);assert.ok(layout.feedbackGap>0);assert.ok(layout.progressGap>=0&&layout.barGap>=0);
      report.layouts.push({area,width,height,...layout});await page.screenshot({path:`${out}/${area}-${width}x${height}.png`});
    }
  }
  await page.evaluate(()=>{window.qaPad={id:'QA Standard Gamepad',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0.6,0,0,1],buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false}))};navigator.getGamepads=()=>[window.qaPad];});await page.waitForTimeout(450);
  assert.match(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').hud.dashText.text),/\[RB\]/);assert.match(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').hud.chargeText.text),/\[LT\]/);report.gamepadMockLabels=true;
  await page.close();
  const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});const touch=await context.newPage();watch(touch);await touch.goto(base);await ready(touch);
  await touch.locator('[data-action="attack"]').tap();await touch.locator('[data-action="dash"]').tap();await touch.locator('.records-button').tap();await touch.locator('.records-dialog[open]').waitFor();await touch.locator('[data-close]').tap();
  const sizes=await touch.locator('.touch-actions button').evaluateAll(bs=>bs.map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})));
  assert.ok(sizes.every(b=>b.w>=44&&b.h>=44));report.touchTargets=sizes;
  await touch.screenshot({path:`${out}/touch-844x390.png`});
  await touch.setViewportSize({width:390,height:844});assert.ok(await touch.locator('.touch-rotate').isVisible());report.touchEmulated=true;await context.close();
  assert.deepEqual(report.errors,[]);report.passed=true;await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2));throw e;}finally{await browser.close();}
