"""Technical crop/registration of complete imagegen poses; no limb reconstruction."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/warden-revision-02'
SOURCE = Path(r'C:\Users\1\.codex\generated_images\01a173c1-3677-75b2-89b6-2f3640ffad61\exec-d6eb5692-88a8-4c43-a771-7c443ac19796.png')
DOC.mkdir(parents=True, exist_ok=True)
image = Image.open(SOURCE).convert('RGBA')
frames=[]
for i in range(8):
    frame=image.crop((round(i%4*image.width/4),round(i//4*image.height/2),round((i%4+1)*image.width/4),round((i//4+1)*image.height/2)))
    box=frame.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()
    assert box
    frames.append(frame.crop((max(0,box[0]-2),max(0,box[1]-2),min(frame.width,box[2]+2),min(frame.height,box[3]+2))))
scale=min(478/max(f.width for f in frames),390/max(f.height for f in frames))
atlas=Image.new('RGBA',(2048,1024))
bounds=[]
for i,frame in enumerate(frames):
    frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
    x=(512-frame.width)//2;y=399-frame.height
    atlas.alpha_composite(frame,(i%4*512+x,i//4*512+y));bounds.append([x,y,x+frame.width,399])
path=ROOT/'public/assets/visual/creature-finish/warden-slam-v1.webp'
atlas.save(path,'WEBP',quality=94,method=6)
(DOC/'art-source.json').write_text(json.dumps(dict(tool='Built-in imagegen',source=str(SOURCE),sourceSha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),file=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),commonScale=scale,cell=512,baseline=399,bounds=bounds),indent=2)+'\n',encoding='utf-8')
print(path,scale,bounds)
