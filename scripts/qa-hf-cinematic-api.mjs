// Local synthetic HTTP servers only: security/transport checks, no real GPU requests.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { generateAuthenticatedTake } from './hf-cinematic-api.mjs';

const parameterNames = ['input_image', 'prompt', 'steps', 'negative_prompt', 'duration_seconds', 'guidance_scale', 'guidance_scale_2', 'seed', 'randomize_seed'];
const fakeToken = 'hf_synthetic_test_credential_not_valid';
let mode = 'success', posts = 0, externalRequests = 0;
const external = createServer((_req, res) => { externalRequests++; res.end('unexpected'); });
await new Promise(resolve => external.listen(0, '127.0.0.1', resolve));
const externalUrl = `http://127.0.0.1:${external.address().port}`;
let base;
const server = createServer(async (req, res) => {
  assert.equal(req.headers.authorization, `Bearer ${fakeToken}`);
  const json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
  if (req.url === '/gradio_api/info') {
    if (mode === 'redirect') { res.writeHead(302, { Location: externalUrl }); res.end(); return; }
    json({ named_endpoints: { '/generate_video': { parameters: (mode === 'schema' ? [] : parameterNames).map(parameter_name => ({ parameter_name })) } } });
  } else if (req.url === '/gradio_api/upload') {
    for await (const _ of req) void _;
    json(['/tmp/input.png']);
  } else if (req.url === '/gradio_api/call/generate_video') {
    posts++;
    let body = ''; for await (const part of req) body += part;
    const { data } = JSON.parse(body);
    assert.deepEqual(data.slice(2), [4, 'disconnected limbs, detached arms, extra fingers, broken wrists, sliding feet, changing faces, body morphing, camera movement, zoom, pan, cuts, subtitles, text', 5, 1, 1, 110, false]);
    json({ event_id: 'synthetic-job' });
  } else if (req.url === '/gradio_api/queue/data?session_hash=synthetic-job') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    if (mode === 'quota') { res.end(`data: ${JSON.stringify({msg:'process_completed',success:false,output:{error:'You have exceeded quota '+fakeToken}})}\n\n`); return; }
    res.write('event: heartbeat\r');
    await new Promise(resolve => setTimeout(resolve, 10));
    res.write('\ndata: null\r\n\r\n');
    res.end(`data: ${JSON.stringify({msg:'process_completed',success:true,output:{data:[{url:(mode === 'external-result' ? externalUrl : base)+'/gradio_api/file=/tmp/result.mp4'},110]}})}\n\n`);
  } else if (req.url === '/gradio_api/file=/tmp/result.mp4') {
    res.end(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom')]));
  } else { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
base = `http://127.0.0.1:${server.address().port}`;
const report = { passed: false, syntheticOnly: true, paidOrGpuRequests: 0, cases: [] };
try {
  for (mode of ['success', 'quota', 'redirect', 'schema', 'external-result']) {
    posts = 0;
    const receipt = {};
    try {
      const bytes = await generateAuthenticatedTake({ space: base, token: fakeToken, inputBytes: Buffer.from('synthetic'),
        inputName: 'input.png', prompt: 'test', seconds: 5, seed: 110, timeout: 30, report: receipt, save: async () => {} });
      assert.equal(mode, 'success'); assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
    } catch (error) {
      assert.notEqual(mode, 'success');
      assert.equal(String(error).includes(fakeToken), false);
      if (mode === 'quota') assert.match(String(error), /exceeded quota/);
      if (mode === 'schema') assert.match(String(error), /API changed/);
      if (mode === 'external-result') assert.match(String(error), /Unexpected result host/);
    }
    assert.equal(posts, ['redirect', 'schema'].includes(mode) ? 0 : 1);
    assert.equal(externalRequests, 0);
    assert.equal(JSON.stringify(receipt).includes(fakeToken), false);
    report.cases.push({ mode, generationPosts: posts, noRetries: true, noTokenLeak: true });
  }
  report.passed = true;
} finally {
  server.closeAllConnections(); external.closeAllConnections();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => external.close(resolve))]);
  const out = process.env.QA_OUT ?? 'docs/cinematic-opening/qa';
  await mkdir(out, { recursive: true });
  await writeFile(`${out}/hf-transport.json`, JSON.stringify(report, null, 2)+'\n');
}
console.log(JSON.stringify(report, null, 2));
