import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import { attachCoop } from './relay.mjs';

// The built game and rooms share one port, including in a Node deployment.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
try { await stat(resolve(root, 'index.html')); }
catch { console.error('Build ausente. Execute npm run build antes de npm start.'); process.exit(1); }
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/coop/health') {
    res.setHeader('Content-Type', 'application/json');
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(relay.status())); return;
  }
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  const within = relative(root, file);
  if (within.startsWith('..') || isAbsolute(within)) { res.writeHead(403); res.end(); return; }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw Error('Not a file');
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
      'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': /-[\w-]{8}\.(js|css)$/.test(pathname) ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404); res.end(); }
});
const relay = attachCoop(server);
const port = Number(process.env.PORT ?? 8080);
server.listen(port, '0.0.0.0', () => console.log(`Echoes of Dante + salas: http://localhost:${port}`));
const stop = () => { relay.close(); server.close(); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
