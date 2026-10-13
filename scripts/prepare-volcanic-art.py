"""Original paintings -> lightweight game assets, prepared entirely offline."""
from pathlib import Path
from PIL import Image,ImageFilter,ImageChops
import json
root=Path(__file__).resolve().parents[1]
source=root/'docs/caldera/expansion/source-art'
report=[]
for name in ('cinder','obsidian'):
 image=Image.open(source/(name+'.png')).convert('RGB')
 target=root/'public/assets/visual/environment'/(name+'-ground.webp')
 image.save(target,quality=86)
 report.append({'name':name,'size':image.size,'bytes':target.stat().st_size})
def isolate(frame):
 mask=frame.getchannel('A').point(lambda a:255 if a>20 else 0);px=mask.load();seen=set();largest=[]
 for y in range(frame.height):
  for x in range(frame.width):
   if not px[x,y] or (x,y) in seen:continue
   stack=[(x,y)];seen.add((x,y));component=[]
   while stack:
    a,b=stack.pop();component.append((a,b))
    for nx,ny in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
     if 0<=nx<frame.width and 0<=ny<frame.height and px[nx,ny] and (nx,ny) not in seen:seen.add((nx,ny));stack.append((nx,ny))
   if len(component)>len(largest):largest=component
 keep=Image.new('L',frame.size);kp=keep.load()
 for x,y in largest:kp[x,y]=255
 keep=keep.filter(ImageFilter.MaxFilter(7));frame.putalpha(ImageChops.multiply(frame.getchannel('A'),keep))
 return frame.crop(frame.getchannel('A').point(lambda a:255 if a>20 else 0).getbbox())
for name in ('ember-hound','fumarole','slagback'):
 sheet=Image.open(source/(name+'.png')).convert('RGBA');assert sheet.getchannel('A').getextrema()[0]==0
 frames=[isolate(sheet.crop((round(i%3*sheet.width/3),round(i//3*sheet.height/2),round((i%3+1)*sheet.width/3),round((i//3+1)*sheet.height/2)))) for i in range(6)]
 scale=min(230/max(f.width for f in frames),226/max(f.height for f in frames))
 atlas=Image.new('RGBA',(768,512))
 for i,frame in enumerate(frames):
  f=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
  atlas.alpha_composite(f,(i%3*256+(256-f.width)//2,i//3*256+244-f.height))
 target=root/'public/assets/visual/characters'/(name+'-motion.png');atlas.save(target,optimize=True)
 report.append({'name':name,'source':sheet.size,'atlas':atlas.size,'frames':6,'frame':[256,256],'feet':244,'bytes':target.stat().st_size})
(source.parent/'assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
