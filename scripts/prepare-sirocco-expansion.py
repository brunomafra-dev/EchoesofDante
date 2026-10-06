"""Encode the authored eastern Sirocco ground painting for browser delivery."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'docs/expansion-sprint-05/source-art/sirocco-east-ground-source.png'
target = root / 'public/assets/visual/environment/sirocco-east-ground.webp'
target.parent.mkdir(parents=True, exist_ok=True)
image = Image.open(source).convert('RGB')
image.save(target, 'WEBP', quality=83, method=6)
measurements = {
    'source': source.relative_to(root).as_posix(),
    'runtime': target.relative_to(root).as_posix(),
    'dimensions': list(image.size),
    'runtimeDisplaySize': [2250, 1500],
    'format': 'WebP',
    'bytes': target.stat().st_size,
    'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
}
(root / 'docs/expansion-sprint-05/asset-measurements.json').write_text(
    json.dumps(measurements, indent=2) + '\n', encoding='utf-8')
print(json.dumps(measurements, indent=2))
