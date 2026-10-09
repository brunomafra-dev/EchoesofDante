import { defineConfig } from 'vite';
import type { PreviewServer, ViteDevServer } from 'vite';
import { attachCoop } from './server/relay.mjs';
import { coopConfig } from './server/coop-config.mjs';

// Use the same URL for the game, rooms and LAN devices in dev and preview.
function rooms(server: ViteDevServer | PreviewServer) {
  if (!server.httpServer) return;
  const base = server.config.base.startsWith('/') ? server.config.base : '/';
  const path = base.replace(/\/$/, '') + '/coop';
  const relay = attachCoop(server.httpServer, { path });
  server.middlewares.use(base.replace(/\/$/, '') + '/api/coop-config', (req, res) => coopConfig(req, res, { integratedPath: path }));
  server.middlewares.use(path + '/health', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(relay.status()));
  });
}

export default defineConfig({
  plugins: [{ name: 'dante-rooms', configureServer: rooms, configurePreviewServer: rooms }],
  build: {
    rollupOptions: {
      input: { game: 'index.html', renderingLab: 'rendering-lab.html', qualityReference: 'quality-reference.html', glacierPlaytest: 'glacier-playtest.html' },
    },
  },
});
