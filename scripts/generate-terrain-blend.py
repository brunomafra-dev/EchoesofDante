"""Offline technical feather mask, not environment illustration or runtime art generation."""
from pathlib import Path
import math
from PIL import Image

size = 256
image = Image.new('RGBA', (size, size))
pixels = image.load()
for y in range(size):
    for x in range(size):
        u, v = (x - 127.5) / 116, (y - 127.5) / 110
        angle = math.atan2(v, u)
        edge = 1 + .07 * math.sin(3 * angle + .7) + .045 * math.sin(5 * angle - .4)
        r = math.hypot(u, v) / edge
        weight = max(0, min(1, (1 - r) / .48))
        weight = weight * weight * (3 - 2 * weight)
        modulation = .93 + .035 * math.sin(u * 6 + v * 3) + .03 * math.cos(v * 8 - u * 4)
        pixels[x, y] = (255, 255, 255, round(220 * weight * modulation))
target = Path('public/assets/visual/environment/terrain-blend.png')
image.save(target, optimize=True)
print(f'{target}: {size}x{size} RGBA, {target.stat().st_size} bytes')
