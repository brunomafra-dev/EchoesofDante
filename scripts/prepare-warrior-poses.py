"""Register painted sprite cells offline; no painting or generation in this script.

python scripts/prepare-warrior-poses.py <directory containing generated PNGs>
Artwork and poses come from built-in imagegen; crop, scale, alpha and PNG only.
"""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/warrior-quality-reference'
OUT = ROOT / 'public/assets/visual/characters'
CELL = 256
GROUND = 236
HEIGHT = 196  # 98 world units at the existing camera; same logical footprint.


def bounds(image):
    box = image.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if box is None:
        raise ValueError('Empty painted frame')
    return box


def main():
    source = Path(sys.argv[1])
    manifest = json.loads((DOC / 'sources.json').read_text(encoding='utf-8'))
    measurements = []
    for entry in manifest['assets']:
        original = source / entry['sourceFile']
        image = Image.open(original).convert('RGBA')
        w, h = image.width // 4, image.height // 2
        frames = [image.crop((col * w, row * h, (col + 1) * w, (row + 1) * h))
                  for row in range(2) for col in range(4)]
        idle = bounds(frames[0])
        # One scale per entire direction. Crouching/leaning poses retain their
        # authored height; resizing each pose to idle height would erase motion.
        scale = HEIGHT / (idle[3] - idle[1])
        atlas = Image.new('RGBA', (CELL * 4, CELL * 2))
        poses = []
        for index, frame in enumerate(frames):
            box = bounds(frame)
            cut = frame.crop(box)
            size = (round(cut.width * scale), round(cut.height * scale))
            if size[0] > CELL - 16 or size[1] > GROUND - 8:
                raise ValueError(f'Frame {index} would be clipped: {size}')
            cut = cut.resize(size, Image.Resampling.LANCZOS)
            offset = ((CELL - size[0]) // 2, GROUND - size[1])
            tile = Image.new('RGBA', (CELL, CELL))
            tile.alpha_composite(cut, offset)
            atlas.alpha_composite(tile, ((index % 4) * CELL, (index // 4) * CELL))
            poses.append({'frame': index, 'occupiedRect': list(bounds(tile))})
        path = OUT / f"{entry['key']}.png"
        atlas.save(path, optimize=True)
        measurements.append({'file': path.relative_to(ROOT).as_posix(),
                             'size': list(atlas.size), 'frameSize': [CELL, CELL],
                             'frames': poses, 'bytes': path.stat().st_size,
                             'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                             'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest()})
    (DOC / 'asset-measurements.json').write_text(json.dumps(measurements, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(measurements, indent=2))


if __name__ == '__main__':
    main()
