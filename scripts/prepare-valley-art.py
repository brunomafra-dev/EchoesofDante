"""Offline crop/packing of original painted poses; no runtime generation."""
from pathlib import Path
import json, sys, hashlib
from PIL import Image
root = Path(__file__).resolve().parents[1]
doc = root / 'docs/resonance-valley'
manifest = json.loads((doc / 'art-sources.json').read_text(encoding='utf8'))
sources = Path(sys.argv[1])
report = []
for asset in manifest['assets']:
    source = Image.open(sources / asset['sourceFile']).convert('RGBA')
    assert source.getchannel('A').getextrema()[0] == 0, 'Real alpha is required'
    if asset['sheet']:
        poses = []
        for i in range(8):
            x, y = i % 4, i // 4
            cell = source.crop((round(x*source.width/4), round(y*source.height/2), round((x+1)*source.width/4), round((y+1)*source.height/2)))
            bounds = cell.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
            assert bounds, f'Missing pose {i}'
            poses.append(cell.crop(bounds))
        scale = min(236 / max(p.width for p in poses), 220 / max(p.height for p in poses))
        result = Image.new('RGBA', (1024, 512))
        for i, pose in enumerate(poses):
            pose = pose.resize((round(pose.width*scale), round(pose.height*scale)), Image.Resampling.LANCZOS)
            result.alpha_composite(pose, ((i%4)*256+(256-pose.width)//2, (i//4)*256+244-pose.height))
        folder = 'characters'
    else:
        source = source.crop(source.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox())
        source.thumbnail((480, 352), Image.Resampling.LANCZOS)
        result = Image.new('RGBA', (512, 384))
        result.alpha_composite(source, ((512-source.width)//2, 368-source.height))
        folder = 'environment'
    target = root / 'public/assets/visual' / folder / (asset['key']+'.png')
    result.save(target, optimize=True)
    report.append({'file':target.relative_to(root).as_posix(), 'dimensions':list(result.size), 'bytes':target.stat().st_size, 'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(doc / 'asset-measurements.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf8')
print(json.dumps(report, indent=2))
