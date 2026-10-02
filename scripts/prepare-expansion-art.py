"""Offline alpha crop and size normalization of original imagegen paintings."""
from pathlib import Path
import json, hashlib, sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
doc = root / 'docs/expansion-sprint-02'
manifest = json.loads((doc / 'art-sources.json').read_text(encoding='utf-8'))
originals = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(manifest['generatedDirectory'])
report = []
for asset in manifest['assets']:
    image = Image.open(originals / asset['sourceFile']).convert('RGBA')
    if asset.get('transparent', True):
        assert image.getchannel('A').getextrema()[0] == 0, 'Transparent cutout required'
    if asset.get('preserveCanvas', False):
        target = root / 'public/assets/visual' / asset['folder'] / (asset['key'] + '.png')
        image.resize(tuple(asset['size']), Image.Resampling.LANCZOS).save(target, optimize=True)
        report.append({'file': target.relative_to(root).as_posix(), 'size': asset['size'], 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
        continue
    bounds = image.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    painting = image.crop(bounds)
    width, height = asset['size']
    painting.thumbnail((width - 16, height - 16), Image.Resampling.LANCZOS)
    result = Image.new('RGBA', (width, height))
    result.alpha_composite(painting, ((width - painting.width) // 2, (height - painting.height) // 2))
    target = root / 'public/assets/visual' / asset['folder'] / (asset['key'] + '.png')
    result.save(target, optimize=True)
    report.append({'file': target.relative_to(root).as_posix(), 'size': [width, height], 'bytes': target.stat().st_size, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(doc / 'asset-measurements.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
