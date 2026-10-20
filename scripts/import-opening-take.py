"""Validate/import a completed provider take; contact sheet is inspection, not game art."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening'
plan = json.loads((DOC / 'shots.json').read_text(encoding='utf-8'))
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('shot', choices=[s['id'] for s in plan['shots'] if not s.get('approvedPilot')])
parser.add_argument('part', type=int, choices=[1, 2])
parser.add_argument('--from-directory', help='Completed attempt under .local; retain previous failed receipts')
args = parser.parse_args()
shot = next(s for s in plan['shots'] if s['id'] == args.shot)
name = f"{shot.get('sourceStem', args.shot)}-{args.part:02}"
folder = (ROOT / args.from_directory).resolve() if args.from_directory else ROOT / f'.local/cinematic-opening/account/{name}'
assert folder.is_relative_to((ROOT/'.local').resolve()), 'Attempt must remain under .local'
receipt = json.loads((folder / 'attempt.json').read_text(encoding='utf-8'))
video = folder / 'take.mp4'
sha = hashlib.sha256(video.read_bytes()).hexdigest()
assert receipt['status'] == 'downloaded' and receipt['videoHash'] == sha
c = cv2.VideoCapture(str(video))
frames = int(c.get(7))
assert (c.get(3), c.get(4), c.get(5)) == (832, 480, 16), name
assert frames == 1+round(receipt['requestedSeconds']*16), (name, frames)
sheet = Image.new('RGB', (1248, 520), (9, 15, 12))
for j, index in enumerate(np.linspace(0, frames-1, 6, dtype=int)):
    c.set(1, int(index)); ok, frame = c.read(); assert ok
    im = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    im.thumbnail((416, 240))
    x, y = (j%3)*416, (j//3)*260
    sheet.paste(im, (x, y))
    ImageDraw.Draw(sheet).text((x+6, y+242), f'{name} / frame {index}', fill='white')
c.release()
sheet.save(folder / 'contact.jpg', quality=88)
target = DOC / f'source/{name}.mp4'
if target.exists():
    assert hashlib.sha256(target.read_bytes()).hexdigest() == sha, 'Refuse to overwrite different footage'
else:
    shutil.copyfile(video, target)
(DOC / f'source/{name}.json').write_text(json.dumps(receipt, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
print(json.dumps({'id': name, 'frames': frames, 'fps': 16, 'bytes': video.stat().st_size, 'sha256': sha}))
