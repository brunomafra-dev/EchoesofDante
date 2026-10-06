// Chrome integration: real attack inputs, explicit legacy-save/position/renewal setup.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:5184/';
const out = process.argv[3] ?? 'docs/dante-expeditions/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { method: 'Chrome headless; legacy v1 save fixture, DEV positions, isolated real mouse/Q combat; shortened kills and expiry for renewal loops; no physical devices', errors: [] };
const legacy = { schema: 1, updatedAt: Date.now(), area: 'valley', hp: 71,
  progression: { xp: 345, echoes: ['northern-ruin','mineral-signal','unknown-trace'], sourceLocated: true, passageOpen: true, rewardedHollows: [0,8] },
  flags: Object.fromEntries(['deepPassageOpen','deepCavernEntered','deeperEntered','exteriorEntered','fragmentSeen','firstEchoSeen','wardenGateOpen','wardenDefeated','wardenEndingSeen','valleyVisited','valleyCheckpointReached','valleyLandmarkSeen','valleyEndSeen'].map(k=>[k,true])),
  bestiary: { carapace: { seen:true,defeats:1 }, thorn: { seen:true,defeats:0 } }, valleyRoutes:['ridge','mineral','roots'], valleyHabitats:[] };
const watch = p => { p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);}); };
const ready = p => p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view?.active);
try {
  const page=await browser.newPage({viewport:{width:1280,height:720}});watch(page);
  await page.addInitScript(save=>{if(!localStorage.getItem('echoes-of-dante.journey.v1'))localStorage.setItem('echoes-of-dante.journey.v1',JSON.stringify(save));},legacy);
  await page.goto(base);await ready(page);await page.waitForTimeout(400);
  const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {xp:s.progression.xp,level:s.progression.level,hp:s.player.hp,maxHp:s.player.maxHp,next:s.progression.nextLevelXp,routes:[...s.valleyRoutes],rewards:[...s.progression.rewardedRoutes],bestiary:s.bestiary.snapshot(),enemies:s.enemies.filter(e=>!e.isDead).length,area:s.area,p:{...s.player.position},hint:s.hud.progressHint.text,xpLabels:s.children.list.filter(o=>o.type==='Text'&&o.visible&&/^\+\d+ XP$/.test(o.text)).map(o=>({text:o.text,worldAnchored:o.scrollFactorX===1})),levelMessage:s.hud.levelMessage.text,guide:s.hud.signalObjective.text,upgradeRanks:{...s.progression.abilityUpgradeRanks},upgradePoints:s.progression.upgradePointsAvailable,objects:s.children.list.length,tweens:s.tweens.getTweens().length,rt:s.children.list.filter(o=>o.type==='RenderTexture').length,updateListeners:s.events.listenerCount('update')};});
  async function chooseUpgrade(id){await page.locator('.ability-upgrade-dialog[open]').waitFor();await page.locator(`[data-upgrade="${id}"]:not(:disabled)`).click();await page.waitForFunction(()=>!document.querySelector('.ability-upgrade-dialog[open]'));}
  async function pos(x,y) {await page.evaluate(p=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,p);s.player.invulnerableUntil=Infinity;},{x,y});await page.waitForTimeout(160);}
  async function reload(){await page.reload();await ready(page);await page.waitForTimeout(450);}
  let s=await state();assert.equal(s.area,'valley');assert.equal(s.xp,345);assert.equal(s.level,3);assert.equal(s.hp,71);assert.equal(s.enemies,12);assert.equal(s.rewards.length,0);
  assert.match(s.hint,/XP 345 \/ 360/);report.legacySaveRestoresWithoutReset=true;
  await page.locator('.records-button').click();assert.match(await page.locator('.records-routes').innerText(),/Revisite/);
  const cards=page.locator('.records-species article');assert.match(await cards.nth(3).innerText(),/ESTUDADO/);assert.match(await cards.nth(4).innerText(),/OBSERVADO/);assert.doesNotMatch(await cards.nth(4).innerText(),/ESTUDADO/);await page.locator('[data-close]').click();
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').player.health.current=45);
  await pos(1050,760);s=await state();assert.equal(s.xp,365);assert.equal(s.level,4);assert.equal(s.maxHp,130);assert.equal(s.hp,130);assert.match(s.levelMessage,/\+10 PV/);assert.ok(s.xpLabels.some(label=>label.text==='+20 XP'&&label.worldAnchored));
  const feedback=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),reward=s.children.list.find(o=>o.type==='Text'&&o.visible&&o.text==='+20 XP');return {anchored:reward?.scrollFactorX===1,level:s.hud.levelMessage.getBounds().bottom};});assert.ok(feedback.anchored,'route XP floats in the world at the discovery');await page.screenshot({path:`${out}/level-4.png`});
  await chooseUpgrade('saberArc');s=await state();assert.equal(s.upgradeRanks.saberArc,1);assert.equal(s.upgradePoints,0);report.firstMasteryChoice={level:s.level,upgrade:'saberArc',pointsRemaining:s.upgradePoints};
  await pos(800,760);await pos(1050,760);assert.equal((await state()).xp,365);await reload();assert.equal((await state()).xp,365);assert.equal((await state()).level,4);assert.deepEqual((await state()).rewards,['ridge']);
  await pos(1050,760);assert.equal((await state()).xp,365);await pos(1270,555);await pos(1510,1040);s=await state();assert.equal(s.xp,405);assert.equal(s.rewards.length,3);assert.match(s.guide,/EXPLORE AL/);report.explorationAwardsOnceAcrossReload=true;
  // The original eight Vale habitats and three quiet locations retain the progression QA safety checks; the four Escarpment habitats belong to Expansion 03 QA.
  report.habitats=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return [...s.valleyResidents].map(([id,e])=>({id,kind:e.kind,x:e.home.x,y:e.home.y,clear:s.arena.obstacles.every(o=>Math.hypot(e.home.x-o.x,e.home.y-o.y)>e.radius+o.radius)}));});
  assert.ok(report.habitats.filter(h=>h.id<=907).every(h=>h.clear));assert.equal(new Set(report.habitats.map(h=>h.id)).size,12);
  assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return [[530,850],[1860,570],[2190,745]].every(([x,y])=>[...s.valleyResidents.values()].every(e=>Math.hypot(e.home.x-x,e.home.y-y)>({carapace:340,thorn:370}[e.kind])));}));report.safeEntryCheckpointPoi=true;
  // Isolate a full-health new Casco habitat, then use four unchanged 34-damage Saber hits.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.enemies.forEach(e=>e.update=()=>{});const e=s.valleyResidents.get(906);Object.assign(e.position,{x:700,y:950});Object.assign(s.player.position,{x:610,y:950});s.player.invulnerableUntil=Infinity;});await page.waitForTimeout(650);
  async function aim(x,y){const p=await page.evaluate(({x,y})=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:x-c.scrollX,y:y-c.scrollY};},{x,y});await page.mouse.move(p.x,p.y);}
  const melee=[];for(let i=0;i<4;i++){
    const point=await page.evaluate(()=>{const c=window.__danteGame.scene.getScene('Game').cameras.main;return{x:700-c.scrollX,y:950-c.scrollY};});await page.mouse.click(point.x,point.y);await page.waitForTimeout(450);melee.push(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return s.valleyResidents.get(906)?.health.current??0;}));}
  assert.deepEqual(melee,[102,68,34,0]);assert.equal((await state()).xp,420);report.saberFullHealthFourHits=melee;
  // Full-health Espinhante survives the existing max charge (78 - 76), then falls to Saber.
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.valleyResidents.get(901).position,{x:790,y:950});});await aim(790,950);await page.keyboard.down('q');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').charge.phase==='CHARGING');await page.waitForTimeout(850);
  report.chargeHeld=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {phase:s.charge.phase,level:s.charge.level(s.time.now),p:{...s.player.position},aim:s.player.rotation};});
  await page.keyboard.up('q');await page.waitForTimeout(650);
  report.chargeReleased=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return {phase:s.charge.phase,angle:s.charge.angle,origin:{...s.charge.origin},damage:s.charge.damage,hp:s.valleyResidents.get(901)?.health.current};});
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').valleyResidents.get(901).health.current),2);
  await pos(700,950);await page.waitForTimeout(600);await aim(790,950);await page.mouse.down();await page.waitForTimeout(90);await page.mouse.up();await page.waitForTimeout(450);assert.equal((await state()).xp,435);assert.equal((await state()).bestiary.thorn.defeats,1);report.charge76ThenSaber=true;
  await page.locator('.records-button').click();assert.match(await cards.nth(4).innerText(),/ESTUDADO.*acompanha/s);assert.match(await page.locator('.records-routes').innerText(),/Recompensa de explora/);await page.locator('[data-close]').click();report.tacticalStudyUnlocksWithoutBonusXp=true;
  // Repeated genuine resident rewards/renewal. DEV shortens damage and wall-clock waits.
  const waves=[];
  while((await state()).xp<660){
    await pos(450,550);await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const id of s.valleyHabitatCooldowns.keys())s.valleyHabitatCooldowns.set(id,Date.now()-1);});await page.waitForTimeout(400);
    assert.equal((await state()).enemies,12);
    await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const e of [...s.valleyResidents.values()]){if(s.progression.xp>=660)break;e.health.current=1;s.resolveSaberHits(s.time.now,[e],0);}});await page.waitForTimeout(700);waves.push(await state());
  }
  s=await state();assert.equal(s.xp,660);assert.equal(s.level,5);assert.equal(s.maxHp,140);assert.equal(s.hp,140);assert.equal(s.next,960);assert.match(s.hint,/XP 660 \/ 960/);report.level5ContinuesTowardLevel6=waves.map(w=>({xp:w.xp,level:w.level,maxHp:w.maxHp}));
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=[...s.valleyResidents.values()][0];e.health.current=1;s.resolveSaberHits(s.time.now,[e],0);});await page.waitForTimeout(700);assert.equal((await state()).xp,675);assert.equal((await state()).level,5);
  const deaths=[];for(let i=0;i<3;i++){await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.health.current=1;s.player.invulnerableUntil=0;s.enemyStrike({attackRange:10},{damage:11,ranged:true});});await page.waitForTimeout(650);await page.keyboard.press('r');await page.waitForTimeout(850);await reload();s=await state();assert.equal(s.xp,675);assert.equal(s.level,5);assert.equal(s.hp,140);assert.equal(s.upgradeRanks.saberArc,1);assert.equal(s.upgradePoints,0);assert.equal(s.rewards.length,3);assert.deepEqual(s.p,{x:1860,y:570});deaths.push(s);}
  for(const d of deaths.slice(1))for(const key of ['objects','rt','updateListeners','enemies'])assert.equal(d[key],deaths[0][key]);report.deathReloadPreservesLevelRewardsAndStudy=true;
  await pos(450,550);await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const id of s.valleyHabitatCooldowns.keys())s.valleyHabitatCooldowns.set(id,Date.now()-1);});await page.waitForTimeout(700);assert.equal((await state()).enemies,12);
  await page.waitForTimeout(1900);const stable=await state();await page.waitForTimeout(4000);const later=await state();for(const key of ['objects','tweens','rt','enemies','updateListeners'])assert.equal(later[key],stable[key]);report.stability={objects:later.objects,tweens:later.tweens,renderTextures:later.rt,enemies:later.enemies,updateListeners:later.updateListeners};
  report.performance=await page.evaluate(async()=>{const g=window.__danteGame,a=[];for(let i=0;i<25;i++){await new Promise(r=>setTimeout(r,200));a.push(g.loop.actualFps);}return {mean:a.reduce((x,y)=>x+y,0)/a.length,min:Math.min(...a),max:Math.max(...a)};});
  for(const [width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.locator('.records-button').click();const b=await page.locator('.records-dialog[open]:not(.ability-upgrade-dialog)').boundingBox();assert.ok(b.width<=width&&b.height<=height);await page.screenshot({path:`${out}/records-${width}x${height}.png`});await page.locator('[data-close]').click();}
  await pos(420,850);await page.keyboard.press('e');await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='warden');await page.waitForTimeout(500);assert.equal((await state()).level,5);assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').warden),undefined);report.returnPreservesWardenVictory=true;
  assert.deepEqual(report.errors,[]);report.passed=true;await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){await writeFile(`${out}/failure.json`,JSON.stringify({...report,failure:e.stack},null,2));throw e;}finally{await browser.close();}
