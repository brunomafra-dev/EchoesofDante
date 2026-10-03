"""Pack the two original imagegen states offline; common scale and real alpha."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
source = Image.open(args.source).convert('RGBA')
assert source.getchannel('A').getextrema()[0] == 0, 'Real transparency required'
parts = [source.crop((i * source.width // 2, 0, (i + 1) * source.width // 2, source.height)) for i in range(2)]
bounds = [part.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox() for part in parts]
scale = min(488 / max(b[2] - b[0] for b in bounds), 218 / max(b[3] - b[1] for b in bounds))
for part, box, state in zip(parts, bounds, ['closed', 'open']):
    art = part.crop(box)
    art = art.resize((round(art.width * scale), round(art.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (512, 256))
    canvas.alpha_composite(art, ((512 - art.width) // 2, 242 - art.height))
    target = Path(f'public/assets/visual/environment/guardian-lintel-{state}.png')
    canvas.save(target, optimize=True)
    print(f'{target}: 512x256 RGBA, {target.stat().st_size} bytes')
