import { randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

const areas = new Set(['forest','cavern','warden','valley','arid','dunes','sandpit','frost','icecave','icenest']);
const connections = { forest: ['cavern'], cavern: ['forest','warden'], warden: ['cavern','valley'], valley: ['warden','arid'], arid: ['valley','dunes'], dunes: ['arid','sandpit'], sandpit: ['dunes','frost'], frost: ['sandpit','icecave'], icecave: ['frost','icenest'], icenest: ['icecave'] };
const equipmentIds=new Set(['forest','sirocco','glacier'].flatMap(region=>['emitter','armor','focus'].map(type=>`${region}-${type}`)));
const cleanEquipment=raw=>Object.fromEntries(['weapon','armor','accessory'].filter(slot=>equipmentIds.has(raw?.[slot])&&raw[slot].endsWith(slot==='weapon'?'emitter':slot==='armor'?'armor':'focus')).map(slot=>[slot,raw[slot]]));
// Attach rooms to an existing web server; no second port or process is required.
export function attachCoop(server, { path = '/coop' } = {}) {
  const rooms = new Map(), clients = new Set();
  const graceMs = 20000;
  const origins = (process.env.COOP_ORIGINS ?? '').split(',').filter(Boolean);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 65536, perMessageDeflate: false,
    verifyClient: ({ origin }, done) => done(!origins.length || origins.includes(origin)) });
  const upgrade = (request, socket, head) => {
    let pathname; try { pathname = new URL(request.url, 'http://localhost').pathname; } catch { return; }
    // Leave Vite HMR and other upgrade routes to their existing listeners.
    if (path && pathname !== path) return;
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  };
  server.on('upgrade', upgrade);
  const send = (ws, message) => { if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 131072) ws.send(JSON.stringify(message)); };
  const profile = p => p && ['warrior', 'hunter'].includes(p.classId) && typeof p.name === 'string' && p.name.trim()
    ? { name: p.name.trim().slice(0, 24), classId: p.classId, equipment:cleanEquipment(p.equipment) } : null;
  const seat = (ws, p) => ({ ws, profile: p, token: randomBytes(24).toString('hex'), receipt: randomBytes(16).toString('hex'), total: 0, items:new Set(), timer: undefined });
  function end(room) {
    clearTimeout(room.host.timer); clearTimeout(room.guest?.timer);
    rooms.delete(room.code);
    for (const member of [room.host, room.guest]) if (member?.ws) {
      send(member.ws, { type: 'ended', message: 'O anfitrião encerrou a expedição.' }); member.ws.room = undefined;
    }
  }
  function leave(ws, explicit = false) {
    const room = rooms.get(ws.room); ws.room = undefined;
    if (!room) return;
    const role = room.host.ws === ws ? 'host' : room.guest?.ws === ws ? 'guest' : undefined;
    if (!role) return;
    const member = room[role]; member.ws = undefined;
    if (explicit) {
      if (role === 'host') end(room);
      else { clearTimeout(member.timer); room.guest = undefined; send(room.host.ws, { type: 'peer-left' }); }
      return;
    }
    send(room[role === 'host' ? 'guest' : 'host']?.ws, { type: 'peer-offline', role });
    member.timer = setTimeout(() => {
      if (role === 'host') end(room);
      else { room.guest = undefined; send(room.host.ws, { type: 'peer-left' }); }
    }, graceMs);
    member.timer.unref();
  }
  function joined(room, role) {
    const member = room[role], peer = room[role === 'host' ? 'guest' : 'host'];
    send(member.ws, { type: 'joined', protocol:2, role, code: room.code, token: member.token, epoch: room.epoch,
      area: room.area, peer: peer?.profile, peerConnected: !!peer?.ws, paused: room.paused === true, receipt: member.receipt, total: member.total, items:[...member.items] });
    send(peer?.ws, { type: 'peer', profile: member.profile });
  }
  wss.on('connection', ws => {
    if (clients.size >= 128) { ws.close(1013, 'Servidor ocupado'); return; }
    clients.add(ws); ws.alive = true; ws.count = 0; ws.window = Date.now();
    ws.on('pong', () => ws.alive = true); ws.on('error', () => {});
    ws.on('close', () => { leave(ws); clients.delete(ws); });
    ws.on('message', (raw, binary) => {
      if (binary) return ws.close(1003, 'Somente JSON');
      if (Date.now() - ws.window >= 1000) { ws.window = Date.now(); ws.count = 0; }
      if (++ws.count > 60) return ws.close(1008, 'Limite de mensagens');
      let m; try { m = JSON.parse(raw.toString()); } catch { return send(ws, { type: 'error', message: 'Mensagem inválida.' }); }
      if (!m || typeof m.type !== 'string') return;
      if (m.type === 'resume') {
        if (typeof m.token !== 'string' || !/^[a-f0-9]{48}$/.test(m.token)) return send(ws, { type: 'error', message: 'Credencial de reconexão inválida.' });
        const room = rooms.get(String(m.code));
        const role = room && (room.host.token === m.token ? 'host' : room.guest?.token === m.token ? 'guest' : undefined);
        if (!role || ws.room) return send(ws, { type: 'error', message: 'Não foi possível recuperar esta sala. Entre novamente com o código.' });
        const member = room[role];
        // A mobile network switch can reconnect before the old socket's heartbeat expires.
        // Only the secret resume credential can replace that transport; detach it first.
        if (member.ws) { const previous = member.ws; previous.room = undefined;
          send(previous, { type: 'replaced', message: 'Esta conexão foi substituída pela reconexão da expedição.' }); previous.close(); }
        clearTimeout(member.timer); member.timer = undefined; member.ws = ws; ws.room = room.code;
        joined(room, role); return;
      }
      if (m.type === 'create' || m.type === 'join') {
        if (ws.room) return send(ws, { type: 'error', message: 'Você já está em uma sala.' });
        const p = profile(m.profile); if (!p) return send(ws, { type: 'error', message: 'Personagem inválido.' });
        if (m.type === 'create') {
          if (!areas.has(m.area)) return send(ws, { type: 'error', message: 'Região de campanha desconhecida.' });
          if (rooms.size >= 64) return send(ws, { type: 'error', message: 'Servidor ocupado.' });
          const code = randomBytes(5).toString('hex').toUpperCase();
          const room = { code, host: seat(ws, p), guest: undefined, area: m.area, epoch: 0, sequence: -1, xp: undefined, loot:new Set() };
          rooms.set(code, room); ws.room = code; joined(room, 'host');
        } else {
          const room = rooms.get(String(m.code).replace(/\s/g, '').toUpperCase());
          if (!room) return send(ws, { type: 'error', message: 'Sala não encontrada. Confira o código com seu amigo.' });
          if (room.guest) return send(ws, { type: 'error', message: 'Esta sala já tem duas pessoas (a vaga pode estar em reconexão).' });
          if (!room.host.ws) return send(ws, { type: 'error', message: 'O anfitrião está reconectando. Tente novamente em alguns segundos.' });
          room.guest = seat(ws, p); ws.room = room.code; joined(room, 'guest');
        }
        return;
      }
      const room = rooms.get(ws.room); if (!room) return;
      if(m.type==='equipment') {
        const role=ws===room.host.ws?'host':ws===room.guest?.ws?'guest':undefined;
        if(!role)return;
        room[role].profile.equipment=cleanEquipment(m.equipment);
        send(room[role==='host'?'guest':'host']?.ws,{type:'peer',profile:room[role].profile});
      } else if (m.type === 'pause' && ws === room.host.ws) {
        room.paused = m.paused === true; send(room.guest?.ws, { type: 'pause', paused: room.paused });
      } else if (m.type === 'travel' && ws === room.host.ws) {
        if (m.epoch !== room.epoch || !connections[room.area]?.includes(m.area)) return send(ws, { type: 'error', message: 'Essa passagem não está conectada à região atual.' });
        room.area = m.area; room.epoch++;
        for (const member of [room.host, room.guest]) send(member?.ws, { type: 'travel', area: room.area, epoch: room.epoch });
      } else if (m.type === 'input' && ws === room.guest?.ws && m.epoch === room.epoch) {
        const i = m.input; if (!i || !Number.isFinite(i.x) || !Number.isFinite(i.y) || !Number.isFinite(i.aim)) return;
        const scale = Math.max(1, Math.hypot(i.x, i.y));
        const input = { x: i.x / scale, y: i.y / scale, aim: Math.atan2(Math.sin(i.aim), Math.cos(i.aim)) };
        for (const k of ['attack', 'dash', 'charge', 'held', 'release', 'cancel', 'interact', 'restart']) input[k] = i[k] === true;
        send(room.host.ws, { type: 'input', input, epoch: room.epoch });
      } else if (m.type === 'world' && ws === room.host.ws) {
        const world = m.world, xp = world?.progression?.xp;
        if (m.epoch !== room.epoch || !Number.isSafeInteger(m.sequence) || m.sequence <= room.sequence || world?.area !== room.area ||
          !Array.isArray(world.enemies) || world.enemies.length > 32 || !Number.isSafeInteger(xp) || xp < 0 || xp > 1e9) return;
        room.sequence = m.sequence;
        const gain = room.xp === undefined ? 0 : Math.max(0, xp - room.xp);
        room.xp = Math.max(room.xp ?? 0, xp);
        const fresh=(Array.isArray(world.lootAwarded)?world.lootAwarded:[]).slice(0,9).filter(id=>equipmentIds.has(id)&&!room.loot.has(id));
        for(const id of fresh)room.loot.add(id);
        if (room.guest?.ws) {
          room.guest.total += gain;
          for(const id of fresh)room.guest.items.add(id);
          send(room.guest.ws, { type: 'world', world, epoch: room.epoch,
            receipt: room.guest.receipt, total: room.guest.total,items:[...room.guest.items] });
        }
      } else if (m.type === 'leave') leave(ws, true);
    });
  });
  const heartbeat = setInterval(() => {
    for (const ws of clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
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
    status: () => ({ service: 'Dante regional co-op', protocol: 2, campaign: true, rooms: rooms.size, players: clients.size }),
  };
}
