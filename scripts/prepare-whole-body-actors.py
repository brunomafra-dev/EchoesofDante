"""Register whole generated figures. No joints, limb cuts, warps or invented poses."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/whole-body-actors'
OUT = ROOT / 'public/assets/experiments/whole-body'
OUT.mkdir(parents=True, exist_ok=True)
atlas = Image.new('RGBA', (1024, 2048))
directions = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
# Measured cast-palm centers, as fractions of their source cell (x, y).
palms = [(0.61, .29), (.84, .31), (.83, .24), (.83, .23),
         (.69, .06), (.14, .09), (.08, .24), (.10, .51)]
frames, sources = [], []
for sheet, name in enumerate(['astral-a.png', 'astral-b.png']):
    path = DOC / 'source' / name
    source = Image.open(path).convert('RGBA')
    assert source.width == source.height
    assert source.getchannel('A').getextrema() == (0, 255), 'Real alpha required'
    sources.append({'path': path.relative_to(ROOT).as_posix(), 'width': source.width,
                    'height': source.height, 'bytes': path.stat().st_size,
                    'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    for row in range(4):
        for col, action in enumerate(['idle', 'walk-a', 'walk-b', 'cast']):
            box = tuple(round(v) for v in (col*source.width/4, row*source.height/4,
                                          (col+1)*source.width/4, (row+1)*source.height/4))
            cell = source.crop(box)
            bbox = cell.getchannel('A').getbbox()
            assert bbox and bbox[3]-bbox[1] > cell.height*.55, (name, row, col, bbox)
            factor = 224/cell.width
            size = (224, round(cell.height*factor))
            # Only the WHOLE frame is resized/registered; every painted limb stays intact.
            whole = cell.resize(size, Image.Resampling.LANCZOS)
            top = 244-round(bbox[3]*factor)
            assert top >= 0
            frame = Image.new('RGBA', (256, 256))
            frame.alpha_composite(whole, (16, top))
            index = (sheet*4+row)*4+col
            atlas.alpha_composite(frame, ((index%4)*256, (index//4)*256))
            direction = sheet*4+row
            palm = palms[direction]
            frames.append({'index': index, 'direction': directions[direction], 'action': action,
                           'sourceCell': list(box), 'wholeFigureOnly': True,
                           'feetY': 244, 'alphaPixels': int(np.count_nonzero(np.array(frame)[:,:,3])),
                           'muzzle': {'x': round(16+palm[0]*224, 2),
                                      'y': round(top+palm[1]*size[1], 2)}})
target = OUT / 'astral-female-whole.png'
atlas.save(target, optimize=True)
report = {'generator': 'Built-in image_gen.imagegen, original illustrated poses',
          'source': sources, 'frames': frames, 'width': 1024, 'height': 2048,
          'frameSize': 256, 'frameCount': 32, 'bytes': target.stat().st_size,
          'rgbaMemoryBytes': 1024*2048*4, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
          'wholeBodyOnly': True, 'humanApproval': 'pending'}
(DOC / 'assets.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
(OUT / 'frames.json').write_text(json.dumps({'frames': frames, 'directions': directions}, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k: report[k] for k in ['width', 'height', 'frameCount', 'bytes', 'sha256']}))
