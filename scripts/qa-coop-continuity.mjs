import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const out = process.argv[2] ?? 'docs/regional-coop/continuity-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const hc = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const gc = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true });
await gc.addInitScript(() => {
  if (localStorage.getItem('qa-init')) return;
  localStorage.setItem('qa-init', '1');
  localStorage.setItem('echoes-of-dante.characters.v1', JSON.stringify({ schema: 1, selected: 'visitor', characters: [
    { id: 'visitor', name: 'Caçadora visitante', classId: 'hunter', createdAt: 1 },
  ] }));
  localStorage.setItem('echoes-of-dante.journey.v1.character.visitor', JSON.stringify({ schema: 1, updatedAt: 1,
    area: 'forest', hp: 80, flags: {}, bestiary: {}, valleyRoutes: [], valleyHabitats: [], aridHabitats: [],
    progression: { xp: 15, echoes: [], sourceLocated: false, passageOpen: false, rewardedHollows: [], rewardedRoutes: [] } }));
});
const h = await hc.newPage(), g = await gc.newPage();
const report = { errors: [], method: 'Two independent Chrome contexts, real local relay/menu/keys; DEV positions, completed-campaign setup and lethal hit setup. No physical devices.' };
for (const p of [h, g]) {
  p.on('pageerror', error => report.errors.push(error.message));
  p.on('response', response => { if (response.status() >= 400) report.errors.push(response.url()); });
}
const scene = () => window.__danteGame.scene.getScene('Game');
const ready = p => p.waitForFunction(() => window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const saved = () => JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.visitor'));
const state = p => p.evaluate(() => {
  const s = window.__danteGame.scene.getScene('Game'), r = window.__danteCoop;
  return { area: s.area, role: r.role, connected: r.connected, code: r.code, epoch: r.epoch, xp: s.progression.xp,
    personal: r.personalXpGained, saved: r.rewardSaved, receipt: r.receipt, dead: s.player.isDead,
    objects: s.children.list.length, tweens: s.tweens.getTweens().length, fps: window.__danteGame.loop.actualFps,
    p:{...s.player.position},partner:s.party.partner?{...s.party.partner.player.position}:null,
    roomArea:r.area,message:r.message,transitioning:s.transitioning,prompt:r.world?.prompt };
});
const key = async (p, name, duration = 150) => {
  await p.keyboard.down(name); await p.waitForTimeout(duration); await p.keyboard.up(name); await p.waitForTimeout(220);
};
async function arrive(area) {
  for (const p of [h, g]) await p.waitForFunction(area => {
    const s = window.__danteGame.scene.getScene('Game');
    const r=window.__danteCoop;
    return s.area === area && !s.transitioning && s.party.localPlayer === s.player && s.player.view.active &&
      (r.role === 'host' ? s.party.partner?.player.view.active : s.party.mirrorHost?.player.view.active && r.world?.area===area &&
        Math.hypot(s.player.position.x-r.world.partner.x,s.player.position.y-r.world.partner.y)<30);
  }, area);
  // SceneManager defers restart; wait for a fresh snapshot after the new actors exist.
  await g.waitForTimeout(350);
  await h.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game'); s.player.invulnerableUntil = s.party.partner.player.invulnerableUntil = Infinity;
  });
}
async function portal(player, position, area) {
  await h.evaluate(({ player, position }) => {
    const s = window.__danteGame.scene.getScene('Game');
    Object.assign(player === 'host' ? s.player.position : s.party.partner.player.position, position);
  }, { player, position });
  await g.waitForTimeout(400); await key(player === 'host' ? h : g, 'e'); await arrive(area);
}
async function kill() {
  return h.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game'), e = s.enemies.find(e => !e.isDead);
    if (!e) throw Error('No target');
    const before = s.progression.xp;
    s.resolvePlayerHits(s.time.now, [e], 9999, 0, 0x5fe6d8, s.player.position, false);
    return s.progression.xp - before;
  });
}
async function reconnect(p) {
  await p.evaluate(() => window.__danteCoop.socket.close());
  await p.waitForFunction(() => !window.__danteCoop.connected);
  await p.waitForFunction(() => window.__danteCoop.connected, { timeout: 10000 });
  await g.waitForTimeout(700);
}
try {
  await h.goto('http://localhost:5184/?qa=play'); await ready(h);
  await h.evaluate(async () => {
    const s = window.__danteGame.scene.getScene('Game'), { JOURNEY_FLAGS } = await import('/src/systems/LocalJourney.ts');
    s.progression.restore({ xp: 1000, echoes: ['northern-ruin', 'mineral-signal', 'unknown-trace'], sourceLocated: true,
      passageOpen: true, rewardedHollows: [], rewardedRoutes: [] });
    for (const id of ['saberArc', 'saberReach', 'dashCooldown', 'dashDuration', 'chargeWidth', 'chargePower']) while (s.progression.investUpgrade(id)) {}
    for (const flag of JOURNEY_FLAGS) s[flag] = true;
    s.area = 'valley'; s.scene.restart();
  });
  await h.waitForTimeout(900); await ready(h);
  await h.keyboard.press('Escape'); await h.locator('[data-shell="coop"]').click(); await h.locator('[data-shell="coop-create"]').click();
  await h.waitForFunction(() => window.__danteCoop.role === 'host'); const code = (await state(h)).code;
  await h.locator('[data-shell="coop-play"]').click();
  await g.goto('http://localhost:5184/?qa=play'); await ready(g); await g.keyboard.press('Escape'); await g.locator('[data-shell="coop"]').click();
  await g.locator('[name="coop-code"]').fill(code.toLowerCase().slice(0, 5) + ' ' + code.toLowerCase().slice(5));
  await g.evaluate(() => { window.initialWrite = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('QA save blocked'); }; });
  await g.locator('[data-shell="coop-join"]').click();
  assert.equal((await state(g)).role, 'offline'); assert.match(await g.locator('.shell-status').innerText(), /guardar sua jornada/);
  await g.evaluate(() => Storage.prototype.setItem = window.initialWrite); report.entryRequiresSoloBackup = true;
  await g.locator('[data-shell="coop-join"]').click(); await g.locator('[data-shell="play-character"]').click(); await g.waitForFunction(() => window.__danteCoop.role === 'guest');
  await g.waitForFunction(() => !document.querySelector('.application-shell[open]')); await arrive('valley');
  await h.keyboard.press('Escape');
  await g.waitForFunction(() => window.__danteCoop.hostPaused);
  await g.waitForFunction(() => /MENU/.test(window.__danteGame.scene.getScene('Game').party.status.text));
  assert.match(await g.evaluate(() => window.__danteGame.scene.getScene('Game').party.status.text), /MENU/);
  await h.locator('[data-shell="continue"]').click();
  await g.waitForFunction(() => !window.__danteCoop.hostPaused); report.hostMenuState = true;
  assert.equal((await g.evaluate(saved)).progression.xp, 15); report.noHistoricalXpCopied = true;
  assert.ok(Math.abs(await h.evaluate(() => {
    const s = window.__danteGame.scene.getScene('Game'), e = s.enemies[0]; return e.health.max / s.party.resilience.get(e);
  }) - 1.4) < .01); report.duoResilience = true;
  const gain = await kill(); assert.equal(gain, 15); await g.waitForTimeout(600);
  assert.equal((await g.evaluate(saved)).progression.xp, 30); assert.equal((await g.evaluate(saved)).progression.echoes.length, 0);
  const receipt = (await state(g)).receipt;
  await g.keyboard.down('q'); await h.waitForTimeout(300);
  assert.equal(await h.evaluate(() => window.__danteGame.scene.getScene('Game').party.partner.charge.phase), 'CHARGING');
  await reconnect(g); assert.equal((await state(g)).receipt, receipt); assert.equal((await state(g)).code, code);
  await g.keyboard.up('q'); await h.waitForTimeout(250);
  assert.equal(await h.evaluate(() => window.__danteGame.scene.getScene('Game').party.partner.charge.phase), 'READY');
  report.reconnectCancelsHeldSkill = true;
  await g.evaluate(() => { const r = window.__danteCoop; r.rewards.creditCoopXp(r.receipt, r.rewardTotal); r.rewards.creditCoopXp(r.receipt, r.rewardTotal); });
  assert.equal((await g.evaluate(saved)).progression.xp, 30); report.reconnectAndDuplicateRewardSafe = true;
  await reconnect(h); assert.equal((await state(h)).code, code); report.hostReconnected = true;
  // Storage failure retains the pending reward and retries without overwriting campaign state.
  await g.evaluate(() => { window.originalWrite = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('QA quota'); }; });
  await kill(); await g.waitForTimeout(350); assert.equal((await state(g)).saved, false);
  await g.evaluate(() => Storage.prototype.setItem = window.originalWrite); await g.waitForTimeout(500);
  assert.equal((await state(g)).saved, true); assert.equal((await g.evaluate(saved)).progression.xp, 45); report.failedStorageRetried = true;
  // Drop the host socket just before the travel request reaches the relay.
  // The client must recover the pending transition, not strand a faded scene.
  await h.evaluate(() => {
    const socket = window.__danteCoop.socket, send = socket.send.bind(socket);
    socket.send = data => { if (JSON.parse(data).type === 'travel') socket.close(); else send(data); };
  });
  await portal('guest', { x: 5050, y: 795 }, 'arid');
  await portal('host', { x: 315, y: 805 }, 'valley'); report.interruptedTravelRecovered = true;
  report.travels = [];
  for (let i = 0; i < 3; i++) {
    await portal('guest', { x: 5050, y: 795 }, 'arid');
    await portal('guest', { x: 4990, y: 805 }, 'dunes');
    await portal('host', { x: 320, y: 1090 }, 'arid');
    await portal('host', { x: 315, y: 805 }, 'valley');
    for (const p of [h, g]) assert.equal((await state(p)).code, code);
    report.travels.push({ host: await state(h), guest: await state(g) });
  }
  assert.ok(report.travels[2].host.objects <= report.travels[0].host.objects + 2);
  assert.ok(report.travels[2].guest.objects <= report.travels[0].guest.objects + 2); report.threeRoundTripsStable = true;
  await h.evaluate(() => Object.assign(window.__danteGame.scene.getScene('Game').player.position, { x: 370, y: 850 }));
  await key(h, 'e'); await arrive('warden'); assert.equal((await state(h)).code, code);
  await portal('guest', {x:1450,y:830}, 'valley'); report.bossPassageKeepsRoom = true;
  await h.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); s.player.die(); s.hud.showDeath(); });
  await g.waitForFunction(() => window.__danteGame.scene.getScene('Game').player.isDead); await key(g, 'r'); await arrive('valley');
  for (const p of [h, g]) await p.waitForFunction(() => !window.__danteGame.scene.getScene('Game').player.isDead);
  assert.equal((await state(h)).dead, false); assert.equal((await state(g)).dead, false); report.sharedRespawnKeepsRoom = true;
  report.viewports = [];
  for (const [width, height] of [[1280,720], [1366,768], [1920,1080], [844,390]]) {
    await g.setViewportSize({ width, height }); await g.waitForTimeout(400);
    await g.screenshot({ path: `${out}/duo-${width}.png` }); report.viewports.push({ width, height });
  }
  const samples = [];
  for (let i = 0; i < 12; i++) { await h.waitForTimeout(250); samples.push({ host: (await state(h)).fps, guest: (await state(g)).fps }); }
  report.fps = { host: samples.reduce((sum,s) => sum+s.host,0)/samples.length, guest: samples.reduce((sum,s) => sum+s.guest,0)/samples.length };
  const beforeLeave = await g.evaluate(saved);
  await g.evaluate(() => window.__danteCoop.disconnect()); await g.waitForTimeout(1100); await ready(g);
  assert.equal((await state(g)).xp, beforeLeave.progression.xp); assert.equal((await state(g)).area, 'forest');
  assert.equal((await g.evaluate(saved)).flags.wardenDefeated, false); report.personalProgressAndSoloCampaignAfterLeave = true;
  assert.ok(await h.evaluate(() => { const s = window.__danteGame.scene.getScene('Game'); return s.enemies.every(e => e.health.max === s.party.resilience.get(e)); }));
  report.soloResilienceRestored = true;
  await h.evaluate(() => window.__danteCoop.disconnect()); await h.waitForTimeout(300);
  report.relay = await (await fetch('http://localhost:5184/coop/health')).json();
  assert.equal(report.relay.rooms, 0); assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.failure = String(error); report.finalHost=await state(h);report.finalGuest=await state(g);
  await h.screenshot({ path: `${out}/failure-host.png` }); await g.screenshot({ path: `${out}/failure-guest.png` }); throw error;
} finally {
  await writeFile(`${out}/continuity.json`, JSON.stringify(report, null, 2)); await browser.close();
}
console.log(report);
