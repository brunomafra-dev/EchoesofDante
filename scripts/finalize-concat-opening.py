"""Publish the actual Concat export, never substitute an unvoiced assembler cut."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--revision', choices=['revision-03', 'revision-04'], default='revision-03')
args = parser.parse_args()
REV = DOC / args.revision
PUBLIC = ROOT / 'public/assets/cinematic-opening'
WORK = ROOT / '.local/cinematic-opening' / args.revision
PLAN = json.loads((DOC / 'shots.json').read_text(encoding='utf-8'))
FF = imageio_ffmpeg.get_ffmpeg_exe()


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def meta(p):
    c = cv2.VideoCapture(str(p))
    result = dict(width=int(c.get(3)), height=int(c.get(4)), fps=c.get(5), frames=int(c.get(7)),
                  bytes=p.stat().st_size, sha256=digest(p))
    c.release()
    return result


source = WORK / 'film-export.mp4'
assert meta(source)['frames'] == round(PLAN['targetSeconds'] * 24), 'Incomplete Concat export'
output = PUBLIC / 'arrival-whole-scene.mp4'
subprocess.run([FF, '-y', '-v', 'warning', '-i', str(source), '-map', '0', '-c', 'copy',
                '-movflags', '+faststart', str(output)], check=True)
landing = next(s for s in PLAN['shots'] if s['id'] == 'landing')
start = PLAN['targetSeconds'] - landing['seconds']
subprocess.run([FF, '-y', '-v', 'warning', '-i', str(output), '-ss', str(start), '-t', str(landing['seconds']),
                '-c:v', 'libx264', '-crf', '16' if args.revision == 'revision-04' else '18', '-preset', 'fast', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(PUBLIC / 'landing-heroes.mp4')], check=True)
pictures = json.loads((REV / 'picture-manifest.json').read_text(encoding='utf-8'))
voices = json.loads((REV / 'voice-report.json').read_text(encoding='utf-8'))
info = meta(output)
assert (info['width'], info['height'], info['fps'], info['frames']) == (1280, 720, 24, round(PLAN['targetSeconds'] * 24))
report = dict(completeFilm=True, workprint=False, seconds=PLAN['targetSeconds'], missingShots=[],
              humanApproval='pending: Nara in landing' if args.revision == 'revision-04' else 'pending: revised landing and complete voice casting', native720p24=False,
              sourceFps=16, interpolation='FFmpeg whole-frame motion compensated 16 to 24',
              loopOrFrozenFiller=False, shots=pictures['shots'], editor='Concat 0.2.8 MCP, actual timeline/export',
              audio=dict(origin='Original ambience + local Kokoro PT-BR speech, Concat mix', voiceReport=voices,
                         lipSync=False, fixedSpeakerVoices=True), output=info)
(DOC / 'media.json').write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
exports = dict(film=info, landing=meta(PUBLIC / 'landing-heroes.mp4'),
               approvedBridgeVoiceProof=meta(PUBLIC / 'bridge-voice-proof.mp4'))
(REV / 'exports.json').write_text(json.dumps(exports, indent=2)+'\n', encoding='utf-8')
# Different scene revisions, explicitly not a same-frame upscale comparison.
previous = 'landing-heroes-v3-01.mp4' if args.revision == 'revision-04' else 'landing-heroes-v2-01.mp4'
for file, path, frame in [('quality-before.webp', DOC / 'source' / previous, 30),
                          ('quality-after.webp', PUBLIC / 'landing-heroes.mp4', 30)]:
    c = cv2.VideoCapture(str(path)); c.set(1, frame); ok, image = c.read(); c.release()
    assert ok
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    Image.fromarray(image).resize((960, 540), Image.Resampling.LANCZOS).save(PUBLIC / file, quality=88)
print(json.dumps(exports, indent=2))
