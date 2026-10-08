import { coopConfig } from '../server/coop-config.mjs';

// Runs on Vercel. Set COOP_RELAY_URL once in the project's environment.
export default function handler(req, res) { coopConfig(req, res); }
