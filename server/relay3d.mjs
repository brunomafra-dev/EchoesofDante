import { WebSocketServer, WebSocket } from 'ws';

// Rooms of the new 3D (3d.html): up to four players share a room code and see each other move, fight and wear their
// equipment, each one rendered by the other's own game. The relay only forwards what it receives, after checking its
// shape; progress, missions and backpacks stay on each player's device. It lives beside the 2D rooms (relay.mjs,
// protocol 16) on its own path and never touches them.
const CLASSES = new Set(['warrior', 'hunter', 'astral', 'xenobinder']);
const BIOMES = new Set(['camp', 'domain', 'dunes', 'frost', 'caldera', 'springs', 'valley']);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX = 4, RATE = 30;
const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0;
const str = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';

// what a player shows: name, class, look and the tier worn on each part (no backpack, no progress)
function cleanProfile(p) {
  if (!p || typeof p !== 'object' || !CLASSES.has(p.cls)) return null;
  const name = str(p.name, 24).trim() || 'Explorador';
  const look = p.look && typeof p.look === 'object' ? p.look : {};
  const keep = {};
  for (const k of ['sex', 'hair', 'brows', 'outfit', 'weapon', 'tint', 'garb']) if (typeof look[k] === 'string') keep[k] = look[k].slice(0, 32);
  for (const k of ['skin', 'hairColor', 'cloth']) if (Number.isInteger(look[k])) keep[k] = Math.max(0, Math.min(20, look[k]));
  if (typeof look.helmet === 'boolean') keep.helmet = look.helmet;
  const armour = {};
  for (const k of ['helmet', 'torso', 'legs', 'boots', 'gloves', 'accessory']) if ([1, 2, 3].includes(p.armour?.[k])) armour[k] = p.armour[k];
  return { name, cls: p.cls, look: keep, armour, pet: str(p.pet, 16), level: Math.round(num(p.level, 1, 10)) || 1 };
}
// one moment of a player: place, facing, animation, region and life
function cleanState(s) {
  if (!s || typeof s !== 'object' || !BIOMES.has(s.b)) return null;
  return { x: num(s.x, -60, 60), z: num(s.z, -60, 60), h: num(s.h, -100, 100), a: str(s.a, 24), b: s.b, hp: num(s.hp, 0, 1), t: num(s.t, 0, 1e12) };
}
// a moment worth seeing on the other screens: an attack, a skill, a hit, a fall
function cleanEvent(e) {
  if (!e || typeof e !== 'object') return null;
  const kind = str(e.k, 16);
  if (!['attack', 'skill', 'dash', 'down', 'up', 'emote'].includes(kind)) return null;
  return { k: kind, x: num(e.x, -60, 60), z: num(e.z, -60, 60), h: num(e.h, -100, 100) };
}

export function attachCoop3d(server, { path = '/coop3d' } = {}) {
  const rooms = new Map();
  let nextId = 1;
  // the same allowed origins as the 2D rooms (COOP_ORIGINS on the room service)
  const origins = (process.env.COOP_ORIGINS ?? '').split(',').filter(Boolean);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16384, perMessageDeflate: false,
    verifyClient: ({ origin }, done) => done(!origins.length || origins.includes(origin)) });
  const upgrade = (request, socket, head) => {
    let pathname; try { pathname = new URL(request.url, 'http://localhost').pathname; } catch { return; }
    if (pathname !== path) return;
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  };
  server.on('upgrade', upgrade);
  const send = (ws, m) => { if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 262144) ws.send(JSON.stringify(m)); };
  const others = (room, me) => [...room.members.values()].filter(m => m !== me);
  const roster = room => [...room.members.values()].map(m => ({ id: m.id, profile: m.profile }));
  const newCode = () => { for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; if (!rooms.has(c)) return c; } };
  function leave(me) {
    const room = rooms.get(me.room); if (!room) return;
    room.members.delete(me.id); me.room = undefined;
    if (!room.members.size) { rooms.delete(room.code); return; }
    for (const o of room.members.values()) send(o.ws, { type: 'left', id: me.id });
  }
  wss.on('connection', ws => {
    const me = { id: String(nextId++), ws, profile: null, room: undefined, window: 0, count: 0 };
    ws.on('message', data => {
      // a small budget per second keeps one client from flooding the room
      const now = Date.now(); if (now - me.window > 1000) { me.window = now; me.count = 0; } if (++me.count > RATE) return;
      let m; try { m = JSON.parse(String(data)); } catch { return; }
      if (!m || typeof m !== 'object') return;
      if (m.type === 'host' || m.type === 'join') {
        const profile = cleanProfile(m.profile); if (!profile) return send(ws, { type: 'error', message: 'Personagem inválido para a sala.' });
        if (me.room) leave(me);
        let room;
        if (m.type === 'host') { room = { code: newCode(), members: new Map() }; rooms.set(room.code, room); }
        else {
          room = rooms.get(str(m.code, 8).toUpperCase());
          if (!room) return send(ws, { type: 'error', message: 'Sala não encontrada. Confira o código.' });
          if (room.members.size >= MAX) return send(ws, { type: 'error', message: 'A sala já tem quatro exploradores.' });
        }
        me.profile = profile; me.room = room.code; room.members.set(me.id, me);
        send(ws, { type: 'room', code: room.code, id: me.id, members: roster(room) });
        for (const o of others(room, me)) send(o.ws, { type: 'joined', id: me.id, profile });
        return;
      }
      const room = rooms.get(me.room); if (!room) return;
      if (m.type === 'profile') { const p = cleanProfile(m.profile); if (!p) return; me.profile = p; for (const o of others(room, me)) send(o.ws, { type: 'profile', id: me.id, profile: p }); }
      else if (m.type === 'state') { const s = cleanState(m.s); if (s) for (const o of others(room, me)) send(o.ws, { type: 'state', id: me.id, s }); }
      else if (m.type === 'event') { const e = cleanEvent(m.e); if (e) for (const o of others(room, me)) send(o.ws, { type: 'event', id: me.id, e }); }
      else if (m.type === 'leave') leave(me);
    });
    ws.on('close', () => leave(me));
    ws.on('error', () => leave(me));
  });
  return {
    status: () => ({ service: 'Dante 3D rooms', rooms: rooms.size, players: [...rooms.values()].reduce((n, r) => n + r.members.size, 0), capacity: MAX }),
    close: () => { server.off('upgrade', upgrade); wss.close(); },
  };
}
