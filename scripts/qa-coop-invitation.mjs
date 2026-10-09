import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const mode = process.argv[2] ?? 'production';
assert.ok(['dev', 'production'].includes(mode));
const port = 5188, base = `http://127.0.0.1:${port}`;
const out = process.argv[3] ?? `docs/regional-coop/invitation-qa/${mode}`;
await mkdir(out, { recursive: true });
const args = mode === 'production' ? ['server/web.mjs'] : ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'];
const child = spawn(process.execPath, args, { windowsHide: true, env: { ...process.env, PORT: String(port) } });
let log = ''; child.stdout.on('data', b => log += b); child.stderr.on('data', b => log += b);
const report = { mode, method: 'Independent Chrome profiles, real integrated server, actual invite URLs and menus; clipboard fallback simulated. Touch viewport only, no physical devices or public internet.', errors: [] };
let browser;
const noMenu = p => p.waitForFunction(() => !document.querySelector('.application-shell[open]'));
const health = async () => (await fetch(base + '/coop/health')).json();
const openRoomMenu = async p => { await p.keyboard.press('Escape'); await p.locator('[data-shell="coop"]').click(); };
try {
  for (let i = 0; ; i++) {
    try { assert.equal((await health()).service, 'Dante regional co-op'); break; }
    catch { if (i > 100 || child.exitCode !== null) throw Error(log); await new Promise(r => setTimeout(r, 100)); }
  }
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const hc = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const gc = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  await gc.addInitScript(() => {
    if (localStorage.getItem('qa-picker')) return;
    localStorage.setItem('qa-picker', '1');
    localStorage.setItem('echoes-of-dante.characters.v1', JSON.stringify({ schema: 1, selected: 'visitor-warrior', characters: [
      { id: 'visitor-warrior', name: 'Warrior salvo', classId: 'warrior', createdAt: 1 },
      { id: 'visitor-hunter', name: 'Hunter escolhida', classId: 'hunter', createdAt: 2 },
    ] }));
    for (const [id, xp] of [['visitor-warrior', 10], ['visitor-hunter', 45]]) localStorage.setItem(`echoes-of-dante.journey.v1.character.${id}`, JSON.stringify({
      schema: 1, updatedAt: 1, area: 'forest', hp: 80, flags: {}, bestiary: {}, valleyRoutes: [], valleyHabitats: [], aridHabitats: [],
      progression: { xp, echoes: [], sourceLocated: false, passageOpen: false, rewardedHollows: [], rewardedRoutes: [] },
    }));
  });
  const tc = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const h = await hc.newPage(), g = await gc.newPage(), third = await tc.newPage();
  for (const p of [h, g, third]) p.setDefaultNavigationTimeout(90000);
  const worlds = [], joined = [];
  for (const p of [h, g, third]) {
    p.on('pageerror', e => report.errors.push(e.message));
    p.on('response', r => { if (r.status() >= 400) report.errors.push(r.url()); });
    p.on('websocket', ws => ws.on('framereceived', event => {
      try { const m = JSON.parse(String(event.payload)); if (m.type === 'world') worlds.push(m); if (m.type === 'joined') joined.push(m.role); } catch { /* Not gameplay traffic. */ }
    }));
  }
  // Host creates directly from the start menu: no need to enter solo gameplay.
  await h.goto(base); await h.locator('[data-shell="coop"]').click();
  await h.locator('[data-shell="coop-create"]').click();
  await h.locator('[name="coop-invite"]').waitFor();
  const link = await h.locator('[name="coop-invite"]').inputValue();
  const url = new URL(link), code = url.searchParams.get('sala');
  assert.match(code, /^[A-F0-9]{10}$/);
  assert.equal(url.origin, base); assert.equal(url.pathname, '/');
  assert.deepEqual([...url.searchParams.keys()], ['sala']); assert.equal(url.hash, '');
  await h.screenshot({ path: `${out}/invite.png` });
  await hc.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  await h.locator('[data-shell="coop-copy"]').click();
  await h.locator('.shell-status').filter({ hasText: 'Link copiado' }).waitFor();
  assert.equal(await h.evaluate(() => navigator.clipboard.readText()), link);
  report.createAndCopyInviteFromHome = true;
  // No connection before choosing, even with an active character. Switching
  // the preview does not select a save until the explicit confirmation.
  await g.goto(link); await g.locator('[data-shell="play-character"]').waitFor();
  assert.equal((await health()).players, 1);
  await g.locator('[data-shell="character-visitor-hunter"]').click();
  assert.equal(await g.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).selected), 'visitor-warrior');
  await g.screenshot({ path: `${out}/choose-character-844.png` });
  await g.locator('[data-shell="play-character"]').click();
  await g.waitForURL(url => !url.searchParams.has('sala')); await noMenu(g); await noMenu(h);
  assert.equal(await g.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).selected), 'visitor-hunter');
  report.characterChoiceBeforeJoining = true;
  await g.waitForTimeout(900);
  assert.ok(joined.includes('guest')); assert.ok(worlds.length > 0);
  assert.equal(new URL(g.url()).searchParams.has('sala'), false);
  report.confirmCharacterJoinsAndStartsBoth = true;
  await g.screenshot({ path: `${out}/friend-844.png` });
  // A third person receives an understandable rejection instead of retry loops.
  await third.goto(link); await third.locator('[data-shell="back"]').click();
  assert.equal(new URL(third.url()).searchParams.has('sala'), false);
  assert.equal((await health()).players, 2); report.cancelChoiceDoesNotJoin = true;
  await third.goto(link); await third.locator('[data-shell="play-character"]').click();
  await third.locator('[data-shell="coop-join"]:enabled').waitFor();
  assert.match(await third.locator('.shell-status').innerText(), /duas pessoas/);
  report.fullRoomHandled = true;
  await openRoomMenu(g); await g.locator('[data-shell="coop-leave"]').click();
  await g.locator('[data-shell="continue"]').waitFor();
  assert.equal((await health()).rooms, 1);
  assert.equal((await health()).players, 1);
  assert.equal(new URL(g.url()).searchParams.has('sala'), false);
  report.leaveDoesNotRejoin = true;
  // Expired link stays on a useful menu; pasting a valid invitation retries.
  await third.goto(base + '/?sala=FFFFFFFFFF');
  await third.locator('[data-shell="play-character"]').click();
  await third.locator('[data-shell="coop-join"]:enabled').waitFor();
  assert.match(await third.locator('.shell-status').innerText(), /Sala não encontrada/);
  await third.locator('[name="coop-code"]').fill(link);
  await third.locator('[data-shell="coop-join"]').click(); await third.locator('[data-shell="play-character"]').click(); await noMenu(third);
  report.expiredInviteAndPasteLinkRetry = true;
  await openRoomMenu(third); await third.locator('[data-shell="coop-leave"]').click();
  await third.locator('[data-shell="continue"]').waitFor();
  await third.goto(base + '/?sala=' + encodeURIComponent('<img onerror=alert(1)>'));
  await third.locator('.shell-status').filter({ hasText: 'convite está incompleto' }).waitFor();
  assert.equal((await health()).players, 1); report.invalidInviteDoesNotConnect = true;
  await tc.close();
  // A player with no characters creates one; the invite survives the reload.
  const empty = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await empty.addInitScript(() => {
    if (localStorage.getItem('qa-empty')) return;
    localStorage.setItem('qa-empty', '1');
    localStorage.setItem('echoes-of-dante.characters.v1', JSON.stringify({ schema: 1, selected: '', characters: [] }));
  });
  const newcomer = await empty.newPage();
  newcomer.on('pageerror', e => report.errors.push(e.message));
  newcomer.on('response', r => { if (r.status() >= 400) report.errors.push(r.url()); });
  await newcomer.goto(link);
  await newcomer.locator('[data-class="hunter"]').click();
  await newcomer.locator('[name="character-name"]').fill('Amiga convidada');
  await newcomer.locator('[data-shell="create"]').click(); await newcomer.waitForURL(url => !url.searchParams.has('sala')); await noMenu(newcomer);
  assert.equal(new URL(newcomer.url()).searchParams.has('sala'), false);
  const hero = await newcomer.evaluate(() => {
    const profiles = JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1'));
    return profiles.characters.find(c => c.id === profiles.selected);
  });
  assert.equal(hero.name, 'Amiga convidada'); assert.equal(hero.classId, 'hunter');
  report.newCharacterPreservesInvite = true;
  await openRoomMenu(newcomer); await newcomer.locator('[data-shell="coop-leave"]').click();
  await newcomer.locator('[data-shell="continue"]').waitFor(); await empty.close();
  // Return with the now-active Hunter and exercise host departure. With DEV,
  // block XP storage during a real kill so the solo action must safely retry.
  await g.goto(link); await g.locator('[data-shell="play-character"]').click(); await noMenu(g);
  if (mode === 'dev') {
    await h.evaluate(() => window.__danteCoop.socket.close());
    await h.waitForFunction(() => !window.__danteCoop.connected);
    await h.waitForFunction(() => window.__danteCoop.connected);
    await g.waitForFunction(() => window.__danteCoop.peerConnected);
    assert.equal(await g.locator('[data-shell="coop-solo"]').count(), 0);
    report.temporaryHostDisconnectRecoversWithoutEndMenu = true;
    await g.evaluate(() => { window.qaWrite = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('QA quota'); }; });
    await h.evaluate(() => {
      const s = window.__danteGame.scene.getScene('Game'), e = s.enemies.find(e => !e.isDead);
      if (!e) throw Error('No XP target');
      s.resolvePlayerHits(s.time.now, [e], 9999, 0, 0x5fe6d8, s.player.position, false);
    });
    await g.waitForFunction(() => !window.__danteCoop.rewardSaved && window.__danteCoop.personalXpGained > 0);
  }
  // Manual copy remains usable when clipboard permission is unavailable.
  await openRoomMenu(h);
  await h.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: () => Promise.reject(Error('permission denied')) },
  }));
  await h.locator('[data-shell="coop-copy"]').click();
  await h.locator('.shell-status').filter({ hasText: 'Convite selecionado' }).waitFor();
  assert.equal(await h.locator('[name="coop-invite"]').evaluate(e => e.selectionEnd - e.selectionStart), link.length);
  report.clipboardFallbackSelectsLink = true;
  await h.locator('[data-shell="coop-leave"]').click();
  await g.locator('[data-shell="coop-solo"]').waitFor();
  assert.match(await g.locator('.shell-content').innerText(), /dono da sala saiu do jogo/);
  await g.keyboard.press('Escape'); assert.equal(await g.locator('[data-shell="coop-solo"]').isVisible(), true);
  await g.screenshot({ path: `${out}/host-left-844.png` });
  if (mode === 'dev') {
    await g.locator('[data-shell="coop-solo"]').click();
    assert.equal(await g.locator('[data-shell="coop-solo"]').isVisible(), true);
    assert.equal(await g.evaluate(() => window.__danteCoop.role), 'guest');
    await g.evaluate(() => Storage.prototype.setItem = window.qaWrite);
    report.pendingXpBlocksExitUntilSaved = true;
  }
  const personal = await g.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.visitor-hunter')));
  const pendingXp = mode === 'dev' ? await g.evaluate(() => window.__danteCoop.rewardSaved ? 0 : window.__danteCoop.personalXpGained) : 0;
  await g.locator('[data-shell="coop-solo"]').click(); await noMenu(g);
  const solo = await g.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.visitor-hunter')));
  assert.ok(solo.progression.xp >= personal.progression.xp);
  if (mode === 'dev') assert.equal(solo.progression.xp, personal.progression.xp + pendingXp);
  assert.equal(solo.area, 'forest'); assert.equal(solo.progression.echoes.length, 0);
  assert.equal(await g.evaluate(() => JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.visitor-warrior')).progression.xp), 10);
  report.hostDepartureMenuAndOwnSolo = true;
  // Cancel before configuration responds: the delayed result must not create a
  // room behind the menu. Consecutive clicks must still create just one room.
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await h.route('**/api/coop-config', async route => { await gate; await route.continue(); });
  await h.locator('[data-shell="coop-create"]').click();
  await h.locator('[data-shell="back"]').click(); release();
  await h.waitForTimeout(350); assert.equal((await health()).rooms, 0);
  await h.unroute('**/api/coop-config');
  await h.locator('[data-shell="coop"]').click();
  await h.locator('[data-shell="coop-create"]').evaluate(el => { el.click(); el.click(); });
  await h.locator('[name="coop-invite"]').waitFor(); assert.equal((await health()).rooms, 1);
  await h.locator('[data-shell="coop-leave"]').click();
  report.cancelAndDoubleClickSafe = true;
  // Closing the host tab uses the existing reconnection grace, then presents
  // the same clear menu instead of leaving the guest frozen in the world.
  await h.locator('[data-shell="coop-create"]').click(); await h.locator('[name="coop-invite"]').waitFor();
  const closingLink = await h.locator('[name="coop-invite"]').inputValue();
  await g.goto(closingLink); await g.locator('[data-shell="play-character"]').click(); await noMenu(g); await noMenu(h);
  await h.close();
  await g.waitForTimeout(800); assert.equal(await g.locator('[data-shell="coop-solo"]').count(), 0);
  await g.locator('[data-shell="coop-home"]').waitFor({ timeout: 30000 });
  await g.locator('[data-shell="coop-home"]').click(); await g.locator('[data-shell="continue"]').waitFor();
  report.hostTabClosedAfterReconnectGrace = true;
  await g.waitForTimeout(300); report.relay = await health();
  assert.equal(report.relay.rooms, 0); assert.equal(report.relay.players, 0);
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) { report.failure = String(error); report.serverLog = log; throw error; }
finally {
  await browser?.close(); child.kill();
  await new Promise(resolve => { if (child.exitCode !== null || child.signalCode !== null) resolve(); else child.once('exit', resolve); });
  await writeFile(`${out}/result.json`, JSON.stringify(report, null, 2));
}
console.log(report);
