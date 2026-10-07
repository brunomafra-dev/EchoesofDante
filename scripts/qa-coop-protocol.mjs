import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import WebSocket from 'ws';

const url = process.argv[2] ?? 'ws://localhost:5190';
const clients = [];
const report = { errors: [], method: 'Real Node WebSocket clients against the local relay' };
async function client() {
  const ws = new WebSocket(url), inbox = [];
  ws.on('message', raw => inbox.push(JSON.parse(raw.toString())));
  await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  const c = {
    ws, inbox,
    send: m => ws.send(JSON.stringify(m)),
    next: async type => {
      const end = Date.now() + 2000;
      while (Date.now() < end) {
        const index = inbox.findIndex(m => m.type === type);
        if (index >= 0) return inbox.splice(index, 1)[0];
        await new Promise(resolve => setTimeout(resolve, 15));
      }
      throw new Error(`No ${type} response`);
    },
  };
  clients.push(c); return c;
}
const profile = { name: 'QA protocolo', classId: 'warrior' };
try {
  const host = await client(), visitor = await client(), third = await client();
  host.send({ type: 'create', profile, area: 'warden' });
  assert.match((await host.next('error')).message, /solo/); report.bossRegionsRejected = true;
  host.send({ type: 'create', profile: { ...profile, classId: 'invalid' }, area: 'forest' });
  assert.match((await host.next('error')).message, /inválido/); report.invalidClassRejected = true;
  host.send({ type: 'create', profile, area: 'forest' }); const room = await host.next('joined');
  visitor.send({ type: 'join', profile, code: room.code }); await visitor.next('joined'); await host.next('peer');
  third.send({ type: 'join', profile, code: room.code }); assert.match((await third.next('error')).message, /duas pessoas/); report.fullRoomRejected = true;
  visitor.send({ type: 'input', input: { x: 30, y: 40, aim: 45, attack: true, dash: 'true' } });
  const { input } = await host.next('input'); assert.equal(input.x, .6); assert.equal(input.y, .8);
  assert.ok(Math.abs(input.aim) <= Math.PI); assert.equal(input.attack, true); assert.equal(input.dash, false); report.inputNormalized = true;
  visitor.send({ type: 'world', world: { area: 'forest', enemies: [] } });
  host.send({ type: 'input', input: { x: 1, y: 0, aim: 0 } });
  host.send({ type: 'world', world: { area: 'frost', enemies: [] } });
  visitor.send({ type: 'input', input: { x: null, y: 1, aim: 0 } });
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.ok(!host.inbox.some(m => m.type === 'world' || m.type === 'input'));
  assert.ok(!visitor.inbox.some(m => m.type === 'world' || m.type === 'input')); report.authorityAndRegionEnforced = true;
  host.send({ type: 'world', world: { area: 'forest', enemies: [], time: 20 } });
  assert.equal((await visitor.next('world')).world.time, 20); report.hostWorldRelayed = true;
  visitor.send({ type: 'leave' }); await host.next('peer-left');
  third.send({ type: 'join', profile, code: room.code }); await third.next('joined'); await host.next('peer'); report.guestSlotReusable = true;
  host.send({ type: 'leave' }); await third.next('ended'); report.hostEndBroadcast = true;
  host.ws.send('broken JSON'); assert.match((await host.next('error')).message, /inválida/); report.badJsonHandled = true;
  report.passed = true;
} finally {
  for (const c of clients) c.ws.close();
  await mkdir('docs/regional-coop/qa', { recursive: true });
  await writeFile('docs/regional-coop/qa/protocol.json', JSON.stringify(report, null, 2));
}
console.log(report);
