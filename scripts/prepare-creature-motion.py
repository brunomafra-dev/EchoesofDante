"""Pack generated, hand-painted poses offline; no animation artwork generation at runtime."""
from pathlib import Path
import json, sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
doc = root / 'docs/playtest-readability'
manifest = json.loads((doc / 'art-sources.json').read_text(encoding='utf-8'))
originals = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(manifest['generatedDirectory'])
report = []
for asset in manifest['assets']:
    source = Image.open(originals / asset['sourceFile']).convert('RGBA')
    frames = []
    for index in range(8):
        col, row = index % 4, index // 4
        cell = source.crop((round(col * source.width / 4), round(row * source.height / 2), round((col + 1) * source.width / 4), round((row + 1) * source.height / 2)))
        bounds = cell.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
        frames.append(cell.crop(bounds))
    factor = min(236 / max(frame.width for frame in frames), 220 / max(frame.height for frame in frames))
    atlas = Image.new('RGBA', (1024, 512))
    for index, frame in enumerate(frames):
        frame = frame.resize((round(frame.width * factor), round(frame.height * factor)), Image.Resampling.LANCZOS)
        # Same ground contact in every pose, independent of source-sheet whitespace.
        atlas.alpha_composite(frame, ((index % 4) * 256 + (256 - frame.width) // 2, (index // 4) * 256 + 244 - frame.height))
    target = root / 'public/assets/visual/characters' / (asset['key'] + '.png')
    atlas.save(target, optimize=True)
    report.append({'file': target.relative_to(root).as_posix(), 'size': list(atlas.size), 'frameSize': [256, 256], 'frames': 8, 'bytes': target.stat().st_size})
(doc / 'asset-measurements.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
