import { coopConfig } from '../server/coop-config.mjs';

// Public service published by the project owner. Environment configuration can
// override it; local Vite/Node servers keep their own integrated /coop endpoint.
export const PUBLIC_RELAY = 'wss://echoes-of-dante-rooms.onrender.com/coop';
export default function handler(req, res) { coopConfig(req, res, { defaultRelay: PUBLIC_RELAY }); }
