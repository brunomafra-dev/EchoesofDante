"""Register whole imagegen figures; no painting or reconstruction of body parts."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/soterrado-counterplay'
SOURCE = Path(r'C:\Users\1\.codex\generated_images\01a173c1-3677-75b2-89b6-2f3640ffad61\exec-82956c37-6830-4724-a674-5f7cfa7a9fc4.png')
DOC.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE).convert('RGBA')
frames = []
# Generated columns have uneven padding. Locate four whole silhouettes per row
# using their transparent gaps, rather than cutting a claw at a nominal grid edge.
source_boxes = []
for row in range(2):
    top = round(row*image.height/2); bottom = round((row+1)*image.height/2)
    alpha = image.crop((0,top,image.width,bottom)).getchannel('A')
    runs = []; start = None
    for x in range(image.width+1):
        occupied = x<image.width and alpha.crop((x,0,x+1,alpha.height)).getextrema()[1]>96
        if occupied and start is None: start=x
        if not occupied and start is not None:
            if x-start>100: runs.append((start,x))
            start=None
    assert len(runs)==4, runs
    for left,right in runs:
        frame=image.crop((max(0,left-2),top,min(image.width,right+2),bottom))
        box=frame.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()
        assert box
        frames.append(frame.crop((max(0,box[0]-2),max(0,box[1]-2),min(frame.width,box[2]+2),min(frame.height,box[3]+2))))
        source_boxes.append([left,top,right,bottom])
scale = min(350/max(f.width for f in frames),300/max(f.height for f in frames))
atlas = Image.new('RGBA',(1536,768))
bounds = []
for i,frame in enumerate(frames):
    frame = frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
    x = (384-frame.width)//2; y = 357-frame.height
    atlas.alpha_composite(frame,(i%4*384+x,i//4*384+y)); bounds.append([x,y,x+frame.width,357])
path = ROOT / 'public/assets/visual/creature-finish/soterrado-crash-v1.webp'
atlas.save(path,'WEBP',quality=94,method=6)
(DOC/'art-source.json').write_text(json.dumps(dict(tool='Built-in imagegen',source=str(SOURCE),sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),file=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),commonScale=scale,cell=384,baseline=357,sourceBoxes=source_boxes,bounds=bounds),indent=2)+'\n',encoding='utf-8')
print(path, path.stat().st_size, bounds)
