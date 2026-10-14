import { readFileSync } from 'node:fs';
const catalogue=JSON.parse(readFileSync(new URL('../src/config/equipment-catalog.json',import.meta.url),'utf8'));
import { randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

const areas = new Set(['base','forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera']);
const connections = { forest: ['cavern'], cavern: ['forest','warden'], warden: ['cavern','valley'], valley: ['warden','arid'], arid: ['valley','dunes'], dunes: ['arid','sandpit'], sandpit: ['dunes','frost'], frost: ['sandpit','icecave'], icecave: ['frost','icenest'], icenest: ['icecave','cinder'], cinder:['icenest','obsidian'], obsidian:['cinder','caldera'], caldera: ['obsidian'] };
const equipmentIds=new Set(Object.keys(catalogue));
const cleanEquipment=raw=>Object.fromEntries(['weapon','helmet','armor','legs','boots','gloves','accessory'].filter(slot=>equipmentIds.has(raw?.[slot])&&catalogue[raw[slot]].slot===slot).map(slot=>[slot,raw[slot]]));
const cleanBuild = raw => ({
  xp:Number.isSafeInteger(raw?.xp)?Math.max(0,Math.min(1e9,raw.xp)):0,
  abilityUpgrades:Object.fromEntries(['saberArc','saberReach','dashCooldown','dashDuration','chargeWidth','chargePower'].map(id=>[id,Number.isInteger(raw?.abilityUpgrades?.[id])?Math.max(0,Math.min(3,raw.abilityUpgrades[id])):0])),
  bossRewards:Array.isArray(raw?.bossRewards)?raw.bossRewards.filter(v=>['warden','soterrado','vesper','titan'].includes(v)).slice(0,4):[],
});
const bagFree=n=>Number.isInteger(n)?Math.max(0,Math.min(24,n)):0;
// Attach rooms to an existing web server; no second port or process is required.
export function attachCoop(server, { path = '/coop' } = {}) {
  const rooms = new Map(), clients = new Set();
  const graceMs = 20000;
  const origins = (process.env.COOP_ORIGINS ?? '').split(',').filter(Boolean);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 131072, perMessageDeflate: false,
    verifyClient: ({ origin }, done) => done(!origins.length || origins.includes(origin)) });
  const upgrade = (request, socket, head) => {
    let pathname; try { pathname = new URL(request.url, 'http://localhost').pathname; } catch { return; }
    // Leave Vite HMR and other upgrade routes to their existing listeners.
    if (path && pathname !== path) return;
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  };
  server.on('upgrade', upgrade);
  const send = (ws, message) => {
    if(ws?.readyState!==WebSocket.OPEN)return;
    // Snapshots can be replaced by the next one. Epochs, seats and receipts cannot.
    if(ws.bufferedAmount>1048576){ws.close(1013,'Conexão congestionada. Reconecte para recuperar a sala.');return;}
    if(message.type==='world'&&ws.bufferedAmount>=131072)return;
    ws.send(JSON.stringify(message));
  };
  const profile = p => p && ['warrior', 'hunter','astral','xenobinder'].includes(p.classId) && typeof p.name === 'string' && p.name.trim()
    ? { name: p.name.trim().slice(0, 24), classId: p.classId, sex: p.sex === 'male' || p.sex === 'female' ? p.sex : p.classId === 'hunter' ? 'female' : 'male', bagFree:bagFree(p.bagFree),potions:Number.isInteger(p.potions)?Math.max(0,Math.min(20,p.potions)):0,equipment:cleanEquipment(p.equipment),build:cleanBuild(p.build) } : null;
  const seat = (ws, p, id = randomBytes(8).toString('hex')) => ({ id, ws, profile: p, token: randomBytes(24).toString('hex'), receipt: randomBytes(16).toString('hex'), total: 0, bosses:new Set(), items:new Map(),resources:{credits:0,materials:[0,0,0],used:0},timer: undefined });
  const members = room => [room.host, ...room.guests.values()];
  const roster = room => members(room).map(m => ({id:m.id, profile:m.profile, connected:!!m.ws}));
  const broadcast = (room, message) => { for(const member of members(room)) send(member.ws,message); };
  const notify = room => broadcast(room,{type:'roster',members:roster(room)});
  function end(room) {
    for(const member of members(room)) clearTimeout(member.timer);
    rooms.delete(room.code);
    for (const member of members(room)) if (member?.ws) {
      send(member.ws, { type: 'ended', message: 'O anfitrião encerrou a expedição.' }); member.ws.room = undefined;
    }
  }
  function leave(ws, explicit = false) {
    const room = rooms.get(ws.room); ws.room = undefined;
    if (!room) return;
    const member = members(room).find(m=>m.ws===ws);
    if (!member) return;
    const role = member === room.host ? 'host' : 'guest'; member.ws = undefined;
    if (explicit) {
      if (role === 'host') end(room);
      else { clearTimeout(member.timer); room.guests.delete(member.id); notify(room); }
      return;
    }
    notify(room);
    member.timer = setTimeout(() => {
      if (role === 'host') end(room);
      else { room.guests.delete(member.id); notify(room); }
    }, graceMs);
    member.timer.unref();
  }
  function joined(room, member) {
    send(member.ws, { type: 'joined', protocol:10, id:member.id, role:member===room.host?'host':'guest', code: room.code, token: member.token, epoch: room.epoch,
      area: room.area, members:roster(room), paused: room.paused === true, receipt: member.receipt, total: member.total, bosses:[...member.bosses], items:[...member.items.values()],resources:member.resources });
    notify(room);
  }
  wss.on('connection', ws => {
    if (clients.size >= 128) { ws.close(1013, 'Servidor ocupado'); return; }
    clients.add(ws); ws.lastSeen = Date.now(); ws.tokens=120; ws.window=Date.now();ws.messageTypes={};
    ws.on('pong', () => ws.lastSeen = Date.now()); ws.on('error', () => {});
    ws.on('close', () => { leave(ws); clients.delete(ws); });
    ws.on('message', (raw, binary) => {
      ws.lastSeen = Date.now();
      if (binary) return ws.close(1003, 'Somente JSON');
      const elapsed=Date.now()-ws.window;ws.tokens=Math.min(120,ws.tokens+elapsed*.06);ws.window=Date.now();
      if(ws.tokens<1)return ws.close(1008,'Limite de mensagens: '+Object.entries(ws.messageTypes).map(([t,n])=>`${t}=${n}`).join(',').slice(0,85));
      ws.tokens--;
      let m; try { m = JSON.parse(raw.toString()); } catch { return send(ws, { type: 'error', message: 'Mensagem inválida.' }); }
      if (!m || typeof m.type !== 'string') return;
      if(['input','equipment','world','service-request','pause','travel'].includes(m.type))ws.messageTypes[m.type]=(ws.messageTypes[m.type]??0)+1;
      if(m.type==='inspect') {
        const room=rooms.get(String(m.code).replace(/\s/g,'').toUpperCase());
        return send(ws,room?{type:'lobby',protocol:10,members:roster(room),area:room.area}:{type:'error',message:'Sala não encontrada. Peça um novo convite.'});
      }
      if (m.type === 'resume') {
        if (typeof m.token !== 'string' || !/^[a-f0-9]{48}$/.test(m.token)) return send(ws, { type: 'error', message: 'Credencial de reconexão inválida.' });
        const room = rooms.get(String(m.code));
        const member = room && members(room).find(p=>p.token===m.token);
        if (!member || ws.room) return send(ws, { type: 'error', message: 'Não foi possível recuperar esta sala. Entre novamente com o código.' });
        // A mobile network switch can reconnect before the old socket's heartbeat expires.
        // Only the secret resume credential can replace that transport; detach it first.
        if (member.ws) { const previous = member.ws; previous.room = undefined;
          send(previous, { type: 'replaced', message: 'Esta conexão foi substituída pela reconexão da expedição.' }); previous.close(); }
        clearTimeout(member.timer); member.timer = undefined; member.ws = ws; ws.room = room.code;
        joined(room, member); return;
      }
      if (m.type === 'create' || m.type === 'join') {
        if (ws.room) return send(ws, { type: 'error', message: 'Você já está em uma sala.' });
        const p = profile(m.profile); if (!p) return send(ws, { type: 'error', message: 'Personagem inválido.' });
        if (m.type === 'create') {
          if (!areas.has(m.area)) return send(ws, { type: 'error', message: 'Região de campanha desconhecida.' });
          if (rooms.size >= 64) return send(ws, { type: 'error', message: 'Servidor ocupado.' });
          const code = randomBytes(5).toString('hex').toUpperCase();
          const room = { code, host: seat(ws, p, 'host'), guests: new Map(), area: m.area, epoch: 0, sequence: -1, xp: undefined, bosses:new Set(p.build.bossRewards), loot:new Set(),resourceIds:new Set(),visited:new Set(['base','forest',m.area]) };
          rooms.set(code, room); ws.room = code; joined(room, room.host);
        } else {
          const room = rooms.get(String(m.code).replace(/\s/g, '').toUpperCase());
          if (!room) return send(ws, { type: 'error', message: 'Sala não encontrada. Confira o código com seu amigo.' });
          if (room.guests.size>=3) return send(ws, { type: 'error', message: 'As quatro vagas estão ocupadas ou reservadas para reconexão.' });
          if(members(room).some(m=>m.profile.classId===p.classId)) return send(ws,{type:'error',message:'Esta classe já está na equipe. Escolha outra classe; seu personagem não foi alterado.'});
          if (!room.host.ws) return send(ws, { type: 'error', message: 'O anfitrião está reconectando. Tente novamente em alguns segundos.' });
          const member=seat(ws,p); room.guests.set(member.id,member); ws.room = room.code; joined(room, member);
        }
        return;
      }
      const room = rooms.get(ws.room); if (!room) return;
      const member=members(room).find(p=>p.ws===ws);if(!member)return;
      if(m.type==='service-request'&&member!==room.host){if(['potion','return','heal'].includes(m.action))send(room.host.ws,{type:'service-request',id:member.id,action:m.action});
      }else if(m.type==='equipment') {
        member.profile.build=cleanBuild(m.build);member.profile.equipment=cleanEquipment(m.equipment);member.profile.bagFree=bagFree(m.bagFree);member.profile.potions=Number.isInteger(m.potions)?Math.max(0,Math.min(20,m.potions)):0;
        notify(room);
      } else if (m.type === 'pause' && ws === room.host.ws) {
        room.paused = m.paused === true; broadcast(room, { type: 'pause', paused: room.paused });
      } else if (m.type === 'travel' && ws === room.host.ws) {
        if (m.epoch !== room.epoch || !(m.area==='base'||room.area==='base'&&room.visited.has(m.area)||connections[room.area]?.includes(m.area))||m.area==='base'&&room.bossActive) return send(ws, { type: 'error', message: 'Essa passagem não está conectada à região atual.' });
        room.area = m.area; room.epoch++;
        broadcast(room, { type: 'travel', area: room.area, epoch: room.epoch });
      } else if (m.type === 'input' && member !== room.host && m.epoch === room.epoch) {
        const i = m.input; if (!i || !Number.isFinite(i.x) || !Number.isFinite(i.y) || !Number.isFinite(i.aim)) return;
        const scale = Math.max(1, Math.hypot(i.x, i.y));
        const input = { x: i.x / scale, y: i.y / scale, aim: Math.atan2(Math.sin(i.aim), Math.cos(i.aim)) };
        for (const k of ['attack', 'dash', 'charge', 'held', 'release', 'cancel', 'interact', 'restart','element']) input[k] = i[k] === true;
        send(room.host.ws, { type: 'input', id:member.id, input, epoch: room.epoch });
      } else if (m.type === 'world' && ws === room.host.ws) {
        const world = m.world, xp = world?.progression?.xp;
        if (m.epoch !== room.epoch || !Number.isSafeInteger(m.sequence) || m.sequence <= room.sequence || world?.area !== room.area ||
          !Array.isArray(world.enemies) || world.enemies.length > 32 || !Number.isSafeInteger(xp) || xp < 0 || xp > 1e9) return;
        room.sequence = m.sequence;room.bossActive=world.boss?.active===true;for(const area of (Array.isArray(world.visited)?world.visited:[]))if(areas.has(area))room.visited.add(area);
        const resources=(Array.isArray(world.resourceAwarded)?world.resourceAwarded:[]).slice(-512).filter(p=>p&&typeof p.uid==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(p.uid)&&!room.resourceIds.has(p.uid)&&[1,2,3].includes(p.tier)&&Number.isInteger(p.credits)&&p.credits>=0&&p.credits<=75&&Number.isInteger(p.amount)&&p.amount>=0&&p.amount<=6);
        for(const p of resources){const recipient=room.guests.get(p.owner);if(!recipient)continue;room.resourceIds.add(p.uid);if(room.resourceIds.size>4096)room.resourceIds.delete(room.resourceIds.values().next().value);recipient.resources.credits=Math.min(1e9,recipient.resources.credits+p.credits);recipient.resources.materials[p.tier-1]=Math.min(1e9,recipient.resources.materials[p.tier-1]+p.amount);}
        for(const guest of room.guests.values()){const used=world.players?.[guest.id]?.potionUsed;if(Number.isSafeInteger(used)&&used>=guest.resources.used){guest.profile.potions=Math.max(0,guest.profile.potions-(used-guest.resources.used));guest.resources.used=used;}}
        const gain = room.xp === undefined ? 0 : Math.max(0, xp - room.xp);
        room.xp = Math.max(room.xp ?? 0, xp);
        for(const boss of cleanBuild(world.progression).bossRewards)if(!room.bosses.has(boss)){
          room.bosses.add(boss);for(const guest of room.guests.values())if(guest.ws)guest.bosses.add(boss);
        }
        const fresh=(Array.isArray(world.lootAwarded)?world.lootAwarded:[]).slice(-512).filter(i=>i&&equipmentIds.has(i.id)&&typeof i.uid==='string'&&/^[a-zA-Z0-9_-]{1,96}$/.test(i.uid)&&!room.loot.has(i.uid));
        for(const i of fresh){const recipient=room.guests.get(i.owner);if(recipient){room.loot.add(i.uid);if(room.loot.size>4096)room.loot.delete(room.loot.values().next().value);recipient.items.set(i.uid,{uid:i.uid,id:i.id});if(recipient.items.size>512)recipient.items.delete(recipient.items.keys().next().value);}}
        // Confirm durable receipt ownership before the host removes its outgoing queue.
        send(room.host.ws,{type:'awards-ack',items:(Array.isArray(world.lootAwarded)?world.lootAwarded:[]).slice(-512).filter(i=>i&&room.loot.has(i.uid)).map(i=>i.uid),resources:(Array.isArray(world.resourceAwarded)?world.resourceAwarded:[]).slice(-512).filter(i=>i&&room.resourceIds.has(i.uid)).map(i=>i.uid)});
        for (const guest of room.guests.values()) if(guest.ws) {
          guest.total += gain;
          const own=world.players?.[guest.id];
          const personalWorld={...world,partner:own,prompt:own?.prompt??false,action:own?.action??'INVESTIGAR',loot:Array.isArray(world.loot)?world.loot.filter(i=>i?.owner===guest.id):[],resources:Array.isArray(world.resources)?world.resources.filter(i=>i?.owner===guest.id):[],lootAwarded:undefined,resourceAwarded:undefined};
          send(guest.ws, { type: 'world', world:personalWorld, epoch: room.epoch,
            receipt: guest.receipt, total: guest.total,bosses:[...guest.bosses],items:[...guest.items.values()],resources:guest.resources });
        }
      } else if (m.type === 'leave') leave(ws, true);
    });
  });
  const heartbeat = setInterval(() => {
    // Activity is also proof of life. A delayed pong must not evict a player
    // still sending inputs while a browser loads textures or changes focus.
    for (const ws of clients) { if (Date.now()-ws.lastSeen>20000) { ws.terminate(); continue; } ws.ping(); }
  }, 5000); heartbeat.unref();
  let stopped = false;
  function close() {
    if (stopped) return;
    stopped = true;
    clearInterval(heartbeat);
    server.off('upgrade', upgrade); server.off('close', close);
    for (const room of rooms.values()) end(room);
    for (const ws of clients) ws.terminate();
    wss.close();
  }
  server.once('close', close);
  return {
    close,
    status: () => ({ service: 'Dante regional co-op', protocol: 10, capacity:4, uniqueClasses:true, revision:process.env.RENDER_GIT_COMMIT??'local', campaign: true, rooms: rooms.size, players: clients.size }),
  };
}
