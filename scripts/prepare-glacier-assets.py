"""Offline alpha cropping / packing. Original generation sources stay in docs.
No painting, generation or frame extraction happens in the browser.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/glacier-expansion/source-art'
DEST = ROOT / 'public/assets/visual'
report = {}

def creature_component(frame):
    # Generated sheets may cross cell gutters. Keep the largest painted body,
    # excluding detached pixels from neighbouring poses before finding the feet.
    strong = np.array(frame.getchannel('A')) > 20
    seen = np.zeros_like(strong)
    largest = []
    height, width = strong.shape
    for y, x in zip(*np.nonzero(strong)):
        if seen[y, x]:
            continue
        component, pending = [], [(int(y), int(x))]
        seen[y, x] = True
        while pending:
            cy, cx = pending.pop()
            component.append((cy, cx))
            for ny in range(max(0, cy - 1), min(height, cy + 2)):
                for nx in range(max(0, cx - 1), min(width, cx + 2)):
                    if strong[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        pending.append((ny, nx))
        if len(component) > len(largest):
            largest = component
    assert largest, 'Empty creature cell'
    mask = np.zeros_like(strong, dtype=np.uint8)
    yy, xx = zip(*largest)
    mask[yy, xx] = 255
    padding = Image.fromarray(mask).filter(ImageFilter.MaxFilter(7))
    pixels = np.array(frame)
    pixels[:, :, 3] = np.minimum(pixels[:, :, 3], np.array(padding))
    return Image.fromarray(pixels).crop(padding.getbbox())
for name in ['vesper', 'ice-carapace']:
    sheet = Image.open(SOURCE / f'{name}-source.png').convert('RGBA')
    w, h = sheet.size
    frames = []
    for i in range(8):
        frame = sheet.crop((round(i % 4 * w / 4), round(i // 4 * h / 2),
                            round((i % 4 + 1) * w / 4), round((i // 4 + 1) * h / 2)))
        frames.append(creature_component(frame))
    scale = min(234 / max(f.width for f in frames), 222 / max(f.height for f in frames))
    atlas = Image.new('RGBA', (1024, 512))
    for i, frame in enumerate(frames):
        frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.LANCZOS)
        atlas.alpha_composite(frame, (i % 4 * 256 + (256 - frame.width) // 2, i // 4 * 256 + 244 - frame.height))
    file = DEST / f'characters/{name}-motion.png'
    atlas.save(file, optimize=True)
    report[name] = {'source': sheet.size, 'atlas': atlas.size, 'frame': [256, 256], 'feet': 244, 'bytes': file.stat().st_size}
ground = Image.open(SOURCE / 'glacier-ground-source.png').convert('RGB').resize((1536, 1024), Image.Resampling.LANCZOS)
file = DEST / 'environment/glacier-ground.webp'
ground.save(file, quality=85)
report['ground'] = {'size': ground.size, 'bytes': file.stat().st_size}
(SOURCE.parent / 'assets.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
