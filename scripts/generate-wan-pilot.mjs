// Offline authoring only. Never imported by the game or given a VITE_* key.
import { readFile, writeFile, mkdir, rename, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const ENDPOINT = 'fal-ai/wan/v2.2-5b/image-to-video';
export const MAX_PRICE_USD = 0.15;
const SOURCE = 'public/assets/cinematic-pilot/bridge-whole-characters.webp';
const IMAGE_URL = 'https://echosofdante.vercel.app/assets/cinematic-pilot/bridge-whole-characters.webp';
const PROMPT = 'docs/cinematic-pilot/revision-02/wan-test-prompt.txt';
const MAX_BYTES = 100 * 1024 * 1024;

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
async function exists(file) {
  try { await access(file); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; }
}
async function save(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await rename(temp, file);
}
function queueURL(value) {
  const url = new URL(value);
  if (url.origin !== 'https://queue.fal.run' || url.username || url.password || url.hash) {
    throw new Error('URL da fila inesperada. Pedido preservado; não reenviar.');
  }
  return url.href;
}
async function request(fetchImpl, url, options = {}) {
  // No retry, including POST. Never follow redirects carrying a credential.
  let response;
  try {
    response = await fetchImpl(url, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error('Falha de conexão ou timeout. Não houve reenvio automático.');
  }
  if (!response.ok) throw new Error(`Serviço respondeu HTTP ${response.status}. Não houve reenvio automático.`);
  return response;
}
async function json(fetchImpl, url, options) {
  try { return await (await request(fetchImpl, url, options)).json(); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('Resposta inválida do serviço. Pedido local preservado.');
    throw error;
  }
}
async function download(fetchImpl, url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('URL de vídeo inválida. Nenhum download foi feito.');
  }
  // Deliberately no Authorization on the media CDN request.
  const response = await request(fetchImpl, parsed.href);
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Vídeo excede 100 MiB.');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > MAX_BYTES) throw new Error('Vídeo excede 100 MiB.');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.length < 12 || bytes.toString('ascii', 4, 8) !== 'ftyp') {
    throw new Error('Resultado não tem cabeçalho MP4. Não publicar.');
  }
  return bytes;
}

export async function run({ mode = 'dry-run', key = process.env.FAL_KEY, fetchImpl = fetch,
  stateDir = path.join(ROOT, '.local/cinematic-pilot/wan-test-01'), log = console.log } = {}) {
  if (!['dry-run', 'generate', 'resume'].includes(mode)) throw new Error('Modo inválido.');
  const input = {
    image_url: IMAGE_URL,
    prompt: (await readFile(path.join(ROOT, PROMPT), 'utf8')).trim(),
    negative_prompt: 'disconnected limbs, detached arms, extra limbs, extra fingers, broken wrists, twisted knees, sliding feet, body morphing, changing faces, cutout puppet, triangular low-poly, photorealistic style, zoom, pan, camera movement, cuts, slideshow, text, subtitles',
    num_frames: 121, frames_per_second: 24, resolution: '720p', aspect_ratio: '16:9',
    seed: 106, num_inference_steps: 40, guidance_scale: 3.5, shift: 5,
    enable_prompt_expansion: false, enable_safety_checker: true, enable_output_safety_checker: true,
    interpolator_model: 'none', num_interpolated_frames: 0,
    video_quality: 'high', video_write_mode: 'balanced',
  };
  if (mode === 'dry-run') {
    const preview = { endpoint: ENDPOINT, estimatedUSD: MAX_PRICE_USD, input,
      note: 'Simulação offline: zero chamadas, zero cobrança. Cerca de 5 s; ainda não é o piloto de 12 s.' };
    log(JSON.stringify(preview, null, 2));
    return preview;
  }
  if (!key?.trim() || /[\r\n]/.test(key)) {
    throw new Error('FAL_KEY ausente ou inválida. Execute scripts/wan-pilot.ps1 -Configure localmente. Não envie a chave pelo chat.');
  }
  const headers = { Authorization: `Key ${key.trim()}` };
  const receiptFile = path.join(stateDir, 'request.json');
  let receipt;
  if (mode === 'generate') {
    if (await exists(receiptFile)) {
      throw new Error('Este teste já possui recibo. Use -Resume; não apague o recibo para gerar novamente.');
    }
    const pricing = await json(fetchImpl,
      `https://api.fal.ai/v1/models/pricing?endpoint_id=${encodeURIComponent(ENDPOINT)}`, { headers });
    const price = pricing.prices?.find(p => p.endpoint_id === ENDPOINT);
    if (!price || price.currency !== 'USD' || !['video', 'videos'].includes(price.unit) ||
      typeof price.unit_price !== 'number' || price.unit_price <= 0 || price.unit_price > MAX_PRICE_USD) {
      throw new Error('Preço não confirmado como até US$ 0,15 por vídeo. Geração bloqueada antes do envio.');
    }
    // Refuse a stale/replaced public reference before spending credits.
    const published = Buffer.from(await (await request(fetchImpl, IMAGE_URL)).arrayBuffer());
    const sourceHash = sha256(await readFile(path.join(ROOT, SOURCE)));
    if (sha256(published) !== sourceHash) throw new Error('Imagem pública difere do quadro-base local. Geração bloqueada.');
    receipt = { version: 1, endpoint: ENDPOINT, state: 'submission-uncertain',
      createdAt: new Date().toISOString(), price, input, sourceHash,
      note: 'Um único envio. Se não houver requestId, conferir histórico da conta antes de qualquer nova tentativa.' };
    await mkdir(stateDir, { recursive: true });
    // Exclusive creation prevents two terminals from submitting the same test.
    try { await writeFile(receiptFile, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
    catch (error) {
      if (error.code === 'EEXIST') throw new Error('Outro comando já reservou este teste. Não houve segundo envio.');
      throw error;
    }
    const submitted = await json(fetchImpl, `https://queue.fal.run/${ENDPOINT}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'X-Fal-No-Retry': '1' },
      body: JSON.stringify(input),
    });
    // Save ID before validating any returned URL, so it survives a malformed response.
    receipt.requestId = submitted.request_id;
    receipt.state = 'submitted';
    await save(receiptFile, receipt);
    if (typeof receipt.requestId !== 'string' || !receipt.requestId) throw new Error('Resposta sem request_id. Conferir histórico da conta; não reenviar.');
    receipt.statusURL = queueURL(submitted.status_url);
    receipt.responseURL = queueURL(submitted.response_url);
    if (submitted.cancel_url) receipt.cancelURL = queueURL(submitted.cancel_url);
    await save(receiptFile, receipt);
    log(`Pedido enviado uma vez: ${receipt.requestId}. Use -Resume para consultar e baixar o mesmo pedido.`);
    return { state: 'submitted', requestId: receipt.requestId };
  }

  if (!await exists(receiptFile)) throw new Error('Nenhum pedido local para retomar. -Resume nunca gera outro vídeo.');
  receipt = JSON.parse(await readFile(receiptFile, 'utf8'));
  if (!receipt.requestId || !receipt.statusURL || !receipt.responseURL) {
    throw new Error('Envio com resultado incerto. Confira o histórico da fal.ai; este comando não faz novo POST.');
  }
  if (receipt.state === 'downloaded') {
    const video = await readFile(path.join(stateDir, 'bridge-wan-unreviewed.mp4'));
    if (sha256(video) !== receipt.videoHash) throw new Error('Vídeo local alterado. Conferir recibo antes de publicar.');
    log('Vídeo já baixado; ainda aguarda inspeção visual. Nenhuma chamada realizada.');
    return { state: 'downloaded', bytes: video.length };
  }
  const status = await json(fetchImpl, queueURL(receipt.statusURL), { headers });
  if (status.status !== 'COMPLETED') {
    if (!['IN_QUEUE', 'IN_PROGRESS'].includes(status.status)) {
      throw new Error('Estado inesperado do pedido. Conferir a fal.ai; não houve nova geração.');
    }
    log(`${status.status}: o mesmo pedido continua no serviço. Use -Resume novamente depois.`);
    return { state: status.status, requestId: receipt.requestId };
  }
  const result = await json(fetchImpl, queueURL(receipt.responseURL), { headers });
  if (typeof result.video?.url !== 'string') throw new Error('Pedido concluído sem vídeo. Conferir histórico; não regenerar automaticamente.');
  const video = await download(fetchImpl, result.video.url);
  const tempVideo = path.join(stateDir, `${randomUUID()}.mp4.tmp`);
  await writeFile(tempVideo, video);
  await rename(tempVideo, path.join(stateDir, 'bridge-wan-unreviewed.mp4'));
  await save(receiptFile, { ...receipt, state: 'downloaded', downloadedAt: new Date().toISOString(),
    videoHash: sha256(video), bytes: video.length, visualApproval: 'pending' });
  log(`Vídeo baixado (${video.length} bytes) em ${stateDir}. Inspeção visual pendente; nada foi publicado no jogo.`);
  return { state: 'downloaded', bytes: video.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = process.argv.slice(2);
  const modes = { '--dry-run': 'dry-run', '--generate': 'generate', '--resume': 'resume' };
  if (arg.length > 1 || (arg.length && !modes[arg[0]])) {
    console.error('Uso: node scripts/generate-wan-pilot.mjs [--dry-run|--generate|--resume]');
    process.exitCode = 1;
  } else {
    await run({ mode: modes[arg[0]] ?? 'dry-run' }).catch(error => {
      // Do not print provider bodies, request headers or stack traces containing credentials.
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}
