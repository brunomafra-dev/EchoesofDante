// Deployment configuration belongs to the server, never the player. Integrated
// dev/preview return /coop; the Vercel API returns the central relay URL.
let endpoint: Promise<string> | undefined;
const CACHE_KEY = 'echoes-of-dante.coop-endpoint.v1';
const CACHE_DURATION = 10 * 60 * 1000;
export function coopEndpoint(): Promise<string> {
  if (import.meta.env.VITE_COOP_URL) return Promise.resolve(import.meta.env.VITE_COOP_URL);
  // This is a public address, not a room or a health check. The tab cache also
  // survives the document reload used to launch a newly created character.
  // Failed lookups are discarded so the visible retry can make a fresh request.
  endpoint ??= resolveEndpoint().catch(error => { endpoint = undefined; throw error; });
  return endpoint;
}

async function resolveEndpoint(): Promise<string> {
  const base = new URL(import.meta.env.BASE_URL, location.href);
  const source = new URL('api/coop-config', base).href;
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached?.source === source && Number.isFinite(cached.expiresAt) &&
      cached.expiresAt > Date.now() && cached.expiresAt <= Date.now() + CACHE_DURATION) {
      return validatedEndpoint(cached.relay, base);
    }
  } catch { /* Missing/blocked/invalid storage must not prevent connecting. */ }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(source, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw Error('Unavailable');
    const config = await response.json();
    if (!config.ready || typeof config.relay !== 'string') throw Error('Unavailable');
    const relay = validatedEndpoint(config.relay, base);
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({source,relay,expiresAt:Date.now()+CACHE_DURATION})); }
    catch { /* The in-page lookup still works if storage is unavailable. */ }
    return relay;
  } catch {
    throw Error('Não foi possível consultar o serviço de salas. Tente novamente.');
  } finally { clearTimeout(timeout); }
}

function validatedEndpoint(relay: unknown, base: URL): string {
  if (typeof relay !== 'string') throw Error('Invalid relay');
  const url = new URL(relay, base);
  if (relay.startsWith('/')) url.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password ||
    base.protocol === 'https:' && url.protocol !== 'wss:') throw Error('Invalid relay');
  return url.href;
}
