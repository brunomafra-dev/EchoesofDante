"""Offline extraction of the original imagegen sheet; no runtime generation.
Usage: python scripts/prepare-warden-art.py path/to/original-sheet.png
"""
from pathlib import Path
import sys
from PIL import Image

source = Image.open(sys.argv[1]).convert('RGBA')
target = Path(__file__).resolve().parents[1] / 'public/assets/visual/environment'
split = int(source.width * 0.37)
for name, box in [('first-echo-archive', (0, 0, split, source.height)),
                  ('sealed-threshold', (split, 0, source.width, source.height))]:
    image = source.crop(box)
    # Ignore isolated low-alpha pixels while retaining the painted contact shadow.
    bounds = image.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    assert bounds, name
    image = image.crop(bounds)
    image.thumbnail((488, 488), Image.Resampling.LANCZOS)
    output = Image.new('RGBA', (512, 512))
    output.alpha_composite(image, ((512-image.width)//2, 500-image.height))
    output.save(target / f'{name}.png', optimize=True)
    print(name, output.size, (target / f'{name}.png').stat().st_size)
