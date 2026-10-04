"""Offline alpha crop/registration/compression of imagegen-painted parts.

python scripts/prepare-warrior-arm-kit.py <directory of original PNGs>
No painting or image generation; final atlases have stable joint/grip pivots.
"""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/warrior-arm-pass'
OUT = ROOT / 'public/assets/visual/characters'


def bounds(image):
    box = image.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if box is None:
        raise ValueError('Empty alpha cutout')
    return box


def main():
    source = Path(sys.argv[1])
    entries = json.loads((DOC / 'sources.json').read_text(encoding='utf-8'))['assets']
    measurements = []
    for entry in entries:
        original = source / entry['sourceFile']
        image = Image.open(original).convert('RGBA')
        if entry['key'] == 'warrior-arm-kit':
            result = Image.new('RGBA', (384, 256))
            frames = []
            w, h = image.width // 3, image.height // 2
            for index in range(6):
                col, row = index % 3, index // 3
                tile = image.crop((col * w, row * h, (col + 1) * w, (row + 1) * h))
                cut = tile.crop(bounds(tile))
                if col == 2:
                    # Gloves retain their natural aspect and transparent pivot
                    # space. Grip origin lies in the curled finger region.
                    cut.thumbnail((120, 116), Image.Resampling.LANCZOS)
                    offset = ((128 - cut.width) // 2, (128 - cut.height) // 2)
                else:
                    # Sleeve endpoints register at x=2/126, joint line y=64.
                    cut = cut.resize((124, 60), Image.Resampling.LANCZOS)
                    offset = (2, 34)
                cell = Image.new('RGBA', (128, 128))
                cell.alpha_composite(cut, offset)
                result.alpha_composite(cell, (col * 128, row * 128))
                frames.append({'frame': index, 'occupiedRect': list(bounds(cell))})
            metadata = {'frameSize': [128, 128], 'frames': frames}
        else:
            cut = image.crop(bounds(image)).resize((224, 32), Image.Resampling.LANCZOS)
            result = Image.new('RGBA', (256, 64))
            result.alpha_composite(cut, (16, 16))
            metadata = {'dominantGripPixel': [78, 34], 'supportGripWorldOffset': -10}
        path = OUT / f"{entry['key']}.png"
        result.save(path, optimize=True)
        measurements.append({'file': path.relative_to(ROOT).as_posix(), 'size': list(result.size),
                             'bytes': path.stat().st_size, **metadata,
                             'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                             'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest()})
    (DOC / 'asset-measurements.json').write_text(json.dumps(measurements, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(measurements, indent=2))


if __name__ == '__main__':
    main()
