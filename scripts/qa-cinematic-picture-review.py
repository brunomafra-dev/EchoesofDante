"""Whole-frame inspection sheets and encode fidelity; not a verdict on acting/anatomy."""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
REV = ROOT / 'docs/cinematic-opening/revision-04'
OUT = REV / 'qa/picture'
OUT.mkdir(parents=True, exist_ok=True)
PLAN = json.loads((ROOT / 'docs/cinematic-opening/shots.json').read_text(encoding='utf-8'))
baseline = ROOT / '.local/cinematic-opening/revision-04/previous-film.mp4'
current = ROOT / 'public/assets/cinematic-opening/arrival-whole-scene.mp4'
shots, frame = [], 0
for shot in PLAN['shots']:
    count = round(shot['seconds'] * 24)
    shots.append({**shot, 'startFrame': frame, 'sampleFrames': [12, count//2, count-7]})
    frame += count
landing = shots[-1]
extra = [landing['startFrame'] + i for i in np.linspace(0, round(landing['seconds']*24)-1, 6, dtype=int)]
wanted = {s['startFrame']+i for s in shots for i in s['sampleFrames']} | set(extra)


def read_frames(file, indices):
    # Decode sequentially: no seek artifacts from open GOPs in the editor's MP4.
    cap = cv2.VideoCapture(str(file))
    images = {}
    index = 0
    while True:
        ok, pixels = cap.read()
        if not ok:
            break
        if index in indices:
            images[index] = pixels
        index += 1
    cap.release()
    assert set(images) == set(indices), f'Missing frames: {file}'
    return images


new = read_frames(current, wanted)
old = read_frames(baseline, wanted)
metrics = []
for s in shots:
    ref = read_frames(ROOT/f".local/cinematic-opening/assembly/{s['id']}.mp4", s['sampleFrames'])
    entries = []
    for i in s['sampleFrames']:
        # Exclude both caption bands and black side bars from encode comparison.
        crop = lambda a: a[145:680, 32:1248]
        entry = {'frame': s['startFrame']+i, 'newEncodePSNR': cv2.PSNR(crop(ref[i]), crop(new[s['startFrame']+i]))}
        if s['id'] != 'landing':
            entry['previousEncodePSNR'] = cv2.PSNR(crop(ref[i]), crop(old[s['startFrame']+i]))
        entries.append(entry)
    metrics.append({'shot': s['id'], 'samples': entries})

for group in range(2):
    canvas = Image.new('RGB', (1280, 1040), '#0b100c')
    draw = ImageDraw.Draw(canvas)
    for row, s in enumerate(shots[group*4:(group+1)*4]):
        for col, i in enumerate(s['sampleFrames']):
            im = Image.fromarray(cv2.cvtColor(new[s['startFrame']+i], cv2.COLOR_BGR2RGB))
            im.thumbnail((426, 240))
            x, y = col*426, row*260
            canvas.paste(im, (x, y+20))
            draw.text((x+5, y+3), f"{s['id']} / {(s['startFrame']+i)/24:.2f}s", fill='white')
    canvas.save(OUT / f'film-{group+1}.jpg', quality=93)
canvas = Image.new('RGB', (1920, 760), '#0b100c')
for k, i in enumerate(extra):
    im = Image.fromarray(cv2.cvtColor(new[i], cv2.COLOR_BGR2RGB)).resize((640,360), Image.Resampling.LANCZOS)
    x, y = k%3*640, k//3*380
    canvas.paste(im, (x,y+20))
    ImageDraw.Draw(canvas).text((x+5,y+3), f'Nara / frame {i} / {i/24:.2f}s', fill='white')
canvas.save(OUT/'nara-motion.jpg', quality=94)
unchanged = [e for s in metrics for e in s['samples'] if 'previousEncodePSNR' in e]
now_mean = float(np.mean([e['newEncodePSNR'] for e in unchanged]))
before_mean = float(np.mean([e['previousEncodePSNR'] for e in unchanged]))
report = {'passed': now_mean >= before_mean-.05, 'humanApproval': 'pending',
          'method': '24 sample frames from eight scenes; six additional landing views. PSNR versus identical picture intermediates, caption bands excluded. Seven unchanged scenes compare CRF16 to previous CRF18; changed landing has no before/after fidelity claim.',
          'meanPSNRUnchangedScenes': now_mean, 'previousMeanPSNRUnchangedScenes': before_mean,
          'differenceDB': now_mean-before_mean, 'samples': metrics,
          'limitation': 'PSNR measures encode error against the source, not native detail, anatomy, lip synchronization or perceived acting quality.'}
(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
assert report['passed'], 'Investigate encode fidelity regression'
print(json.dumps({k:v for k,v in report.items() if k!='samples'},indent=2))
