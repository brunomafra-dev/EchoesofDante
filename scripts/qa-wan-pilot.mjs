// All HTTP is mocked. Never uses the configured account or spends credits.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, ENDPOINT } from './generate-wan-pilot.mjs';

const source = await readFile(fileURLToPath(new URL('../public/assets/cinematic-pilot/bridge-whole-characters.webp', import.meta.url)));
const media = Buffer.from([0, 0, 0, 24, ...Buffer.from('ftypisom'), 0, 0, 0, 0]);
const receipt = {
  request_id: 'test-request', status_url: 'https://queue.fal.run/fal-ai/wan/requests/test-request/status',
  response_url: 'https://queue.fal.run/fal-ai/wan/requests/test-request',
  cancel_url: 'https://queue.fal.run/fal-ai/wan/requests/test-request/cancel',
};
const response = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

async function fixture(t, overrides = {}) {
  const stateDir = await mkdtemp(path.join(tmpdir(), 'dante-wan-qa-'));
  assert.equal(path.dirname(stateDir), path.resolve(tmpdir()));
  assert.ok(path.basename(stateDir).startsWith('dante-wan-qa-'));
  t.after(() => rm(stateDir, { recursive: true, force: true }));
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (overrides.fetch) return overrides.fetch(String(url), options);
    if (String(url).startsWith('https://api.fal.ai/')) return response({ prices: [{
      endpoint_id: ENDPOINT, unit_price: 0.15, unit: 'video', currency: 'USD', ...overrides.price,
    }] });
    if (String(url).startsWith('https://echosofdante.vercel.app/')) return new Response(overrides.image ?? source);
    if (options.method === 'POST') {
      if (overrides.submitError) throw new Error('simulated network loss');
      return response(overrides.receipt ?? receipt);
    }
    if (String(url).endsWith('/status')) return response({ status: overrides.status ?? 'COMPLETED' });
    if (String(url).startsWith('https://queue.fal.run/')) return response({ video: { url: 'https://v3.fal.media/files/test.mp4' } });
    if (String(url).startsWith('https://v3.fal.media/')) return new Response(overrides.media ?? media);
    assert.fail(`Unexpected HTTP request: ${url}`);
  };
  const invoke = options => run({ key: 'fake-test-key', stateDir, fetchImpl, log() {}, ...options });
  return { calls, stateDir, invoke };
}

test('dry-run has zero HTTP and ignores any key', async t => {
  const f = await fixture(t);
  const preview = await f.invoke({ mode: 'dry-run' });
  assert.equal(f.calls.length, 0);
  assert.equal(preview.input.num_frames, 121);
  assert.equal(preview.input.interpolator_model, 'none');
});

test('missing key cannot submit', async t => {
  const f = await fixture(t);
  await assert.rejects(f.invoke({ mode: 'generate', key: '' }), /FAL_KEY/);
  assert.equal(f.calls.length, 0);
});

for (const price of [{ unit_price: 0.16 }, { unit: 'second' }, { currency: 'EUR' }, { unit_price: '0.15' }]) {
  test(`unapproved pricing stops before POST: ${JSON.stringify(price)}`, async t => {
    const f = await fixture(t, { price });
    await assert.rejects(f.invoke({ mode: 'generate' }), /Preço/);
    assert.equal(f.calls.length, 1);
    assert.ok(f.calls.every(c => c.options.method !== 'POST'));
  });
}

test('changed public image stops before POST', async t => {
  const f = await fixture(t, { image: 'different image' });
  await assert.rejects(f.invoke({ mode: 'generate' }), /Imagem pública/);
  assert.equal(f.calls.filter(c => c.options.method === 'POST').length, 0);
});

test('one POST, saved receipt, resume downloads without forwarding key; no new POST', async t => {
  const f = await fixture(t);
  await f.invoke({ mode: 'generate' });
  const saved = JSON.parse(await readFile(path.join(f.stateDir, 'request.json'), 'utf8'));
  assert.equal(saved.requestId, receipt.request_id);
  assert.equal(saved.statusURL, receipt.status_url);
  assert.ok(!JSON.stringify(saved).includes('fake-test-key'));
  await assert.rejects(f.invoke({ mode: 'generate' }), /já possui recibo/);
  const downloaded = await f.invoke({ mode: 'resume' });
  assert.equal(downloaded.state, 'downloaded');
  assert.deepEqual(await readFile(path.join(f.stateDir, 'bridge-wan-unreviewed.mp4')), media);
  const posts = f.calls.filter(c => c.options.method === 'POST');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].options.headers['X-Fal-No-Retry'], '1');
  assert.equal(posts[0].options.redirect, 'error');
  const cdn = f.calls.find(c => c.url.startsWith('https://v3.fal.media/'));
  assert.equal(cdn.options.headers, undefined);
  const count = f.calls.length;
  await f.invoke({ mode: 'resume' });
  assert.equal(f.calls.length, count, 'already downloaded needs no network');
});

test('concurrent generate commands make only one POST', async t => {
  const f = await fixture(t);
  const results = await Promise.allSettled([f.invoke({ mode: 'generate' }), f.invoke({ mode: 'generate' })]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(f.calls.filter(c => c.options.method === 'POST').length, 1);
});

test('ambiguous submit timeout permanently blocks automatic resubmission', async t => {
  const f = await fixture(t, { submitError: true });
  await assert.rejects(f.invoke({ mode: 'generate' }), /conexão/);
  await assert.rejects(f.invoke({ mode: 'generate' }), /já possui recibo/);
  await assert.rejects(f.invoke({ mode: 'resume' }), /resultado incerto/);
  assert.equal(f.calls.filter(c => c.options.method === 'POST').length, 1);
});

test('queue URL outside fal refused after saving ID, never receives key', async t => {
  const f = await fixture(t, { receipt: { ...receipt, status_url: 'https://untrusted.example/status' } });
  await assert.rejects(f.invoke({ mode: 'generate' }), /URL da fila/);
  const saved = JSON.parse(await readFile(path.join(f.stateDir, 'request.json'), 'utf8'));
  assert.equal(saved.requestId, receipt.request_id);
  assert.ok(f.calls.every(c => !c.url.includes('untrusted.example')));
});

test('pending status resumes same request, never starts another generation', async t => {
  const f = await fixture(t, { status: 'IN_PROGRESS' });
  await f.invoke({ mode: 'generate' });
  assert.equal((await f.invoke({ mode: 'resume' })).state, 'IN_PROGRESS');
  assert.equal((await f.invoke({ mode: 'resume' })).state, 'IN_PROGRESS');
  assert.equal(f.calls.filter(c => c.options.method === 'POST').length, 1);
});

test('resume with no receipt never submits', async t => {
  const f = await fixture(t);
  await assert.rejects(f.invoke({ mode: 'resume' }), /Nenhum pedido/);
  assert.equal(f.calls.length, 0);
});

test('HTML masquerading as video is rejected', async t => {
  const f = await fixture(t, { media: '<html>not a video</html>' });
  await f.invoke({ mode: 'generate' });
  await assert.rejects(f.invoke({ mode: 'resume' }), /cabeçalho MP4/);
});

test('modified receipt cannot redirect credentials on resume', async t => {
  const f = await fixture(t);
  await f.invoke({ mode: 'generate' });
  const file = path.join(f.stateDir, 'request.json');
  const saved = JSON.parse(await readFile(file, 'utf8'));
  await writeFile(file, JSON.stringify({ ...saved, statusURL: 'https://other.example/status' }));
  await assert.rejects(f.invoke({ mode: 'resume' }), /URL da fila/);
  assert.ok(f.calls.every(c => !c.url.includes('other.example')));
});
