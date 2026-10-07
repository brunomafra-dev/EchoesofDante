"""Pack original alpha poses and a sandpit crop offline; no runtime art generation."""
from pathlib import Path
import hashlib, json
from PIL import Image

root = Path(__file__).resolve().parents[1]
doc = root / 'docs/soterrado-boss'
source = Image.open(doc / 'source-art/soterrado-source.png').convert('RGBA')
frames = []
for i in range(8):
    col, row = i % 4, i // 4
    cell = source.crop((round(col*source.width/4), round(row*source.height/2),
                        round((col+1)*source.width/4), round((row+1)*source.height/2)))
    bounds = cell.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    assert bounds, f'Empty pose {i}'
    frames.append(cell.crop(bounds))
factor = min(350/max(f.width for f in frames), 335/max(f.height for f in frames))
atlas = Image.new('RGBA', (1536,768))
for i, frame in enumerate(frames):
    frame = frame.resize((round(frame.width*factor),round(frame.height*factor)),Image.Resampling.LANCZOS)
    atlas.alpha_composite(frame, ((i%4)*384+(384-frame.width)//2, (i//4)*384+358-frame.height))
target = root/'public/assets/visual/characters/soterrado-motion.png'
atlas.save(target,optimize=True)
ground = Image.open(root/'public/assets/visual/environment/dunes-ground.webp').convert('RGB')
ground = ground.crop((985,280,1513,875)).resize((1024,1024),Image.Resampling.LANCZOS)
floor = root/'public/assets/visual/environment/sandpit-ground.webp'
ground.save(floor,'WEBP',quality=83,method=6)
report = [{'file':str(p.relative_to(root)).replace('\\','/'), 'bytes':p.stat().st_size,
           'dimensions':list(Image.open(p).size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
          for p in [target,floor]]
(doc/'asset-measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
