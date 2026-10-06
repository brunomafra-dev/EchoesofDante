"""Create a soft-edged production ground from the approved quality-reference plate.

This only feathers the alpha at the plate edges so it blends into cavern-soil.
It does not paint, synthesize or alter the authored floor material.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/assets/experiments/quality-reference/basin-floor.webp'
OUTPUT = ROOT / 'public/assets/visual/environment/cavern-entry-floor.webp'


def edge_alpha(x: int, y: int, width: int, height: int) -> int:
    # Feather each edge in a narrow band. The right fade joins the deeper floor
    # substrate before the next cavern section; top/bottom disappear under rims.
    horizontal = min(1.0, x / 90, (width - 1 - x) / 90)
    vertical = min(1.0, y / 64, (height - 1 - y) / 64)
    return round(255 * max(0.0, min(horizontal, vertical)))


def main() -> None:
    image = Image.open(SOURCE).convert('RGBA')
    alpha = Image.new('L', image.size)
    alpha.putdata([edge_alpha(x, y, *image.size)
                   for y in range(image.height)
                   for x in range(image.width)])
    image.putalpha(alpha)
    image.save(OUTPUT, 'WEBP', quality=91, method=6)
    print(f'{OUTPUT.relative_to(ROOT).as_posix()}: {image.width}x{image.height}, {OUTPUT.stat().st_size} bytes')


if __name__ == '__main__':
    main()
