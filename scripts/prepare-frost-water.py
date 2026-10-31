from pathlib import Path
from PIL import Image
import json, hashlib

root = Path(__file__).resolve().parents[1]
source = root / 'docs/frost-water/source'
out = root / 'public/assets/frost-water'
out.mkdir(parents=True, exist_ok=True)
assets = []
for kind in ['collector', 'reserve']:
    original = source / (kind + '-generated.png')
    image = Image.open(original).convert('RGBA')
    assert image.getchannel('A').getextrema()[0] == 0
    image = image.crop(image.getchannel('A').getbbox())
    image.thumbnail((216, 216), Image.Resampling.LANCZOS)
    packed = Image.new('RGBA', (256, 256))
    packed.alpha_composite(image, ((256-image.width)//2, 232-image.height))
    target = out / (kind + '-v1.png')
    packed.save(target, optimize=True)
    assets.append({'path': target.relative_to(root).as_posix(), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'alphaBounds': packed.getchannel('A').getbbox()})
(source / 'assets.json').write_text(json.dumps({'mode': 'Built-in image_gen, two new RGBA objects; deterministic alpha trim/resize/padding only', 'assets': assets}, indent=2)+'\n', encoding='utf-8')
print(json.dumps(assets))
