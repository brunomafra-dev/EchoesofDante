"""Offline rig registration only. Paintings are authored with built-in imagegen.

python scripts/prepare-character-art.py <directory containing original generated PNGs>
No painting/generation runs in Phaser. Retains original canvas padding and pivots.
"""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/character-art-pass'
OUT = ROOT / 'public/assets/visual/characters'

def bounds(image):
    box = image.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if not box:
        raise ValueError('Empty alpha cutout')
    return box

def main():
    source = Path(sys.argv[1])
    manifest = json.loads((DOC / 'sources.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    measurements = []
    for entry in manifest['assets']:
        name = entry['key']
        reference = Image.open(DOC / f'references/{name}.png').convert('RGBA')
        painting = Image.open(source / entry['sourceFile']).convert('RGBA')
        # 4 pixels per world unit. Match the old part's occupied rectangle,
        # not the canvas center (boots/limb pairs contain intentional padding).
        size = (reference.width // 2, reference.height // 2)
        box = tuple(round(x / 2) for x in bounds(reference))
        artwork = painting.crop(bounds(painting)).resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
        result = Image.new('RGBA',size)
        result.alpha_composite(artwork,(box[0],box[1]))
        result.save(OUT / f'{name}.png',optimize=True)
        final = OUT / f'{name}.png'
        measurements.append({'file':final.relative_to(ROOT).as_posix(),'size':size,'occupiedRect':box,'bytes':final.stat().st_size,'sha256':hashlib.sha256(final.read_bytes()).hexdigest()})
    (DOC / 'asset-measurements.json').write_text(json.dumps(measurements,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(measurements,indent=2))

if __name__ == '__main__':
    main()
