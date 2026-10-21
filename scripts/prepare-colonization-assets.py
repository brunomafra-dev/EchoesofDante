"""Offline crop, size and pack original generated raster art; no runtime art generation."""
from pathlib import Path
from PIL import Image
import hashlib, json, sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('C:/Users/1/.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783')
assets = [
 ('exec-4d4645a0-997d-43be-b401-08b1f2163ee3.png','camp-ground',False,1024),
 ('exec-3a935f5d-bac8-4a1c-93f3-ec82161d5da6.png','camp-supplies',False,512),
 ('exec-312a2bd3-5f57-446a-aa62-fa327981e99b.png','spring-pool',False,1024),
 ('exec-cb54a190-4f0c-40c3-ae33-24ec704b78d7.png','first-habitat',False,768),
 ('exec-701324f2-f416-4820-a58e-77a8f8479c0d.png','dante-bankGrazer-motion',True,256),
 ('exec-7207b515-43c4-4d88-8e33-30587f225e5d.png','dante-reedSpitter-motion',True,256),
]
target = root/'public/assets/colonization'; target.mkdir(parents=True,exist_ok=True)
report=[]
for filename,key,sheet,size in assets:
 p=source/filename; image=Image.open(p).convert('RGBA')
 if sheet:
  frames=[]
  for index in range(8):
   x,y=index%4,index//4
   cell=image.crop((round(x*image.width/4),round(y*image.height/2),round((x+1)*image.width/4),round((y+1)*image.height/2)))
   bounds=cell.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
   frames.append(cell.crop(bounds))
  factor=min(230/max(f.width for f in frames),218/max(f.height for f in frames))
  final=Image.new('RGBA',(1024,512))
  for i,frame in enumerate(frames):
   frame=frame.resize((round(frame.width*factor),round(frame.height*factor)),Image.Resampling.LANCZOS)
   final.alpha_composite(frame,((i%4)*256+(256-frame.width)//2,(i//4)*256+244-frame.height))
 else:
  bounds=image.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
  final=image.crop(bounds);final.thumbnail((size,size),Image.Resampling.LANCZOS)
 output=target/(key+'.png');final.save(output,optimize=True)
 report.append({'key':key,'file':output.relative_to(root).as_posix(),'dimensions':list(final.size),'bytes':output.stat().st_size,'frames':8 if sheet else 1,'sourceFile':filename,'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sourceDimensions':list(image.size),'origin':'Original OpenAI built-in imagegen; transparent background; offline packing only'})
docs=root/'docs/first-settlement';docs.mkdir(parents=True,exist_ok=True)
(docs/'assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
