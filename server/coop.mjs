import { createServer } from 'node:http';
import { attachCoop } from './relay.mjs';
import { attachCoop3d } from './relay3d.mjs';

// Optional standalone relay, retained for existing deployments and protocol QA.
const server = createServer((_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(relay.status()));
});
const relay = attachCoop(server, { path: null });
const relay3d = attachCoop3d(server);
const port = Number(process.env.PORT ?? process.env.COOP_PORT ?? 5190);
server.listen(port, '0.0.0.0', () => console.log(`Dante regional co-op relay on port ${port}`));
const stop = () => { relay.close(); relay3d.close(); server.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
