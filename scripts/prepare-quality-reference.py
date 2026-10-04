"""Resize/compress the original imagegen output offline, without repainting it.
Usage: python scripts/prepare-quality-reference.py /path/to/generated.png
"""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
target = Path(__file__).resolve().parents[1] / 'public/assets/experiments/quality-reference/basin-floor.webp'
target.parent.mkdir(parents=True, exist_ok=True)
with Image.open(args.source) as image:
    image.convert('RGB').resize((1536, 1024), Image.Resampling.LANCZOS).save(target, quality=87, method=6)
print(f'{target}: 1536x1024, {target.stat().st_size} bytes')
