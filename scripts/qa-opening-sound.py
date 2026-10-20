"""Check voice priority, level vs approved mix, source identity and picture packets."""
import hashlib
import json
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/cinematic-opening/revision-05'
WORK=ROOT/'.local/cinematic-opening/revision-05'
FF=imageio_ffmpeg.get_ffmpeg_exe()
VIDEO=ROOT/'public/assets/cinematic-opening/arrival-whole-scene.mp4'
design=json.loads((DOC/'sound-design.json').read_text(encoding='utf-8'))


def pcm(file):
    r=subprocess.run([FF,'-v','error','-i',str(file),'-ar','48000','-ac','2','-f','f32le','-'],capture_output=True,check=True)
    return np.frombuffer(r.stdout,dtype='<f4').reshape(-1,2)


def loudness(file):
    r=subprocess.run([FF,'-v','info','-i',str(file),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,check=True)
    tail=r.stderr.decode(errors='replace').split('Summary:')[-1]
    return dict(integratedLUFS=float(re.search(r'I:\s*([-\d.]+) LUFS',tail)[1]),
                truePeakDBFS=float(re.search(r'Peak:\s*([-\d.]+) dBFS',tail)[1]))


current=pcm(VIDEO);reference=pcm(WORK/'expected-mix.wav')
n=min(len(current),len(reference))
correlation=float(np.corrcoef(current[:n].ravel(),reference[:n].ravel())[0,1])
assert correlation>.97,('Wrong or doubled mix',correlation)
new=loudness(VIDEO);old=loudness(WORK/'approved-film.mp4')
assert abs(new['integratedLUFS']-old['integratedLUFS'])<=1.5,(new,old)
assert new['truePeakDBFS']<-3 and np.max(np.abs(current))<.8
assert all(l['marginDB']>=15.5 for l in design['lines'])
voices=json.loads((DOC/'voice-report.json').read_text(encoding='utf-8'))
for line in voices['lines']:
    assert hashlib.sha256((ROOT/line['path']).read_bytes()).hexdigest()==line['sha256']
exports=json.loads((DOC/'exports.json').read_text(encoding='utf-8'))
assert all(v['videoUnchanged'] for v in exports.values())
report=dict(passed=True,humanApproval='pending: musical taste and final listening on user devices',
            current=new,previous=old,integratedDifferenceLU=new['integratedLUFS']-old['integratedLUFS'],
            renderedMixCorrelation=correlation,minimumDialogueMarginDB=min(l['marginDB'] for l in design['lines']),
            unchangedSpeechFiles=len(voices['lines']),unchangedVideoStreams=len(exports),
            peak=float(np.max(np.abs(current))),rms=float(np.sqrt(np.mean(current**2))),
            notes='Checks rendered content/levels. Does not certify subjective sound quality or replace listening on headphones/speakers.')
(DOC/'qa').mkdir(exist_ok=True)
(DOC/'qa/sound-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
