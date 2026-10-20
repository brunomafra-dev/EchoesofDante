// Offline Concat 0.2.8 MCP editing; no cloud generation or installed app config.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const revision = path.join(root, 'docs/cinematic-opening/revision-02');
const work = path.join(root, '.local/cinematic-opening/revision-02');
const exe = process.env.CONCAT_EXE ?? path.join(root, '.local/tools/concat/portable/PFiles64/Concat/concat.exe');
const projectName = process.env.CONCAT_PROJECT ?? 'bridge-voice-proof';
const project = path.join(work, projectName);
const exportOnly = process.argv.includes('--export');
const child = spawn(exe, ['--mcp', 'headless'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, CONCAT_MCP_ROOTS: root } });
child.stderr.on('data', d => process.stderr.write(d));
let serial = 0;
const pending = new Map();
const evidence = [];
child.on('exit', code => { for (const p of pending.values()) p.reject(new Error(`Concat exited ${code}`)); });
createInterface({ input: child.stdout }).on('line', line => {
  try {
    const message = JSON.parse(line), p = pending.get(message.id);
    if (p) { pending.delete(message.id); clearTimeout(p.timer); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); }
  } catch { console.error('Non-protocol output:', line.slice(0, 100)); }
});
function rpc(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++serial;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 120000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
async function tool(name, args) {
  const result = await rpc('tools/call', { name, arguments: args });
  if (result.isError) throw new Error(`${name}: ${JSON.stringify(result)}`);
  const data = result.structuredContent ?? JSON.parse(result.content.find(c => c.type === 'text').text);
  evidence.push({ tool: name, arguments: args, result: data });
  if (!['export_status'].includes(name)) console.log(name, JSON.stringify(data).slice(0, 500));
  return data;
}
try {
  await mkdir(work, { recursive: true });
  await mkdir(revision, { recursive: true });
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'dante-film-authoring', version: '0.1.117' } });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await tool('concat_version', {});
  if (!exportOnly) {
    if (process.argv.includes('--resume-empty')) await tool('project_open', { path: project });
    else await tool('project_create', { location: work, name: projectName, video: { width: 1280, height: 720, rateNum: 24, rateDen: 1, colorSpace: 'sdr' } });
    const timeline = await tool('timeline_read', { path: project });
    if (timeline.timeline.clips.length) throw new Error('Refuse to duplicate a nonempty edit');
    const pictureLane = timeline.timeline.tracks[0]?.id;
    if (!pictureLane) throw new Error(`Unknown lane shape: ${JSON.stringify(timeline)}`);
    const picture = await tool('media_import', { path: project, file: path.join(root, '.local/cinematic-opening/assembly/bridge.mp4') });
    await tool('clip_add', { path: project, mediaId: picture.createdId, trackId: pictureLane, start: 0 });
    const ambientLane = await tool('track_add', { path: project, bottom: true });
    const ambient = await tool('media_import', { path: project, file: path.join(work, 'bridge-ambience.wav') });
    const ambientClip = await tool('clip_add', { path: project, mediaId: ambient.createdId, trackId: ambientLane.createdId, start: 0 });
    await tool('clip_update', { path: project, clipId: ambientClip.createdId, patch: { volume: .65, fadeIn: .15, fadeOut: .4 } });
    const speechLane = await tool('track_add', { path: project });
    const plan = JSON.parse(await readFile(path.join(revision, 'dialogue.json'), 'utf8'));
    for (const line of plan.lines) {
      const media = await tool('media_import', { path: project, file: path.join(revision, `voices/${line.id}.wav`) });
      const clip = await tool('clip_add', { path: project, mediaId: media.createdId, trackId: speechLane.createdId, start: line.start });
      await tool('clip_update', { path: project, clipId: clip.createdId, patch: { volume: 1.45 } });
    }
    await tool('captions_add', { path: project, offsetY: -.41,
      captions: plan.lines.map(l => ({ start: l.start, end: l.end, text: `${l.speaker}: ${l.text}` })),
      style: { fontFamily: '"Segoe UI"', fontSize: .034, fontWeight: 500, color: '#f3f3e8',
        background: '#101610b0', maxWidth: .9, shadow: true } });
    await tool('project_save', { path: project });
    await tool('timeline_read', { path: project });
  } else {
    await tool('project_open', { path: project });
    const output = path.join(root, 'public/assets/cinematic-opening/bridge-voice-proof.mp4');
    const started = await tool('export_start', { path: project, output, codec: 'h264', crf: 18, preset: 'fast' });
    const job = started.job;
    if (!job) throw new Error(`Missing job id: ${JSON.stringify(started)}`);
    let status;
    const deadline = Date.now() + 15 * 60000;
    do {
      status = await tool('export_wait', { job, timeoutSeconds: 10 });
      console.log('Export:', JSON.stringify(status));
      if (Date.now() > deadline) throw new Error('Export exceeds 15 minute offline budget');
    } while (!['done', 'failed', 'cancelled', 'completed', 'succeeded'].includes(status.state ?? status.status));
    if (!['done', 'completed', 'succeeded'].includes(status.state ?? status.status)) throw new Error(JSON.stringify(status));
  }
} finally {
  try { await tool('project_close', { path: project }); } catch { /* A failed create may not have opened a project. */ }
  await writeFile(path.join(revision, exportOnly ? 'concat-export.json' : 'concat-edit.json'), JSON.stringify(evidence, null, 2) + '\n');
  for (const p of pending.values()) clearTimeout(p.timer);
  child.stdin.end();
  child.kill();
}
