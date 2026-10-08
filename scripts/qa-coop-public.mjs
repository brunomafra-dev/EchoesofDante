import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'https://echosofdante.vercel.app/';
const healthURL = 'https://echoes-of-dante-rooms.onrender.com/coop/health';
const out = process.argv[2] ?? 'docs/regional-coop/public-qa';
await mkdir(out, { recursive: true });
const report = { at: new Date().toISOString(), game: base,
  method: 'Independent Chrome profiles from this PC against the published Vercel game and Render WSS service. No API mocks, no physical mobile device or second physical network.', errors: [] };
let browser, host, guest;
try {
  const response = await fetch(new URL('api/coop-config', base), { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200);
  const config = await response.json();
  assert.equal(config.ready, true);
  assert.equal(config.relay, 'wss://echoes-of-dante-rooms.onrender.com/coop');
  report.configuration = config;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const hc = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const gc = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  host = await hc.newPage(); guest = await gc.newPage();
  let latestWorld, worldCount = 0;
  const roles = [], sockets = [];
  for (const page of [host, guest]) {
    page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(60000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('response', r => { if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`); });
    page.on('websocket', ws => {
      sockets.push(ws.url());
      ws.on('framereceived', event => {
        try {
          const message = JSON.parse(String(event.payload));
          if (message.type === 'joined') roles.push(message.role);
          if (message.type === 'world') { latestWorld = message.world; worldCount++; }
        } catch { /* Non-game messages do not affect the test. */ }
      });
    });
  }
  await host.goto(base, { waitUntil: 'domcontentloaded' });
  await host.locator('[data-shell="coop"]:enabled').click();
  await host.locator('[data-shell="coop-create"]:enabled').click();
  await host.locator('[name="coop-invite"]').waitFor();
  const link = await host.locator('[name="coop-invite"]').inputValue();
  assert.equal(new URL(link).origin, new URL(base).origin);
  assert.deepEqual([...new URL(link).searchParams.keys()], ['sala']);
  report.createRoom = true;
  await host.screenshot({ path: `${out}/public-invite.png` });
  await guest.goto(link, { waitUntil: 'domcontentloaded' });
  await guest.locator('[data-shell="play-character"]').waitFor();
  assert.ok(new URL(guest.url()).searchParams.has('sala'));
  assert.ok(!roles.includes('guest'), 'Connected without character confirmation');
  await guest.screenshot({ path: `${out}/public-character-choice.png` });
  await guest.locator('[data-shell="play-character"]').click();
  report.characterChosenBeforeJoining = true;
  await guest.waitForURL(url => !url.searchParams.has('sala'));
  const noMenu = page => page.waitForFunction(() => !document.querySelector('.application-shell[open]'));
  await noMenu(host); await noMenu(guest);
  for (let i = 0; !latestWorld; i++) {
    assert.ok(i < 100, 'No shared world received'); await guest.waitForTimeout(100);
  }
  assert.ok(roles.includes('host') && roles.includes('guest'));
  assert.equal(latestWorld.area, 'forest');
  assert.ok(latestWorld.partner);
  await host.bringToFront();
  await host.waitForTimeout(600);
  const before = { x: latestWorld.host.x, y: latestWorld.host.y };
  await host.keyboard.down('KeyD');
  try {
    for (let i = 0; i < 20 && latestWorld.host.x <= before.x + 5; i++) await host.waitForTimeout(100);
  } finally { await host.keyboard.up('KeyD'); }
  report.movement = { before, after: { x: latestWorld.host.x, y: latestWorld.host.y }, dead: latestWorld.host.dead };
  assert.ok(latestWorld.host.x > before.x + 5, 'Host movement did not reach guest');
  report.invitationStartsBoth = true; report.realWorldAndMovement = true;
  report.worldMessages = worldCount;
  assert.ok(sockets.includes(config.relay)); report.publicWss = true;
  await guest.screenshot({ path: `${out}/public-duo-844.png` });
  await guest.keyboard.press('Escape'); await guest.locator('[data-shell="coop"]').click();
  await guest.locator('[data-shell="coop-leave"]').click();
  await guest.locator('[data-shell="continue"]').waitFor(); report.guestRestoresSolo = true;
  await guest.goto(link, { waitUntil: 'domcontentloaded' });
  await guest.locator('[data-shell="play-character"]').click(); await noMenu(guest);
  await host.keyboard.press('Escape'); await host.locator('[data-shell="coop"]').click();
  await host.locator('[data-shell="coop-leave"]').click(); report.hostEndsRoom = true;
  await guest.locator('[data-shell="coop-solo"]').waitFor();
  assert.match(await guest.locator('.shell-content').innerText(), /dono da sala saiu do jogo/);
  await guest.screenshot({ path: `${out}/public-host-left.png` });
  await guest.locator('[data-shell="coop-solo"]').click(); await noMenu(guest);
  report.hostDepartureMenuAndSolo = true;
  report.serviceAfter = await (await fetch(healthURL, { signal: AbortSignal.timeout(15000) })).json();
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) { report.failure = String(error); throw error; }
finally {
  // Close this test's room even if an assertion failed; no other room is touched.
  if (host && !host.isClosed()) {
    try {
      if (!await host.locator('[data-shell="coop-leave"]').count()) {
        if (!await host.locator('.application-shell[open]').count()) await host.keyboard.press('Escape');
        if (await host.locator('[data-shell="coop"]').count()) await host.locator('[data-shell="coop"]').click({ timeout: 2000 });
      }
      if (await host.locator('[data-shell="coop-leave"]').count()) await host.locator('[data-shell="coop-leave"]').click({ timeout: 2000 });
    } catch { /* Closing the transport also expires the test's reserved seat. */ }
  }
  await browser?.close();
  if (report.passed) {
    // The public proxy's WebSocket close handshake may finish after Chrome exits.
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      report.serviceAfter = await (await fetch(healthURL, { cache: 'no-store', signal: AbortSignal.timeout(15000) })).json();
      if (report.serviceAfter.players === 0) break;
    }
    report.cleanupCheckedAt = new Date().toISOString();
  }
  await writeFile(`${out}/result.json`, JSON.stringify(report, null, 2));
}
console.log(report);
