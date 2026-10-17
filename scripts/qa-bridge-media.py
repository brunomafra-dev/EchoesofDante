"""Technical media verification only; does not approve generated anatomy or acting."""
import hashlib
import json
import os
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OPENING = os.environ.get('QA_FILM') == 'opening'
WORKPRINT = os.environ.get('QA_FILM') == 'workprint'
PRODUCTION = OPENING or WORKPRINT
DOC = ROOT / ('docs/cinematic-opening' if PRODUCTION else 'docs/cinematic-pilot/revision-04')
OUT = Path(os.environ.get('QA_OUT', DOC / 'qa'))
OUT.mkdir(parents=True, exist_ok=True)
media = ROOT / ('public/assets/cinematic-opening/opening-workprint.mp4' if WORKPRINT else 'public/assets/cinematic-opening/arrival-whole-scene.mp4' if OPENING else 'public/assets/cinematic-pilot/bridge-whole-scene-pilot.mp4')
manifest = json.loads((DOC / ('workprint-media.json' if WORKPRINT else 'media.json')).read_text(encoding='utf-8'))
assert hashlib.sha256(media.read_bytes()).hexdigest() == manifest['output']['sha256']
sources = [source for shot in manifest['shots'] for source in shot['source']] if PRODUCTION else manifest['sources']
for source in sources:
    assert hashlib.sha256((ROOT / source['path']).read_bytes()).hexdigest() == source['sha256']
c = cv2.VideoCapture(str(media))
expected_frames = 864 if WORKPRINT else 1314 if OPENING else 288
expected_duration = 36 if WORKPRINT else 54.75 if OPENING else 12
assert (c.get(3), c.get(4), c.get(5), c.get(7)) == (1280, 720, 24, expected_frames)
count, repeated, run, longest = 0, 0, 0, 0
previous = None
changes = []
while True:
    ok, frame = c.read()
    if not ok:
        break
    assert np.std(frame) > 15, f'Blank frame {count}'
    if previous is not None:
        same = np.array_equal(frame, previous)
        repeated += int(same)
        run = run + 1 if same else 0
        longest = max(longest, run)
        changes.append(float(np.mean(cv2.absdiff(frame, previous))))
    previous = frame
    count += 1
c.release()
assert count == expected_frames
assert longest <= 1, 'Unexpected repeated/frozen frame run'
decoded = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'info', '-i', str(media),
                          '-map', '0:a:0', '-f', 'f32le', '-acodec', 'pcm_f32le', '-'],
                         capture_output=True, check=True)
info = decoded.stderr.decode('utf-8', errors='replace')
assert 'Audio: aac' in info and '48000 Hz, stereo' in info
audio = np.frombuffer(decoded.stdout, dtype='<f4')
audio_seconds = len(audio) / (48000 * 2)
peak = float(np.max(np.abs(audio)))
rms = float(np.sqrt(np.mean(audio**2)))
assert abs(audio_seconds - expected_duration) < 0.05
assert 0.01 < rms < 0.15 and peak < 0.95
vtt = (ROOT / ('public/assets/cinematic-opening/workprint.pt-BR.vtt' if WORKPRINT else 'public/assets/cinematic-opening/arrival.pt-BR.vtt' if OPENING else 'public/assets/cinematic-pilot/bridge-whole-scene-pilot.pt-BR.vtt')).read_text(encoding='utf-8')
expected_cues = 7 if WORKPRINT else 11 if OPENING else 3
assert vtt.count('-->') == expected_cues and 'Ninguém desce sozinho.' in vtt
report = {'passed': True, 'humanApproval': 'pending', 'decodedFrames': count, 'fps': 24,
          'nativeSourceFps': 16, 'interpolation': True, 'exactAdjacentDuplicates': repeated,
          'longestAdjacentDuplicateRun': longest, 'meanFrameDifference': float(np.mean(changes)),
          'audioSecondsIncludingCodecPadding': audio_seconds, 'audioPeak': peak, 'audioRms': rms,
          'outputSha256': manifest['output']['sha256'], 'checks': [
              'All source/output hashes match', f'{expected_frames} nonblank decodable frames, 1280x720/24fps',
              'No run of identical frames; source assembly uses real model motion',
              f'AAC stereo 48kHz; audio non-silent and below clipping; {expected_duration} seconds plus AAC padding',
              f'{expected_cues} valid UTF-8 Portuguese caption cues',
          ]}
(OUT / 'media-report.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
