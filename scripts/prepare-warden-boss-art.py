"""Offline packing only. Generated alpha artwork is never synthesized in the game."""
from pathlib import Path
import json, sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Image.open(sys.argv[1]).convert('RGBA')
frames = []
for index in range(8):
    col, row = index % 4, index // 4
    cell = source.crop((round(col * source.width / 4), round(row * source.height / 2), round((col + 1) * source.width / 4), round((row + 1) * source.height / 2)))
    bounds = cell.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if not bounds:
        raise ValueError(f'Empty frame {index}')
    frames.append(cell.crop(bounds))
factor = min(472 / max(f.width for f in frames), 444 / max(f.height for f in frames))
atlas = Image.new('RGBA', (2048, 1024))
for index, frame in enumerate(frames):
    frame = frame.resize((round(frame.width * factor), round(frame.height * factor)), Image.Resampling.LANCZOS)
    atlas.alpha_composite(frame, ((index % 4) * 512 + (512 - frame.width) // 2, (index // 4) * 512 + 482 - frame.height))
target = root / 'public/assets/visual/characters/warden-motion.png'
atlas.save(target, optimize=True)
report = [{'file': target.relative_to(root).as_posix(), 'dimensions': list(atlas.size), 'frame': [512,512], 'frames': 8, 'bytes': target.stat().st_size}]
if len(sys.argv) > 2:
    gate = Image.open(sys.argv[2]).convert('RGBA').resize((512,512), Image.Resampling.LANCZOS)
    target = root / 'public/assets/visual/environment/open-threshold.png'
    gate.save(target, optimize=True)
    report.append({'file': target.relative_to(root).as_posix(), 'dimensions': list(gate.size), 'bytes': target.stat().st_size})
doc = root / 'docs/warden-boss'
doc.mkdir(parents=True, exist_ok=True)
(doc / 'asset-measurements.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
