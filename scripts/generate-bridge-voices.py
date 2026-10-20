"""Offline PT-BR voice proof. Run with the isolated kokoro-onnx environment.

Models stay under ignored .local/models. No account, API request or voice clone.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening/revision-02'
MODEL = ROOT / '.local/models/kokoro/kokoro-v1.0.int8.onnx'
VOICES = MODEL.with_name('voices-v1.0.bin')
plan = json.loads((DOC / 'dialogue.json').read_text(encoding='utf-8'))
out = DOC / 'voices'
out.mkdir(parents=True, exist_ok=True)
options = ort.SessionOptions()
options.intra_op_num_threads = 2
options.inter_op_num_threads = 1
session = ort.InferenceSession(str(MODEL), sess_options=options, providers=['CPUExecutionProvider'])


class TypedSession:
    """0.5.0 sends int32 speed for input_ids exports; this model declares float.

    Respect the ONNX signature rather than editing installed third-party code.
    """
    _model_path = str(MODEL)

    def get_inputs(self):
        return session.get_inputs()

    def run(self, outputs, inputs):
        dtypes = {'tensor(float)': np.float32, 'tensor(int64)': np.int64, 'tensor(int32)': np.int32}
        return session.run(outputs, {s.name: np.asarray(inputs[s.name], dtype=dtypes[s.type])
                                     for s in session.get_inputs()})


engine = Kokoro.from_session(TypedSession(), str(VOICES))
report = {'engine': 'kokoro-onnx 0.5.0, CPU, Kokoro-82M int8', 'language': 'pt-br',
          'modelSha256': hashlib.sha256(MODEL.read_bytes()).hexdigest(),
          'voicesSha256': hashlib.sha256(VOICES.read_bytes()).hexdigest(),
          'voiceClone': False, 'paidService': False, 'humanApproval': 'pending', 'lines': []}
for line in plan['lines']:
    samples, sr = engine.create(line['text'], voice=line['voice'], speed=line['speed'], lang='pt-br')
    seconds = len(samples) / sr
    if seconds > line['end'] - line['start']:
        raise RuntimeError(f"{line['id']} exceeds its window ({seconds:.2f}s); adjust delivery, never cut words")
    assert np.isfinite(samples).all() and np.max(np.abs(samples)) > .02
    # Short fades avoid edge clicks, keep all generated words.
    fade = min(int(sr * .008), len(samples)//2)
    samples[:fade] *= np.linspace(0, 1, fade)
    samples[-fade:] *= np.linspace(1, 0, fade)
    file = out / f"{line['id']}.wav"
    sf.write(file, samples, sr, subtype='PCM_16')
    entry = {**line, 'seconds': seconds, 'sampleRate': sr, 'peak': float(np.max(np.abs(samples))),
             'path': file.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()}
    report['lines'].append(entry)
    print(json.dumps({'id': line['id'], 'seconds': seconds, 'peak': entry['peak']}), flush=True)
(DOC / 'voice-report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
