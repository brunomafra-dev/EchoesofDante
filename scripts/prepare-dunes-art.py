"""Encode the authored Dunes Interiors backplate offline for the web build."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'docs/sirocco-interior-and-sound/source-art/dunes-ground-source.png'
target = root / 'public/assets/visual/environment/dunes-ground.webp'
image = Image.open(source).convert('RGB')
image.save(target, 'WEBP', quality=83, method=6)
report = {'dimensions':list(image.size), 'displayWorldUnits':[3200,2200],
    'bytes':target.stat().st_size, 'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(root/'docs/sirocco-interior-and-sound/asset-measurements.json').write_text(
    json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
