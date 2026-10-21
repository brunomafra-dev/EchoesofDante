"""Deterministic atlas slicing/export only. Paintings are generated offline."""
from pathlib import Path
from PIL import Image, ImageOps
import json, hashlib

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/mission-props/source'
OUT = ROOT / 'public/assets/mission-props'
OUT.mkdir(parents=True, exist_ok=True)
names = ['alloy', 'amber-shell', 'boreal-core', 'water', 'biology', 'spring', 'route', 'soil', 'site']
atlas = Image.open(SOURCE / 'survey-material-atlas.png').convert('RGBA')
report = []
for i, name in enumerate(names):
    col, row = i % 3, i // 3
    # The painted sheet's bottom-row stake protrudes above its nominal cell.
    # Use measured row separators rather than including a neighbor's orange tip.
    rows = [0, 420, 800, atlas.height]
    cell = atlas.crop((col*atlas.width//3, rows[row], (col+1)*atlas.width//3, rows[row+1]))
    bounds = cell.getchannel('A').getbbox()
    assert bounds, name
    cell = cell.crop(bounds)
    cell.thumbnail((216,216), Image.Resampling.LANCZOS)
    export = Image.new('RGBA',(224,224))
    export.alpha_composite(cell, ((224-cell.width)//2, (224-cell.height)//2))
    path = OUT / (name+'-v1.png')
    export.save(path, optimize=True)
    report.append({'file':str(path.relative_to(ROOT)), 'size':path.stat().st_size, 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
share = ROOT / 'public/assets/share/dante-expedition-v1.jpg'
share.parent.mkdir(parents=True, exist_ok=True)
ImageOps.fit(Image.open(SOURCE / 'expedition-cover.png').convert('RGB'), (1200,630), method=Image.Resampling.LANCZOS).save(share, quality=90, optimize=True)
report.append({'file':str(share.relative_to(ROOT)), 'size':share.stat().st_size, 'sha256':hashlib.sha256(share.read_bytes()).hexdigest()})
(ROOT/'docs/mission-props/assets.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
