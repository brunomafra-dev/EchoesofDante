// Documented Gradio REST endpoint of the same free Space used by the public UI.
// Tokens are sent only to that exact origin, redirects forbidden; never logged.
export async function generateAuthenticatedTake({ space, token, inputBytes, inputName, prompt, seconds, seed, timeout, report, save }) {
  async function request(endpoint, options = {}) {
    const url = new URL(endpoint, space);
    if (url.origin !== space) throw new Error('Untrusted generation origin.');
    const response = await fetch(url, { ...options, redirect: 'error',
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeout * 1000) });
    if (!response.ok) throw new Error(`Space HTTP ${response.status()}: ${(await response.text()).slice(0, 500).replaceAll(token, '[redacted]')}`);
    return response;
  }
  const info = await request('/gradio_api/info').then(r => r.json());
  const expected = ['input_image', 'prompt', 'steps', 'negative_prompt', 'duration_seconds', 'guidance_scale', 'guidance_scale_2', 'seed', 'randomize_seed'];
  const parameters = info.named_endpoints?.['/generate_video']?.parameters?.map(p => p.parameter_name);
  if (JSON.stringify(parameters) !== JSON.stringify(expected)) throw new Error('Space API changed. Inspect before submitting.');
  const form = new FormData();
  form.append('files', new Blob([inputBytes]), inputName);
  const uploaded = await request('/gradio_api/upload', { method: 'POST', body: form }).then(r => r.json());
  if (!Array.isArray(uploaded) || uploaded.length !== 1 || typeof uploaded[0] !== 'string') throw new Error('Unexpected upload response.');
  const negative = 'disconnected limbs, detached arms, extra fingers, broken wrists, sliding feet, changing faces, body morphing, camera movement, zoom, pan, cuts, subtitles, text';
  // Exactly one generation POST. No retries, account switching or billing endpoint.
  const job = await request('/gradio_api/call/generate_video', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ path: uploaded[0], meta: { _type: 'gradio.FileData' } }, prompt, 4, negative, seconds, 1, 1, seed, false] }),
  }).then(r => r.json());
  if (!/^[a-zA-Z0-9-]+$/.test(job.event_id)) throw new Error('Invalid event ID; do not resubmit before inspection.');
  report.status = 'submitted'; report.transport = 'Authenticated Gradio REST; no redirects'; report.eventId = job.event_id;
  await save();
  console.log('Submitted one request using the user account quota. No automatic retries.');
  // The simplified /call stream discards output.error and reports only null.
  // Read the regular stream for the SAME event, without submitting another job.
  const events = await request(`/gradio_api/queue/data?session_hash=${job.event_id}`);
  const reader = events.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', result, lastPrint = 0;
  try {
    while (!result) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer = (buffer + decoder.decode(value, { stream: true })).replaceAll('\r\n', '\n');
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        const kind = block.match(/^event: (.+)$/m)?.[1];
        const raw = block.split('\n').filter(l => l.startsWith('data: ')).map(l => l.slice(6)).join('\n');
        if (!kind && raw) {
          const message = JSON.parse(raw);
          if (message.msg === 'process_completed') {
            if (!message.success) throw new Error(`Space rejected generation: ${String(message.output?.error ?? message.message ?? 'No detailed reason provided').replaceAll(token, '[redacted]')}`);
            result = message.output?.data;
          } else if (message.msg === 'unexpected_error') {
            throw new Error(`Space error: ${String(message.message ?? 'Unknown').replaceAll(token, '[redacted]')}`);
          }
        }
        if (kind === 'error') throw new Error(`Space rejected generation: ${raw.slice(0, 1200).replaceAll(token, '[redacted]')}`);
        if (kind === 'complete') result = JSON.parse(raw);
      }
      if (Date.now() - lastPrint > 20000) { console.log('Waiting for the same generation event.'); lastPrint = Date.now(); }
    }
  } finally { await reader.cancel().catch(() => {}); }
  if (!result) throw new Error('Event stream ended without result. Do not submit the same job again.');
  const file = result[0]?.video ?? result[0];
  const url = new URL(file.url ?? `/gradio_api/file=${file.path}`, space);
  if (url.origin !== space) throw new Error('Unexpected result host; inspect manually.');
  const bytes = Buffer.from(await request(url.href).then(r => r.arrayBuffer()));
  if (bytes.toString('ascii', 4, 8) !== 'ftyp') throw new Error('Result is not an MP4.');
  report.actualSeed = result[1];
  return bytes;
}
