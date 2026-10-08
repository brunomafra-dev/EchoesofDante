import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import WebSocket from 'ws';
import handler, { PUBLIC_RELAY } from '../api/coop-config.js';
import { coopConfig } from '../server/coop-config.mjs';

const out = 'docs/regional-coop/invitation-qa/config';
await mkdir(out, { recursive: true });
const report = { method: 'Real HTTP Vercel handler in Node + standalone relay with platform PORT and production origin policy. Local only.' };
const previous = process.env.COOP_RELAY_URL;
const server = createServer(coopConfig); await new Promise(r => server.listen(0, '127.0.0.1', r));
const published = createServer(handler); await new Promise(r => published.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const publicBase = `http://127.0.0.1:${published.address().port}`;
let child; const clients = [];
try {
  delete process.env.COOP_RELAY_URL;
  let response = await fetch(base);
  assert.equal(response.status, 503); assert.equal((await response.json()).ready, false);
  assert.equal(response.headers.get('cache-control'), 'no-store'); report.unconfiguredIsExplicit = true;
  response = await fetch(publicBase); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ready: true, relay: PUBLIC_RELAY });
  report.publishedDefaultWithoutOwnerEnvironmentStep = true;
  process.env.COOP_RELAY_URL = 'wss://rooms.example.com/coop';
  response = await fetch(base); assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ready: true, relay: 'wss://rooms.example.com/coop' });
  assert.equal((await (await fetch(publicBase)).json()).relay, 'wss://rooms.example.com/coop');
  assert.equal(await (await fetch(base, { method: 'HEAD' })).text(), '');
  assert.equal((await fetch(base, { method: 'POST' })).status, 405); report.configuredEndpointAndMethods = true;
  for (const url of ['ws://insecure.example/coop', 'wss://user:secret@example/coop', 'https://example.com', 'bad-url']) {
    process.env.COOP_RELAY_URL = url; assert.equal((await fetch(base)).status, 503);
    assert.equal((await fetch(publicBase)).status, 503);
  }
  report.invalidConfigurationRejected = true;
  child = spawn(process.execPath, ['server/coop.mjs'], { windowsHide: true, stdio: 'ignore', env: {
    ...process.env, PORT: '5195', COOP_PORT: '5196', COOP_ORIGINS: 'https://echosofdante.vercel.app',
  } });
  for (let i = 0; ; i++) {
    try { assert.equal((await (await fetch('http://127.0.0.1:5195/coop/health')).json()).service, 'Dante regional co-op'); break; }
    catch { if (i > 50 || child.exitCode !== null) throw Error('Relay did not use PORT'); await new Promise(r => setTimeout(r, 100)); }
  }
  const connect = async origin => {
    const ws = new WebSocket('ws://127.0.0.1:5195/coop', { origin }); clients.push(ws);
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
    return ws;
  };
  await assert.rejects(connect('https://unrelated.example.com'), /401/);
  const host = await connect('https://echosofdante.vercel.app');
  const created = new Promise(r => host.once('message', raw => r(JSON.parse(raw))));
  host.send(JSON.stringify({ type: 'create', area: 'forest', profile: { name: 'Anfitriao', classId: 'warrior' } }));
  const room = await created; assert.equal(room.type, 'joined');
  const guest = await connect('https://echosofdante.vercel.app');
  const joined = new Promise(r => guest.once('message', raw => r(JSON.parse(raw))));
  guest.send(JSON.stringify({ type: 'join', code: room.code, profile: { name: 'Amigo', classId: 'hunter' } }));
  assert.equal((await joined).role, 'guest'); report.platformPortAndPublishedOriginAccepted = true;
  report.otherOriginRejected = true;
  const ended = new Promise(r => guest.once('message', raw => r(JSON.parse(raw))));
  host.send(JSON.stringify({ type: 'leave' })); assert.equal((await ended).type, 'ended');
  report.passed = true;
} finally {
  if (previous === undefined) delete process.env.COOP_RELAY_URL; else process.env.COOP_RELAY_URL = previous;
  for (const ws of clients) ws.close();
  if (child) {
    child.kill();
    await new Promise(r => { if (child.exitCode !== null || child.signalCode !== null) r(); else child.once('exit', r); });
  }
  await new Promise(r => server.close(r));
  await new Promise(r => published.close(r));
  await writeFile(`${out}/result.json`, JSON.stringify(report, null, 2));
}
console.log(report);
