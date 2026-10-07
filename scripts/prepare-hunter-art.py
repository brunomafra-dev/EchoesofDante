from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
source=Image.open(ROOT/'docs/star-hunter/source-art/hunter-source.png').convert('RGBA')
w,h=source.size
poses=[]
for r in range(3):
    for c in range(4):
        pose=source.crop((round(c*w/4),round(r*h/3),round((c+1)*w/4),round((r+1)*h/3)))
        box=pose.getchannel('A').getbbox()
        assert box
        poses.append(pose.crop(box))
scale=min(225/max(p.width for p in poses),224/max(p.height for p in poses))
atlas=Image.new('RGBA',(1024,768))
for i,pose in enumerate(poses):
    pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.LANCZOS)
    atlas.alpha_composite(pose,(i%4*256+(256-pose.width)//2,i//4*256+244-pose.height))
dest=ROOT/'public/assets/visual/characters/star-hunter-poses.png'
atlas.save(dest,optimize=True)
(ROOT/'docs/star-hunter/asset-measurements.json').write_text(json.dumps({'source':source.size,'atlas':atlas.size,'frame':[256,256],'bytes':dest.stat().st_size},indent=2)+'\n')
