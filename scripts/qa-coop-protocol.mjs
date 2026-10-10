import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import WebSocket from 'ws';

const url = process.argv[2] ?? 'ws://localhost:5184/coop';
const out = process.argv[3] ?? 'docs/regional-coop/continuity-qa';
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
  host.send({ type: 'create', profile, area: 'unknown' });
  assert.match((await host.next('error')).message, /desconhecida/); report.unknownRegionsRejected = true;
  host.send({ type: 'create', profile: { ...profile, classId: 'invalid' }, area: 'forest' });
  assert.match((await host.next('error')).message, /inválido/); report.invalidClassRejected = true;
  host.send({ type: 'create', profile, area: 'forest' }); const room = await host.next('joined');
  visitor.send({ type: 'join', profile, code: room.code }); await visitor.next('joined'); await host.next('peer');
  third.send({ type: 'join', profile, code: room.code }); assert.match((await third.next('error')).message, /duas pessoas/); report.fullRoomRejected = true;
  visitor.send({ type: 'input', epoch: 0, input: { x: 30, y: 40, aim: 45, attack: true, dash: 'true' } });
  const { input } = await host.next('input'); assert.equal(input.x, .6); assert.equal(input.y, .8);
  assert.ok(Math.abs(input.aim) <= Math.PI); assert.equal(input.attack, true); assert.equal(input.dash, false); report.inputNormalized = true;
  visitor.send({ type: 'world', epoch: 0, sequence: 1, world: { area: 'forest', enemies: [] } });
  host.send({ type: 'input', epoch: 0, input: { x: 1, y: 0, aim: 0 } });
  host.send({ type: 'world', epoch: 0, sequence: 1, world: { area: 'frost', enemies: [] } });
  visitor.send({ type: 'input', epoch: 0, input: { x: null, y: 1, aim: 0 } });
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.ok(!host.inbox.some(m => m.type === 'world' || m.type === 'input'));
  assert.ok(!visitor.inbox.some(m => m.type === 'world' || m.type === 'input')); report.authorityAndRegionEnforced = true;
  host.send({ type: 'world', epoch: 0, sequence: 1, world: { area: 'forest', enemies: [], time: 20, progression: {xp: 100} } });
  assert.equal((await visitor.next('world')).world.time, 20); report.hostWorldRelayed = true;
  visitor.send({ type: 'leave' }); await host.next('peer-left');
  third.send({ type: 'join', profile, code: room.code }); await third.next('joined'); await host.next('peer'); report.guestSlotReusable = true;
  host.send({ type: 'leave' }); await third.next('ended'); report.hostEndBroadcast = true;
  host.ws.send('broken JSON'); assert.match((await host.next('error')).message, /inválida/); report.badJsonHandled = true;
  // Continuous outdoor travel, stale packet rejection and cumulative reward receipts.
  const h = await client(), g = await client();
  h.send({type:'create',profile,area:'valley'});const created=await h.next('joined');
  g.send({type:'join',profile,code:created.code.toLowerCase()});const guest=await g.next('joined');await h.next('peer');
  const world=(xp,area='valley')=>({area,enemies:[],progression:{xp}});
  h.send({type:'world',epoch:0,sequence:1,world:world(1000)});assert.equal((await g.next('world')).total,0);
  h.send({type:'world',epoch:0,sequence:2,world:world(1015)});const reward=await g.next('world');assert.equal(reward.total,15);
  h.send({type:'world',epoch:0,sequence:2,world:world(1030)});await new Promise(r=>setTimeout(r,80));assert.ok(!g.inbox.some(m=>m.type==='world'));
  g.send({type:'travel',area:'arid',epoch:0});await new Promise(r=>setTimeout(r,80));assert.ok(!h.inbox.some(m=>m.type==='travel'));
  h.send({type:'travel',area:'frost',epoch:0});assert.match((await h.next('error')).message,/conectada/);
  h.send({type:'travel',area:'arid',epoch:0});assert.equal((await h.next('travel')).epoch,1);assert.equal((await g.next('travel')).area,'arid');
  h.send({type:'world',epoch:0,sequence:3,world:world(1030,'arid')});
  g.send({type:'input',epoch:0,input:{x:1,y:0,aim:0}});await new Promise(r=>setTimeout(r,80));assert.ok(!h.inbox.some(m=>m.type==='input'));
  h.send({type:'world',epoch:1,sequence:4,world:world(1030,'arid')});assert.equal((await g.next('world')).total,30);
  g.ws.close();await h.next('peer-offline');
  third.send({type:'join',profile,code:created.code});assert.match((await third.next('error')).message,/duas pessoas/);
  h.send({type:'world',epoch:1,sequence:5,world:world(1050,'arid')});await new Promise(r=>setTimeout(r,80));
  const resumed=await client();resumed.send({type:'resume',code:created.code,token:guest.token});const recovery=await resumed.next('joined');await h.next('peer');
  assert.equal(recovery.total,30);assert.equal(recovery.receipt,reward.receipt);assert.equal(recovery.epoch,1);
  h.send({type:'world',epoch:1,sequence:6,world:world(1065,'arid')});assert.equal((await resumed.next('world')).total,45);
  h.ws.close();await resumed.next('peer-offline');
  const recoveredHost=await client();recoveredHost.send({type:'resume',code:created.code,token:created.token});await recoveredHost.next('joined');await resumed.next('peer');
  recoveredHost.send({type:'travel',area:'dunes',epoch:1});await recoveredHost.next('travel');await resumed.next('travel');
  recoveredHost.send({type:'world',epoch:2,sequence:7,world:world(1080,'dunes')});assert.equal((await resumed.next('world')).total,60);
  const bad=await client();bad.send({type:'resume',code:created.code});assert.match((await bad.next('error')).message,/inválida/);
  bad.send({type:'resume',code:created.code,token:'a'.repeat(48)});assert.match((await bad.next('error')).message,/recuperar/);
  // Resume may replace a stale socket that has not yet failed its heartbeat.
  const switched=await client();switched.send({type:'resume',code:created.code,token:created.token});await switched.next('joined');await recoveredHost.next('replaced');await resumed.next('peer');
  switched.send({type:'pause',paused:true});assert.equal((await resumed.next('pause')).paused,true);
  switched.send({type:'leave'});await resumed.next('ended');report.staleTransportReplacement=true;
  const eh=await client(),eg=await client();eh.send({type:'create',profile,area:'forest'});const er=await eh.next('joined');
  eg.send({type:'join',profile,code:er.code});await eg.next('joined');await eh.next('peer');eg.ws.close();await eh.next('peer-offline');
  // Keep the host's ws ping/pong running while the guest reservation expires.
  await new Promise(r=>setTimeout(r,20500));await eh.next('peer-left');
  bad.send({type:'join',profile,code:er.code});await bad.next('joined');await eh.next('peer');
  eh.send({type:'leave'});await bad.next('ended');report.reservationExpires=true;
  const campaign=await client();
  for(const area of ['forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest']){
    campaign.send({type:'create',profile,area});const joined=await campaign.next('joined');assert.equal(joined.area,area);assert.equal(joined.protocol,4);campaign.send({type:'leave'});await new Promise(resolve=>setTimeout(resolve,30));
  }
  report.allCampaignRegionsAccepted=true;
  const lh=await client(),lg=await client();lh.send({type:'create',profile,area:'icenest'});const lr=await lh.next('joined');
  lg.send({type:'join',profile,code:lr.code});await lg.next('joined');await lh.next('peer');
  const lootWorld={area:'icenest',enemies:[],progression:{xp:1000},lootAwarded:[{uid:'qa-glacier-focus',id:'glacier-focus'},{uid:'qa-bad',id:'invalid'}]};
  lh.send({type:'world',epoch:0,sequence:1,world:lootWorld});const item=await lg.next('world');assert.equal(item.total,0);assert.deepEqual(item.items,[{uid:'qa-glacier-focus',id:'glacier-focus'}]);
  lh.send({type:'world',epoch:0,sequence:2,world:lootWorld});assert.deepEqual((await lg.next('world')).items,[{uid:'qa-glacier-focus',id:'glacier-focus'}]);
  lg.send({type:'equipment',equipment:{weapon:'glacier-focus',armor:'forest-armor'}});assert.deepEqual((await lh.next('peer')).profile.equipment,{armor:'forest-armor'});
  lg.send({type:'leave'});await lh.next('peer-left');campaign.send({type:'join',profile,code:lr.code});assert.deepEqual((await campaign.next('joined')).items,[]);await lh.next('peer');
  lh.send({type:'world',epoch:0,sequence:3,world:lootWorld});assert.deepEqual((await campaign.next('world')).items,[]);
  lh.send({type:'leave'});await campaign.next('ended');report.lootReceiptsAndLateJoin=true;report.equipmentSlotsValidated=true;
  report.travelEpochsAndAuthority=true;report.rewardReceiptsWithoutReplay=true;report.bothRolesReconnected=true;report.reservedSlot=true;
  report.passed = true;
} finally {
  for (const c of clients) c.ws.close();
  await mkdir(out, { recursive: true });
  await writeFile(out + '/protocol.json', JSON.stringify(report, null, 2));
}
console.log(report);
