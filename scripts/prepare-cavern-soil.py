"""Prepare the original imagegen ground material offline; Pillow is already used by the asset pipeline."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path, help="Original generated opaque square material")
parser.add_argument("--output", type=Path, default=Path("public/assets/visual/environment/cavern-soil.png"))
args = parser.parse_args()
with Image.open(args.source) as image:
    assert image.width == image.height, "Expected a square terrain material"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").resize((512, 512), Image.Resampling.LANCZOS).save(args.output, optimize=True)
print(f"{args.output}: 512x512 RGB, {args.output.stat().st_size} bytes")
