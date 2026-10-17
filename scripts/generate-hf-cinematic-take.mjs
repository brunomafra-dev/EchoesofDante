// Offline authoring through the normal public demo UI. Optional user's HF identity;
// no paid API, retry, alternate account or quota workaround.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateAuthenticatedTake } from './hf-cinematic-api.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const space = 'https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space';
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--input', '--prompt', '--seconds', '--seed', '--out', '--timeout-seconds'].includes(args[i]) || !args[i + 1]) {
    throw new Error('Expected --input FILE --prompt FILE --seconds 0.5..5 --seed NUMBER --out .local/DIR');
  }
  options[args[i].slice(2)] = args[i + 1];
}
if (!options.input || !options.prompt || !options.out) throw new Error('Input, prompt and output required.');
const seconds = Number(options.seconds);
const seed = Number(options.seed ?? 108);
const timeout = Number(options['timeout-seconds'] ?? 240);
if (!Number.isFinite(timeout) || timeout < 30 || timeout > 900) throw new Error('Timeout must be 30..900 seconds.');
if (!Number.isFinite(seconds) || seconds < 0.5 || seconds > 5 || !Number.isSafeInteger(seed) || seed < 0) {
  throw new Error('Invalid duration or seed.');
}
const out = path.resolve(root, options.out);
const relative = path.relative(path.join(root, '.local'), out);
if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output must stay in .local.');
const input = path.resolve(root, options.input);
const prompt = (await readFile(path.resolve(root, options.prompt), 'utf8')).trim();
const hfToken = process.env.HF_TOKEN?.trim();
if (hfToken) {
  const identity = await fetch('https://huggingface.co/api/whoami-v2', { headers: { Authorization: `Bearer ${hfToken}` }, redirect: 'error' });
  if (!identity.ok()) throw new Error(`Hugging Face authentication HTTP ${identity.status()}; nothing submitted.`);
}
const sourceHash = createHash('sha256').update(await readFile(input)).digest('hex');
await mkdir(out, { recursive: true });
const receiptFile = path.join(out, 'attempt.json');
const report = { space, authenticated: Boolean(hfToken), paidCredentialsUsed: false, requestedSeconds: seconds,
  steps: 4, seed, sourceHash, prompt, startedAt: new Date().toISOString(), status: 'preparing' };
await writeFile(receiptFile, JSON.stringify(report, null, 2), { flag: 'wx' });
if (hfToken) {
  try {
    const bytes = await generateAuthenticatedTake({ space, token: hfToken, inputBytes: await readFile(input),
      inputName: path.basename(input), prompt, seconds, seed, timeout, report,
      save: () => writeFile(receiptFile, JSON.stringify(report, null, 2)) });
    await writeFile(path.join(out, 'take.mp4'), bytes);
    report.status = 'downloaded'; report.bytes = bytes.length;
    report.videoHash = createHash('sha256').update(bytes).digest('hex');
    console.log(`Downloaded ${bytes.length} bytes for inspection.`);
  } catch (error) {
    report.status = 'failed'; report.error = String(error).replaceAll(hfToken, '[redacted]');
    process.exitCode = 1; console.error(report.error);
  } finally {
    report.finishedAt = new Date().toISOString();
    await writeFile(receiptFile, JSON.stringify(report, null, 2) + '\n');
  }
} else {
const browser = await chromium.launch({ channel: 'chrome' });
let page;
let receiptWrite = Promise.resolve();
try {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page = p;
  p.on('response', response => {
    if (!response.url().includes('/queue/join')) return;
    receiptWrite = receiptWrite.then(async () => {
      const payload = response.request().postDataJSON();
      report.queue = { status: response.status(), sessionHash: payload?.session_hash,
        response: await response.json().catch(() => ({ unreadable: true })) };
      await writeFile(receiptFile, JSON.stringify(report, null, 2));
    });
  });
  await p.goto(space, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.locator('input[type="file"]').first().setInputFiles(input);
  await p.waitForFunction(() => Array.from(document.images).some(img => img.complete && img.naturalWidth > 500 && img.src.includes('/file=')));
  await p.getByLabel('Prompt', { exact: true }).fill(prompt);
  await p.locator('input[aria-label="number input for Duration (seconds)"]').fill(String(seconds));
  await p.getByText('Advanced Settings', { exact: true }).click();
  await p.locator('input[aria-label="number input for Inference Steps"]').fill('4');
  await p.locator('input[aria-label="number input for Seed"]').fill(String(seed));
  await p.getByLabel('Randomize seed', { exact: true }).uncheck();
  await p.getByLabel('Negative Prompt', { exact: true }).fill('disconnected limbs, detached arms, extra fingers, broken wrists, sliding feet, changing faces, body morphing, camera movement, zoom, pan, cuts, subtitles, text');
  await p.screenshot({ path: path.join(out, 'before.png') });
  report.status = 'submitted';
  await writeFile(receiptFile, JSON.stringify(report, null, 2));
  await p.getByRole('button', { name: 'Generate Video', exact: true }).click();
  console.log('Submitted one free demo request. No automatic retries.');
  const start = Date.now();
  let printedAt = 0;
  while (Date.now() - start < timeout * 1000) {
    const videos = await p.locator('video').evaluateAll(els => els.map(e => e.currentSrc || e.src).filter(Boolean));
    const body = await p.locator('body').innerText();
    if (videos.length) {
      const url = new URL(videos[0]);
      if (url.origin !== space) throw new Error('Unexpected media origin; inspect manually.');
      const response = await p.request.get(url.href, { timeout: 60000, maxRedirects: 0 });
      if (!response.ok()) throw new Error(`Media download HTTP ${response.status()}`);
      const bytes = await response.body();
      if (bytes.toString('ascii', 4, 8) !== 'ftyp') throw new Error('Result is not an MP4.');
      await writeFile(path.join(out, 'take.mp4'), bytes);
      report.status = 'downloaded'; report.bytes = bytes.length;
      report.videoHash = createHash('sha256').update(bytes).digest('hex');
      break;
    }
    const error = body.match(/You have exceeded[^\n]{0,450}/i)
      ?? body.match(/.{0,80}(?:exceeded.{0,40}quota|GPU quota|quota.{0,40}exceeded|\bError\b|\bErro\b).{0,450}/i);
    if (error) throw new Error(error[0]);
    if (Date.now() - printedAt > 20000) { console.log('Waiting for the same request: ' + Math.round((Date.now() - start) / 1000) + 's'); printedAt = Date.now(); }
    await p.waitForTimeout(3000);
  }
  if (report.status !== 'downloaded') throw new Error('No result before deadline. Do not resubmit without checking the attempt.');
  await p.screenshot({ path: path.join(out, 'after.png') });
  console.log(`Downloaded ${report.bytes} bytes for inspection.`);
} catch (error) {
  report.status = 'failed'; report.error = String(error); process.exitCode = 1;
  if (page) {
    await page.screenshot({ path: path.join(out, 'failed.png'), fullPage: true }).catch(() => {});
    await writeFile(path.join(out, 'failed-page.txt'), await page.locator('body').innerText().catch(() => '')).catch(() => {});
  }
  console.error(report.error);
} finally {
  await receiptWrite;
  report.finishedAt = new Date().toISOString();
  await writeFile(receiptFile, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
}
