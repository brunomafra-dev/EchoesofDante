"""Crop and register eight complete imagegen figures, without limb reconstruction."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/vesper-counterplay'
SOURCE=Path(r'C:\Users\1\.codex\generated_images\01a173c1-3677-75b2-89b6-2f3640ffad61\exec-f5365d98-f31c-4e39-8ef9-69226bf9df49.png')
DOC.mkdir(parents=True,exist_ok=True)
im=Image.open(SOURCE).convert('RGBA');frames=[];source_boxes=[]
for row in range(2):
    top=round(row*im.height/2);bottom=round((row+1)*im.height/2)
    alpha=im.crop((0,top,im.width,bottom)).getchannel('A');runs=[];start=None
    for x in range(im.width+1):
        used=x<im.width and alpha.crop((x,0,x+1,alpha.height)).getextrema()[1]>96
        if used and start is None:start=x
        if not used and start is not None:
            if x-start>100:runs.append((start,x))
            start=None
    assert len(runs)==4,runs
    for left,right in runs:
        frame=im.crop((left,top,right,bottom))
        box=frame.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox();assert box
        frames.append(frame.crop((box[0],max(0,box[1]-1),box[2],min(frame.height,box[3]+1))))
        source_boxes.append([left,top,right,bottom])
scale=min(470/max(f.width for f in frames),365/max(f.height for f in frames))
atlas=Image.new('RGBA',(2048,1024));bounds=[]
for i,frame in enumerate(frames):
    frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
    x=(512-frame.width)//2;y=488-frame.height
    atlas.alpha_composite(frame,(i%4*512+x,i//4*512+y));bounds.append([x,y,x+frame.width,488])
path=ROOT/'public/assets/visual/creature-finish/vesper-reaction-v1.webp'
atlas.save(path,'WEBP',quality=94,method=6)
(DOC/'art-source.json').write_text(json.dumps(dict(tool='Built-in imagegen',source=str(SOURCE),sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),file=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),cell=512,baseline=488,renderScale='VESPER.size / 384',commonScale=scale,sourceBoxes=source_boxes,bounds=bounds),indent=2)+'\n',encoding='utf-8')
print(path,path.stat().st_size,bounds)
