"""Offline review excerpts/comparisons/provenance, after the actual film export."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening/revision-02'
PUBLIC = ROOT / 'public/assets/cinematic-opening'
RESTORE = ROOT / '.local/cinematic-opening/revision-02/restoration'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect(path, seconds):
    cap = cv2.VideoCapture(str(path))
    info = {'width': int(cap.get(3)), 'height': int(cap.get(4)), 'fps': cap.get(5), 'frames': int(cap.get(7)),
            'bytes': path.stat().st_size, 'sha256': sha(path)}
    cap.release()
    assert (info['width'], info['height'], info['fps'], info['frames']) == (1280,720,24,round(seconds*24)), (path,info)
    return info


media = json.loads((ROOT / 'docs/cinematic-opening/media.json').read_text(encoding='utf-8'))
assert media['selectiveRestoration']['passed']
full = PUBLIC / 'arrival-whole-scene.mp4'
assert sha(full) == media['output']['sha256']
ff = imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ff, '-y', '-v', 'warning', '-ss', '49.5', '-i', str(full), '-t', '9.75',
                '-c:v', 'libx264', '-crf', '18', '-preset', 'fast', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', str(PUBLIC/'landing-heroes.mp4')], check=True)

# Same native frame in both pictures; never compare different frames as detail gain.
name = 'landing-0030.png'
native = Image.open(RESTORE / 'input' / name).convert('RGB').resize((1248,720), Image.Resampling.LANCZOS)
restored = Image.open(RESTORE / 'output' / name).convert('RGB').resize((1248,720), Image.Resampling.LANCZOS)
after = Image.blend(native, restored, .55)
native.save(PUBLIC/'quality-before.webp', quality=93)
after.save(PUBLIC/'quality-after.webp', quality=93)
image_source = ROOT / 'docs/cinematic-opening/source/landing-heroes-v2.png'
im = Image.open(image_source)
meta = {'origin':'Original image_gen.imagegen whole-scene generation, 2026-10-20', 'width':im.width, 'height':im.height,
        'bytes':image_source.stat().st_size, 'sha256':sha(image_source),
        'prompt':'docs/cinematic-opening/prompts/landing-heroes-image-v2.txt',
        'references':['docs/cinematic-opening/source/pioneer-team-v2.png','public/assets/prologue/landing.webp'],
        'reason':'Four current heroes disembark first, civilian crew behind them', 'humanApproval':'pending'}
image_source.with_suffix('.json').write_text(json.dumps(meta, indent=2)+'\n', encoding='utf-8')
for part in [1,2]:
    shutil.copyfile(ROOT/f'.local/cinematic-opening/revision-02/landing-heroes-{part:02}/contact.jpg', DOC/f'landing-take-{part:02}.jpg')

report = {'humanApproval':'pending', 'full':inspect(full,59.25),
          'landing':inspect(PUBLIC/'landing-heroes.mp4',9.75),
          'voiceProof':inspect(PUBLIC/'bridge-voice-proof.mp4',12),
          'imageComparisons':{'sameSourceFrame':30,'sourceShot':'landing-heroes-v2-01.mp4',
                              'before':sha(PUBLIC/'quality-before.webp'),'after':sha(PUBLIC/'quality-after.webp')}}
(DOC/'exports.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
