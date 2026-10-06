"""Pack original Sirocco biome art offline; no image generation at runtime."""
from pathlib import Path
import hashlib
import json
import sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
source_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'docs/expansion-sprint-04/source-art'
target_dir = root / 'public/assets/visual/characters'
report = []

for name, target_name in [
    ('dune-pouncer-source.png', 'dante-dune-pouncer-motion.png'),
    ('glass-spitter-source.png', 'dante-glass-spitter-motion.png'),
]:
    source = Image.open(source_dir / name).convert('RGBA')
    assert source.getchannel('A').getextrema()[0] == 0, f'{name}: genuine alpha is required'
    frames = []
    for index in range(8):
        col, row = index % 4, index // 4
        frame = source.crop((round(col * source.width / 4), round(row * source.height / 2),
                             round((col + 1) * source.width / 4), round((row + 1) * source.height / 2)))
        bounds = frame.getchannel('A').point(lambda value: 255 if value > 20 else 0).getbbox()
        assert bounds, f'{name}: missing pose {index}'
        # AI artwork faces down in top-down view; rotate each isolated pose
        # counter-clockwise so the shared Enemy rig can use horizontal flip.
        frames.append(frame.crop(bounds).rotate(90, expand=True))
    scale = min(236 / max(frame.width for frame in frames), 220 / max(frame.height for frame in frames))
    sheet = Image.new('RGBA', (1024, 512))
    for index, frame in enumerate(frames):
        frame = frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.LANCZOS)
        sheet.alpha_composite(frame, ((index % 4) * 256 + (256 - frame.width) // 2,
                                      (index // 4) * 256 + 244 - frame.height))
    target = target_dir / target_name
    sheet.save(target, optimize=True)
    report.append({'file': target.relative_to(root).as_posix(), 'dimensions': list(sheet.size),
                   'frameSize': [256, 256], 'frames': 8, 'bytes': target.stat().st_size,
                   'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})

source = Image.open(source_dir / 'sirocco-ground-source.png').convert('RGB')
source = source.resize((1536, 1024), Image.Resampling.LANCZOS)
target = root / 'public/assets/visual/environment/sirocco-ground.webp'
source.save(target, 'WEBP', quality=83, method=6)
report.append({'file': target.relative_to(root).as_posix(), 'dimensions': list(source.size),
               'format': 'WebP', 'bytes': target.stat().st_size,
               'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})

doc = root / 'docs/expansion-sprint-04/asset-measurements.json'
doc.parent.mkdir(parents=True, exist_ok=True)
doc.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
