"""Pack complete authored walk figures. Crop/register uniformly; never cut limbs."""
from pathlib import Path
import hashlib
import json
import shutil
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/warrior-walk'
ART = ROOT / 'public/assets/visual/complete-actors'
GENERATED = Path('C:/Users/1/.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783')
INPUTS = {
    'male-none': 'exec-6a7dc847-9261-411b-8666-ffc838ea5104.png',
    'male-basic': 'exec-36c5bea5-bbfa-428d-82e6-97e6b70bc0f1.png',
    'male-reinforced': 'exec-bd22eab3-3e63-4015-9259-9df5a563e89c.png',
    'female-none': 'exec-ef6a2c2c-47a9-40d0-af7c-07d4e9ff7dbe.png',
    'female-basic': 'exec-90b8e899-5416-42c5-a0af-e145587f03d0.png',
    'female-reinforced': 'exec-497277e8-d2d9-475a-9c0a-2bc84f33b383.png',
}

def cuts(weights, count):
    xs = np.arange(len(weights))
    centers = np.interp((np.arange(count)+.5)/count, np.cumsum(weights)/weights.sum(), xs)
    for _ in range(40):
        labels = np.abs(xs[:, None]-centers).argmin(axis=1)
        centers = np.array([np.average(xs[labels == i], weights=weights[labels == i]) for i in range(count)])
    centers.sort()
    result = [0]
    for a, b in zip(centers[:-1], centers[1:]):
        lo, hi = round(a+(b-a)*.35), round(a+(b-a)*.65)
        candidates = np.where(weights[lo:hi] == weights[lo:hi].min())[0]
        runs = np.split(candidates, np.where(np.diff(candidates) > 1)[0]+1)
        run = max(runs, key=len)
        result.append(lo+int(run[len(run)//2]))
    return result+[len(weights)]

DOC.joinpath('source').mkdir(parents=True, exist_ok=True)
old = json.loads((ROOT/'src/visual/actorRegistration.json').read_text())
anchors = {}
audit = {'sources': [], 'atlases': [], 'frames': []}
for identity, name in INPUTS.items():
    source = DOC/'source'/f'{identity}.png'
    if not source.exists(): shutil.copyfile(GENERATED/name, source)
    image = Image.open(source).convert('RGBA')
    alpha = np.array(image)[:, :, 3]
    assert alpha.min() == 0
    xs = cuts((alpha > 64).sum(axis=0).astype(float), 3)
    rows = [cuts((alpha[:, xs[c]:xs[c+1]] > 96).sum(axis=1).astype(float), 8) for c in range(3)]
    actor, style = 'warrior-'+identity.split('-')[0], identity.split('-')[1]
    atlas = Image.new('RGBA', (768, 1920))
    prior = Image.open(ART/f'{actor}-{style}.png').convert('RGBA')
    atlas.paste(prior, (0, 0))
    anchors.setdefault(actor, {})[style] = old[actor][style][:]+[[96, 55] for _ in range(8)]
    for row in range(8):
        for col, frame in [(0, row*4+1), (1, 32+row), (2, row*4+2)]:
            # The female spacing revision painted NE too close to profile.
            # Reflect the WHOLE opposite rear view, including its grip/feet.
            mirrored = identity.startswith('female') and row == 3
            source_row, source_col = (5, 2-col) if mirrored else (row, col)
            ys = rows[source_col]
            crop = image.crop((xs[source_col], ys[source_row], xs[source_col+1], ys[source_row+1]))
            if mirrored: crop = crop.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            a = np.array(crop)[:, :, 3]
            # Keep complete connected actors; a surrounding low-alpha glow is
            # part of the source. No segmentation of anatomy or interpolation.
            yy, xx = np.where(a > 40)
            box = (int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1))
            core = crop.crop(box)
            h = 164
            scale = h/core.height
            w = round(core.width*scale)
            head_y = max(8, round(core.height*.20))
            _, head_x = np.where(np.array(core)[:head_y, :, 3] > 80)
            hx = float(head_x.mean())
            left, top = round(96-hx*scale), 19
            assert left >= 3 and left+w <= 189, (identity, row, col, left, w)
            tile = Image.new('RGBA', (192, 192))
            tile.alpha_composite(core.resize((w, h), Image.Resampling.LANCZOS), (left, top))
            atlas.paste(tile, ((frame % 4)*192, (frame//4)*192))
            anchors[actor][style][frame] = [round(left+hx*scale, 3), 55]
            # Audit opaque margins, complete body height and source boundaries.
            cy, cx = np.where(a > 128)
            margins = [int(cx.min()), int(cy.min()), int(crop.width-cx.max()-1), int(crop.height-cy.max()-1)]
            assert min(margins) >= 1, (identity, row, col, margins)
            audit['frames'].append({'actor': identity, 'frame': frame, 'row': row, 'sourceColumn': col,
                'sourceBox': [xs[source_col], ys[source_row], xs[source_col+1], ys[source_row+1]],
                'mirroredWholeFigure': mirrored, 'coreMargins': margins,
                'uniformScale': scale, 'top': top, 'height': h, 'headX': round(left+hx*scale, 3)})
    target = ART/f'{actor}-{style}-walk-v2.png'
    atlas.save(target, optimize=True)
    audit['sources'].append({'file': source.relative_to(ROOT).as_posix(), 'original': name,
        'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'origin': 'image_gen.imagegen; complete humans'})
    audit['atlases'].append({'file': target.relative_to(ROOT).as_posix(), 'bytes': target.stat().st_size,
        'width': 768, 'height': 1920, 'frames': 40, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(ROOT/'src/visual/warriorWalkRegistration.json').write_text(json.dumps(anchors, separators=(',', ':'))+'\n')
(DOC/'assets.json').write_text(json.dumps(audit, indent=2)+'\n')
print(json.dumps({'frames': len(audit['frames']), 'atlases': len(audit['atlases']),
    'bytes': sum(a['bytes'] for a in audit['atlases'])}))
