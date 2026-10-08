// Public connection configuration, not credentials. The Vercel function uses
// this to point the unchanged web game at one central, persistent relay.
export function coopConfig(req, res, { integratedPath } = {}) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  const configured = process.env.COOP_RELAY_URL;
  let relay = integratedPath;
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol !== 'wss:' || url.username || url.password) throw Error('Invalid relay');
      relay = url.href;
    } catch { relay = undefined; }
  }
  if (!relay) {
    res.statusCode = 503;
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ready: false,
      message: 'O cooperativo online ainda está sendo ativado. Sua jornada solo continua disponível.' }));
    return;
  }
  res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ready: true, relay }));
}
