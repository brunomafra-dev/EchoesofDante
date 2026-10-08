"""Technical crop/packing of the original illustrated limb kit; no runtime generation."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'docs/star-hunter/source-art/hunter-rig-source.png').convert('RGBA')
w, h = source.size
# The generated rifle extends beyond the nominal first cell. Preserve its full silhouette.
columns = [(0, .275), (.285, .445), (.46, .64), (.67, .83), (.86, 1)]
atlas = Image.new('RGBA', (1280, 768))
measurements = []
for row in range(3):
    for col, (left, right) in enumerate(columns):
        bottom = round(h*.65) if row == 1 and col == 0 else round((row+1)*h/3)
        part = source.crop((round(left*w), round(row*h/3), round(right*w), bottom))
        box = part.getchannel('A').getbbox()
        assert box, (row, col)
        part = part.crop(box)
        scale = min(224/part.width, 224/part.height)
        part = part.resize((round(part.width*scale), round(part.height*scale)), Image.Resampling.LANCZOS)
        atlas.alpha_composite(part, (col*256+(256-part.width)//2, row*256+16))
        measurements.append({'frame': row*5+col, 'width': part.width, 'height': part.height})
dest = ROOT / 'public/assets/visual/characters/star-hunter-rig.png'
atlas.save(dest, optimize=True)
(ROOT/'public/assets/visual/characters/star-hunter-rig.json').write_text(json.dumps(measurements, indent=2)+'\n')
print(json.dumps({'source':source.size, 'atlas':atlas.size,'bytes':dest.stat().st_size}))
