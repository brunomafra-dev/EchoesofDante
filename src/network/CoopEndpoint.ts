// Deployment configuration belongs to the server, never the player. Integrated
// dev/preview return /coop; the Vercel API returns the central relay URL.
export async function coopEndpoint(): Promise<string> {
  if (import.meta.env.VITE_COOP_URL) return import.meta.env.VITE_COOP_URL;
  const base = new URL(import.meta.env.BASE_URL, location.href);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL('api/coop-config', base), { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw Error('Unavailable');
    const config = await response.json();
    if (!config.ready || typeof config.relay !== 'string') throw Error('Unavailable');
    const url = new URL(config.relay, base);
    if (config.relay.startsWith('/')) url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password) throw Error('Invalid relay');
    return url.href;
  } catch {
    throw Error('O cooperativo online ainda não está disponível. Sua jornada solo continua disponível.');
  } finally { clearTimeout(timeout); }
}
