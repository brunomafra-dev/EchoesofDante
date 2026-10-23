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
      input: { worldFinish:'world-finish-playtest.html',forestFinish:'forest-finish.html',cinematicCompatibility:'cinematic-compatibility.html',cinematicReview:'cinematic-review.html',cinematicWorkprint:'cinematic-workprint.html',wholeBody:'whole-body-playtest.html',cinematicOpening:'cinematic-opening.html',cinematicBridge:'cinematic-bridge-pilot.html',cinematicMotion:'cinematic-motion-test.html',cinematicPilot:'cinematic-pilot.html',characterCohesion:'character-cohesion.html',campaignPlaytest:'campaign-playtest.html',partyPlaytest:'party-playtest.html',xenobinderPlaytest:'xenobinder-playtest.html',calderaPlaytest:'caldera-playtest.html',astralPlaytest:'astral-playtest.html',threatPlaytest:'threat-playtest.html',game: 'index.html',basePlaytest:'base-playtest.html', inventoryPlaytest:'inventory-playtest.html', testLibrary: 'test-library.html', characterPlaytest: 'character-playtest.html', renderingLab: 'rendering-lab.html', qualityReference: 'quality-reference.html', glacierPlaytest: 'glacier-playtest.html' },
    },
  },
});
