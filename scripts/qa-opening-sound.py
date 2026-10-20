"""Check voice priority, level vs approved mix, source identity and picture packets."""
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
REVISION=os.environ.get('CINEMATIC_REVISION', 'revision-05')
assert REVISION in ['revision-05', 'revision-06']
DOC=ROOT/'docs/cinematic-opening'/REVISION
WORK=ROOT/'.local/cinematic-opening'/REVISION
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
assert abs(new['integratedLUFS']-old['integratedLUFS'])<=design.get('integratedLoudnessToleranceLU',1.5),(new,old)
assert new['truePeakDBFS']<-3 and np.max(np.abs(current))<.8
assert all(l['marginDB']>=design['targetSpeechMarginDB']-.2 for l in design['lines'])
if REVISION == 'revision-06':
    previous_work=ROOT/'.local/cinematic-opening/revision-05'
    assert (WORK/'music-bed.wav').read_bytes()==(previous_work/'music-bed.wav').read_bytes()
    assert hashlib.sha256((ROOT/'public/assets/cinematic-opening/opening-music.m4a').read_bytes()).hexdigest()=='fb3f17085d5fc3567201964fed68eb8a596aa22f4f625904d30ba4143eb98b6b'
    effects=pcm(WORK/'scene-effects.wav'); old_effects=pcm(previous_work/'scene-effects.wav')
    unchanged=np.ones(len(effects),dtype=bool)
    for cue in design['cues']:
        unchanged[round(cue['start']*48000):round((cue['start']+cue['seconds'])*48000)]=False
    assert np.array_equal(effects[unchanged],old_effects[unchanged]),'Unrelated foley changed'
voices=json.loads((DOC/'voice-report.json').read_text(encoding='utf-8'))
for line in voices['lines']:
    assert hashlib.sha256((ROOT/line['path']).read_bytes()).hexdigest()==line['sha256']
exports=json.loads((DOC/'exports.json').read_text(encoding='utf-8'))
assert all(v['videoUnchanged'] for v in exports.values())
report=dict(passed=True,humanApproval='pending: engine audibility on user devices' if REVISION=='revision-06' else 'pending: musical taste and final listening on user devices',
            current=new,previous=old,integratedDifferenceLU=new['integratedLUFS']-old['integratedLUFS'],
            renderedMixCorrelation=correlation,minimumDialogueMarginDB=min(l['marginDB'] for l in design['lines']),
            unchangedSpeechFiles=len(voices['lines']),unchangedVideoStreams=len(exports),
            peak=float(np.max(np.abs(current))),rms=float(np.sqrt(np.mean(current**2))),
            notes='Checks rendered content/levels. Does not certify subjective sound quality or replace listening on headphones/speakers.')
(DOC/'qa').mkdir(exist_ok=True)
(DOC/'qa/sound-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
