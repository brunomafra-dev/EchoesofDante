"""Offline technical preparation only: alpha crop, uniform scale and atlas packing."""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/frozen-reach/source-art'
DEST = ROOT / 'public/assets/visual'
ground = Image.open(SOURCE / 'frost-ground-source.png').convert('RGB')
ground.resize((1536, 1024), Image.Resampling.LANCZOS).save(DEST / 'environment/frost-ground.webp', quality=86)
report = {}
for kind in ['pouncer', 'spitter']:
    image = Image.open(SOURCE / f'frost-{kind}-source.png').convert('RGBA')
    w,h=image.size
    cells = [(round(c*w/4),round(r*h/2),round((c+1)*w/4),round((r+1)*h/2)) for r in range(2) for c in range(4)]
    if kind == 'pouncer':
        cells[4]=(0,h//2,round(w*.299),h)
        cells[5]=(round(w*.299),h//2,w//2,h)
    poses=[]
    for cell in cells:
        pose=image.crop(cell)
        bbox=pose.getchannel('A').getbbox()
        assert bbox, 'Empty pose'
        poses.append(ImageOps.mirror(pose.crop(bbox))) # Runtime rigs use right-facing art.
    scale=min(230/max(p.width for p in poses),218/max(p.height for p in poses))
    atlas=Image.new('RGBA',(1024,512))
    for i,pose in enumerate(poses):
        pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.LANCZOS)
        atlas.alpha_composite(pose,(i%4*256+(256-pose.width)//2,i//4*256+244-pose.height))
    file=DEST / f'characters/frost-{kind}-motion.png'
    file.parent.mkdir(parents=True,exist_ok=True)
    atlas.save(file,optimize=True)
    report[kind]={'source':image.size,'atlas':[1024,512],'frame':[256,256],'feetBaseline':244,'bytes':file.stat().st_size}
(ROOT/'docs/frozen-reach/asset-measurements.json').write_text(json.dumps(report,indent=2)+'\n')
