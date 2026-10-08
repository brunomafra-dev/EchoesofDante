"""Offline technical crop, resize and packing; preserves generated alpha/paint.

Bodies remain whole illustrations. No leg splitting, background repainting or
runtime texture generation. Low-alpha antialiasing is preserved within crops.
"""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/visual/characters'
SOURCE = ROOT / 'docs/star-hunter/source-art'

def cells(source, cols, rows, row_edges=None):
    result = []
    for r in range(rows):
        for c in range(cols):
            edges = row_edges or [round(y*source.height/rows) for y in range(rows+1)]
            cell = source.crop((round(c*source.width/cols), edges[r],
                                round((c+1)*source.width/cols), edges[r+1]))
            box = cell.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
            assert box, (r, c)
            if row_edges:
                assert box[0] > 2 and box[2] < cell.width-2 and box[1] > 2 and box[3] < cell.height-2, ('clipped body', r, c, box)
            result.append(cell.crop(box))
    return result

body_source = Image.open(SOURCE/'hunter-body-v2-source.png').convert('RGBA')
# Paint is not a strict cell grid: boots from row 1 extend past height/3.
# Crop in the actual transparent gutters, never through a boot or hair.
poses = cells(body_source, 4, 3, [0, round(body_source.height*.3555), round(body_source.height*.6722), body_source.height])
atlas = Image.new('RGBA', (1024, 768))
for i, pose in enumerate(poses):
    # Ground the neutral boots at the same contact point in all three views.
    # The illustrations differ slightly in projected height across views.
    scale = min(224/poses[i//4*4].height, 224/max(p.width for p in poses[i//4*4:i//4*4+4]))
    pose = pose.resize((round(pose.width*scale), round(pose.height*scale)), Image.Resampling.LANCZOS)
    # Head/torso stay steady; a lifted foot remains lifted rather than moving
    # the entire body down just to force every pose's bottom to the ground.
    atlas.alpha_composite(pose, (i%4*256+(256-pose.width)//2, i//4*256+20))
atlas.save(DEST/'star-hunter-body-v2.png', optimize=True)

weapon_source = Image.open(SOURCE/'hunter-weapon-v2-source.png').convert('RGBA')
parts = cells(weapon_source, 2, 3)
kit = Image.new('RGBA', (512, 768))
metadata = []
for i, part in enumerate(parts):
    scale = min(224/part.width, 224/part.height)
    part = part.resize((round(part.width*scale), round(part.height*scale)), Image.Resampling.LANCZOS)
    kit.alpha_composite(part, (i%2*256+(256-part.width)//2, i//2*256+16))
    metadata.append({'frame':i, 'width':part.width, 'height':part.height,
                     **({'axisY':.38} if i < 2 else {})})
kit.save(DEST/'star-hunter-weapon-v2.png', optimize=True)
(DEST/'star-hunter-weapon-v2.json').write_text(json.dumps(metadata, indent=2)+'\n')
measurements = {p.name:{'size':Image.open(p).size, 'bytes':p.stat().st_size} for p in
                [DEST/'star-hunter-body-v2.png', DEST/'star-hunter-weapon-v2.png']}
(ROOT/'docs/star-hunter/hunter-v2-measurements.json').write_text(json.dumps(measurements, indent=2)+'\n')
print(json.dumps(measurements))
