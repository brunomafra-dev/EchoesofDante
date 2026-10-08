import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Start exactly one service on a different port: no standalone relay is used.
const mode = process.argv[2] ?? 'dev';
assert.ok(['dev', 'preview', 'production'].includes(mode));
const port = 5188;
const base = `http://127.0.0.1:${port}`;
const out = `docs/regional-coop/easy-entry-qa/${mode}`;
await mkdir(out, { recursive: true });
const args = mode === 'production' ? ['server/web.mjs'] : ['node_modules/vite/bin/vite.js',
  ...(mode === 'preview' ? ['preview'] : []), '--host', '127.0.0.1', '--port', String(port), '--strictPort'];
const child = spawn(process.execPath, args, { windowsHide: true, env: { ...process.env, PORT: String(port) } });
let logs = '';
child.stdout.on('data', data => logs += data); child.stderr.on('data', data => logs += data);
const report = { mode, method: 'One web process, two independent Chrome contexts, real menu and WebSocket. No physical devices or public hosting.', errors: [] };
let browser;
try {
  for (let i = 0; ; i++) {
    try { assert.equal((await (await fetch(base + '/coop/health')).json()).service, 'Dante regional co-op'); break; }
    catch { if (i > 100 || child.exitCode !== null) throw Error('Single server failed: ' + logs); await new Promise(r => setTimeout(r, 100)); }
  }
  report.singleServiceStarted = true;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const hostContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const guestContext = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const h = await hostContext.newPage(), g = await guestContext.newPage();
  const sockets = [], messages = [];
  for (const page of [h, g]) {
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) report.errors.push(response.url()); });
    page.on('websocket', ws => {
      sockets.push(ws.url());
      ws.on('framereceived', event => { try { messages.push(JSON.parse(String(event.payload))); } catch { /* Vite HMR is not game traffic. */ } });
    });
    await page.goto(base);
    await page.locator('[data-shell="continue"]').click();
    await page.keyboard.press('Escape');
    await page.locator('[data-shell="coop"]').click();
    assert.equal(await page.locator('[name="coop-server"]').count(), 0);
  }
  await h.locator('[data-shell="coop-create"]').click();
  await h.locator('[data-shell="coop-copy"]').waitFor();
  const code = (await h.locator('.shell-status').innerText()).match(/SALA ([A-F0-9]{10})/)[1];
  await h.locator('[data-shell="coop-play"]').click();
  await g.locator('[name="coop-code"]').fill(code);
  await g.locator('[data-shell="coop-join"]').click();
  await g.locator('[data-shell="play-character"]').click();
  await g.waitForFunction(() => !document.querySelector('.application-shell[open]'));
  await g.waitForTimeout(1800);
  assert.ok(messages.some(m => m.type === 'joined' && m.role === 'guest'));
  assert.ok(messages.some(m => m.type === 'world'));
  assert.equal(sockets.filter(url => url.endsWith('/coop')).length, 2);
  assert.ok(sockets.filter(url => url.endsWith('/coop')).every(url => url === `ws://127.0.0.1:${port}/coop`));
  report.codeOnlyJoinSameOrigin = true;
  if (mode === 'dev') assert.ok(sockets.some(url => url.includes('token=')), 'Vite HMR connection remains available');
  await g.keyboard.down('d'); await g.waitForTimeout(400); await g.keyboard.up('d');
  await g.screenshot({ path: `${out}/visitor.png` });
  await h.keyboard.press('Escape'); await h.locator('[data-shell="coop"]').click();
  await h.screenshot({ path: `${out}/room.png` });
  for (let i = 0; i < 3; i++) {
    await h.locator('[data-shell="coop-leave"]').click();
    await g.waitForTimeout(500);
    assert.equal((await (await fetch(base + '/coop/health')).json()).rooms, 0);
    if (i < 2) { await h.locator('[data-shell="coop-create"]').click(); await h.locator('[data-shell="coop-copy"]').waitFor(); }
  }
  await h.waitForTimeout(300);
  report.finalRelay = await (await fetch(base + '/coop/health')).json();
  assert.equal(report.finalRelay.players, 0);
  report.threeRoomCyclesClean = true;
  // Connect the next attempt to an unavailable local port. This exercises an
  // actual browser socket error rather than a server-protocol rejection.
  await h.evaluate(() => {
    window.qaNativeSocket = window.WebSocket;
    window.WebSocket = class extends window.qaNativeSocket {
      constructor(url, protocols) { super(String(url).endsWith('/coop') ? 'ws://127.0.0.1:59998/coop' : url, protocols); }
    };
  });
  await h.locator('[data-shell="coop-create"]').click();
  await h.locator('[data-shell="coop-create"]:enabled').waitFor();
  assert.match(await h.locator('.shell-status').innerText(), /indisponível/);
  await h.evaluate(() => { window.WebSocket = window.qaNativeSocket; });
  await h.locator('[data-shell="coop-create"]').click();
  await h.locator('[data-shell="coop-copy"]').waitFor();
  await h.locator('[data-shell="coop-leave"]').click();
  report.retryAfterFailure = true;
  await h.locator('[data-shell="back"]').click(); await h.locator('[data-shell="continue"]').click();
  assert.equal(await h.locator('dialog[open]').count(), 0);
  report.failureKeepsSoloAvailable = true;
  assert.deepEqual(report.errors, []); report.passed = true;
} catch (error) {
  report.failure = String(error); report.serverLog = logs;
  report.pages = await Promise.all((browser?.contexts() ?? []).flatMap(c => c.pages()).map(p => p.evaluate(() => ({
    role: window.__danteCoop?.role, message: window.__danteCoop?.message, token: !!window.__danteCoop?.token,
    status: document.querySelector('.shell-status')?.textContent,
    createDisabled: document.querySelector('[data-shell="coop-create"]')?.disabled,
  }))));
  throw error;
}
finally {
  await browser?.close();
  child.kill();
  await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve); });
  await writeFile(`${out}/result.json`, JSON.stringify(report, null, 2));
}
console.log(report);
