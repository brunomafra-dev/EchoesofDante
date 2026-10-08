// Players connect to the same server that delivered the game. An explicit build
// override remains available for deployments with a separate hosted relay.
export function coopEndpoint(): string {
  if (import.meta.env.VITE_COOP_URL) return import.meta.env.VITE_COOP_URL;
  const url = new URL('coop', new URL(import.meta.env.BASE_URL, location.href));
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.href;
}
