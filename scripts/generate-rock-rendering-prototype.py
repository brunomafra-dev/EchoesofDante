"""Offline PNG authoring for the isolated rock rendering lab.

B uses a sampled height/material field, not a polygon rasterizer.
D's transparent root/mineral overlay and the shared shadow are painted offline.
Optional --illustration normalizes an original imagegen output for C without
changing its aspect ratio or alpha. Pillow is an authoring-only prerequisite.
Nothing in this script is shipped as runtime generation code.
"""

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SIZE = 512
DEST = Path(__file__).resolve().parents[1] / "public/assets/experiments/rock-rendering"


def noise(x: float, y: float) -> float:
    def value(ix: int, iy: int) -> float:
        n = (ix * 374761393 + iy * 668265263 + 94731) & 0xFFFFFFFF
        n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
        return (n ^ (n >> 16)) / 0xFFFFFFFF

    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = value(ix, iy) * (1 - fx) + value(ix + 1, iy) * fx
    b = value(ix, iy + 1) * (1 - fx) + value(ix + 1, iy + 1) * fx
    return a * (1 - fy) + b * fy


def field(px: int, py: int) -> tuple[float, float]:
    u, v = (px - 256) / 112, (py - 250) / 110
    angle = math.atan2(v, u)
    boundary = 1 + 0.07 * math.sin(3 * angle + 0.7) + 0.055 * math.cos(5 * angle - 1.1)
    boundary += 0.025 * math.sin(9 * angle) + 0.018 * (noise(u * 11, v * 11) - 0.5)
    q = math.hypot(u, v) / boundary
    alpha = min(1, max(0, (1 - q) * 100))
    if not alpha:
        return 0, 0
    # Worn rounded strata, an unequal shoulder and a shallow, curved fracture.
    height = 0.67 * max(0, 1 - q * q) ** 0.54
    height += 0.15 * math.exp(-((u + 0.48) ** 2 + (v + 0.24) ** 2) / 0.13)
    height += 0.065 * math.sin(v * 11 + u * 3 + noise(u * 3, v * 3)) * (1 - q)
    seam = u + 0.12 + 0.12 * math.sin(v * 6)
    height -= 0.075 * math.exp(-(seam / 0.028) ** 2) * max(0, 1 - abs(v))
    height += (noise(u * 35, v * 35) - 0.5) * 0.008
    return height, alpha


def raster() -> None:
    heights = [[field(x, y) for x in range(SIZE)] for y in range(SIZE)]
    image = Image.new("RGBA", (SIZE, SIZE))
    pixels = image.load()
    for y in range(1, SIZE - 1):
        for x in range(1, SIZE - 1):
            height, alpha = heights[y][x]
            if not alpha:
                continue
            nx = -(heights[y][x + 1][0] - heights[y][x - 1][0]) * 34
            ny = -(heights[y + 1][x][0] - heights[y - 1][x][0]) * 34
            length = math.sqrt(nx * nx + ny * ny + 1)
            light = max(0, (-0.48 * nx - 0.58 * ny + 0.66) / length)
            u, v = (x - 256) / 112, (y - 250) / 110
            pigment = (noise(u * 5, v * 5) - 0.5) * 13
            grain = (noise(u * 70, v * 70) - 0.5) * 8
            value = 0.56 + 0.55 * light + height * 0.08
            color = [int(c * value + pigment + grain) for c in (83, 101, 91)]
            # A small mineralized front fracture, subdued amber/violet pigment.
            seam = abs(u + 0.12 + 0.12 * math.sin(v * 6))
            if 0.18 < v < 0.74 and seam < 0.055:
                strength = (1 - seam / 0.055) * 0.7
                tint = (169, 140, 255) if v < 0.32 else (255, 189, 84)
                color = [int(c * (1 - strength) + t * strength) for c, t in zip(color, tint)]
            pixels[x, y] = (*[min(255, max(0, c)) for c in color], round(alpha * 255))
    image.save(DEST / "rock-raster.png", optimize=True)


def overlays() -> None:
    shadow = Image.new("RGBA", (SIZE, SIZE))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((142, 296, 392, 382), fill=(6, 19, 23, 135))
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    shadow.save(DEST / "contact-shadow.png", optimize=True)

    overlay = Image.new("RGBA", (SIZE, SIZE))
    draw = ImageDraw.Draw(overlay)
    # Paint one tapering organic root around the lower edge of the shared rock.
    points = []
    for i in range(121):
        t = i / 120
        points.append((136 + 211 * t, 258 + 87 * math.sin(t * math.pi * 0.87) + 15 * t))
    for i, (x, y) in enumerate(points):
        radius = 8 * (1 - i / 155)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(34, 64, 50, 245))
        draw.ellipse((x - radius * 0.55, y - radius * 0.85, x + radius * 0.4, y), fill=(87, 122, 73, 215))
    # A few mineral nodules embedded along the front pocket, not separate crystals.
    for x, y, r in [(214, 330, 7), (225, 335, 4), (234, 329, 3)]:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(126, 100, 68, 240))
        draw.arc((x - r, y - r, x + r, y + r), 195, 300, fill=(255, 189, 84, 155), width=2)
    draw.line([(217, 326), (222, 332), (230, 328)], fill=(169, 140, 255, 135), width=2)
    overlay.save(DEST / "root-mineral-overlay.png", optimize=True)


def illustration(source: Path) -> None:
    image = Image.open(source).convert("RGBA")
    # Ignore almost invisible edge specks when measuring scale, while preserving
    # the original alpha inside the selected object crop.
    bbox = image.getchannel("A").point(lambda alpha: 255 if alpha > 16 else 0).getbbox()
    if not bbox or image.getchannel("A").getextrema()[0] == 255:
        raise ValueError("Illustration needs a real transparent background")
    content = image.crop(bbox)
    content.thumbnail((224, 220), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE))
    canvas.alpha_composite(content, (256 - content.width // 2, 250 - content.height // 2))
    canvas.save(DEST / "rock-illustrated.png", optimize=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--illustration", type=Path, help="Original transparent imagegen PNG")
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    raster()
    overlays()
    if args.illustration:
        illustration(args.illustration)
    for asset in sorted(DEST.glob("*.png")):
        print(f"{asset.name}: {Image.open(asset).size}, {asset.stat().st_size} bytes")
