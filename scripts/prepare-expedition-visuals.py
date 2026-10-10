"""Package original generated civilian sprites and the expedition atlas offline."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
for role in ['medic', 'smith', 'expedition', 'refugee-a', 'refugee-b', 'atlas']:
    parser.add_argument('--' + role, type=Path)
args = parser.parse_args()
out = Path('public/assets/base')
out.mkdir(parents=True, exist_ok=True)
for role, source in vars(args).items():
    if not source:
        continue
    if role == 'atlas':
        art = Image.open(source).convert('RGB')
        art.thumbnail((1120, 748), Image.Resampling.LANCZOS)
        art.save(out / 'dante-expedition-atlas.webp', quality=87)
    else:
        art = Image.open(source).convert('RGBA')
        if art.getchannel('A').getextrema()[0] != 0:
            raise ValueError(f'{role}: real transparent background required')
        art = art.crop(art.getbbox())
        art.thumbnail((180, 240), Image.Resampling.LANCZOS)
        suffix = role.replace('_', '-')
        name = f'base-{suffix}.png' if suffix.startswith('refugee') else f'base-{suffix}-civilian.png'
        art.save(out / name, optimize=True)
