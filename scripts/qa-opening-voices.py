"""Validate the Concat output contains each exact generated voice at its cue.

This is a timing/mix check, not approval of pronunciation or lip synchronization.
"""
import hashlib
import json
import os
import subprocess
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
revision = os.environ.get('QA_REVISION', 'revision-02')
DOC = ROOT/f'docs/cinematic-opening/{revision}'
full = revision in ['revision-03', 'revision-04', 'revision-05']
video = ROOT/('public/assets/cinematic-opening/arrival-whole-scene.mp4' if full else 'public/assets/cinematic-opening/bridge-voice-proof.mp4')
plan = json.loads((DOC/'dialogue.json').read_text(encoding='utf-8'))
voices = json.loads((DOC/'voice-report.json').read_text(encoding='utf-8'))
exports = json.loads((DOC/'exports.json').read_text(encoding='utf-8'))
assert exports['film' if full else 'voiceProof']['sha256'] == hashlib.sha256(video.read_bytes()).hexdigest()
cap = cv2.VideoCapture(str(video))
assert (cap.get(3),cap.get(4),cap.get(5),cap.get(7)) == (1280,720,24,round(plan['seconds']*24))
cap.release()
# Resample to native voice rate, mono. AAC encoder delay is accounted for by MP4.
decoded = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(video),
                          '-map','0:a:0','-ar','24000','-ac','1','-f','f32le','-'],capture_output=True,check=True)
audio = np.frombuffer(decoded.stdout,dtype='<f4')
assert abs(len(audio)/24000-plan['seconds'])<.05 and np.isfinite(audio).all()
report = {'passed':False,'humanApproval':'pending','seconds':len(audio)/24000,
          'peak':float(np.max(np.abs(audio))),'rms':float(np.sqrt(np.mean(audio**2))), 'lines':[]}
assert report['peak']<.95 and .02<report['rms']<.25
if full:
    assert len({s['voice'] for s in plan['casting'].values()}) == len(plan['casting']) == 3
for line in voices['lines']:
    if full:
        assert line['voice'] == plan['casting'][line['speaker']]['voice']
        if line.get('reuse'):
            assert hashlib.sha256((ROOT/line['reuse']).read_bytes()).hexdigest() == line['sha256']
    file = ROOT/line['path']
    assert hashlib.sha256(file.read_bytes()).hexdigest() == line['sha256']
    with wave.open(str(file),'rb') as f:
        assert f.getframerate()==24000 and f.getnchannels()==1
        original = np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').astype(np.float32)/32768
    position = round(line['start']*24000)
    mixed = audio[position:position+len(original)]
    correlation = float(np.corrcoef(original,mixed)[0,1])
    # Speech must actually be in the rendered MP4; metadata alone is insufficient.
    assert correlation>.86, (line['id'],correlation)
    assert line['start']+len(original)/24000<line['end']
    report['lines'].append({'id':line['id'],'voice':line['voice'],'start':line['start'],
                            'seconds':len(original)/24000,'correlationWithRenderedAudio':correlation})
report['passed']=True
(DOC/'qa').mkdir(parents=True,exist_ok=True)
(DOC/'qa/voice-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
