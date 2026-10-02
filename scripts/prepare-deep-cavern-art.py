"""Offline alpha crop/resize only; paintings authored with built-in imagegen.
python scripts/prepare-deep-cavern-art.py <original generated image directory>
"""
from pathlib import Path
import json, sys, hashlib
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/expansion-deep-cavern'
OUT = ROOT / 'public/assets/visual/environment'
manifest = json.loads((DOC / 'art-sources.json').read_text(encoding='utf-8'))
sizes = {'deep-stratum':(512,256),'deep-mineral':(512,384),'deep-relay':(448,512)}
report = []
for asset in manifest['assets']:
    key = asset['key']
    source = Image.open(Path(sys.argv[1]) / asset['sourceFile']).convert('RGBA')
    box = source.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox()
    if not box: raise ValueError('Missing alpha cutout')
    painting = source.crop(box)
    size = sizes[key]
    painting.thumbnail((size[0]-24,size[1]-24),Image.Resampling.LANCZOS)
    result = Image.new('RGBA',size)
    result.alpha_composite(painting,((size[0]-painting.width)//2,(size[1]-painting.height)//2))
    filename = OUT / f'{key}.png'
    result.save(filename,optimize=True)
    report.append({'file':filename.relative_to(ROOT).as_posix(),'size':size,'bytes':filename.stat().st_size,'sha256':hashlib.sha256(filename.read_bytes()).hexdigest()})
(DOC / 'asset-measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
