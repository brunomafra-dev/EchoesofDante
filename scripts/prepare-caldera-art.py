"""Pack original illustration poses offline with one shared scale/feet anchor."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
source=root/'docs/caldera/source-art'
ground=Image.open(source/'caldera-ground.png').convert('RGB')
ground.save(root/'public/assets/visual/environment/caldera-ground.webp',quality=86)
sheet=Image.open(source/'titan-sheet.png').convert('RGBA')
frames=[]
def isolate_pose(frame):
 # Generated sheets can include detached fragments from an adjacent pose.
 # Keep the connected body, preserving its original soft alpha contour.
 mask=frame.getchannel('A').point(lambda a:255 if a>20 else 0)
 pixels=mask.load(); seen=set(); largest=[]
 for y in range(frame.height):
  for x in range(frame.width):
   if not pixels[x,y] or (x,y) in seen: continue
   pending=[(x,y)]; seen.add((x,y)); component=[]
   while pending:
    px,py=pending.pop(); component.append((px,py))
    for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
     if 0<=nx<frame.width and 0<=ny<frame.height and pixels[nx,ny] and (nx,ny) not in seen:
      seen.add((nx,ny)); pending.append((nx,ny))
   if len(component)>len(largest): largest=component
 keep=Image.new('L',frame.size); kp=keep.load()
 for x,y in largest: kp[x,y]=255
 from PIL import ImageFilter, ImageChops
 keep=keep.filter(ImageFilter.MaxFilter(7))
 frame.putalpha(ImageChops.multiply(frame.getchannel('A'),keep))
 return frame
for i in range(8):
 box=(round(i%4*sheet.width/4),round(i//4*sheet.height/2),round((i%4+1)*sheet.width/4),round((i//4+1)*sheet.height/2))
 frame=isolate_pose(sheet.crop(box))
 mask=frame.getchannel('A').point(lambda a:255 if a>20 else 0)
 assert mask.getbbox(),'Empty animation cell'
 frames.append(frame.crop(mask.getbbox()))
scale=min(236/max(f.width for f in frames),226/max(f.height for f in frames))
atlas=Image.new('RGBA',(1024,512))
for i,frame in enumerate(frames):
 frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
 atlas.alpha_composite(frame,(i%4*256+(256-frame.width)//2,i//4*256+244-frame.height))
file=root/'public/assets/visual/characters/titan-motion.png'
atlas.save(file,optimize=True)
assert atlas.getpixel((0,0))[3]==0
report={'floor':{'size':ground.size,'bytes':(root/'public/assets/visual/environment/caldera-ground.webp').stat().st_size},'titan':{'source':sheet.size,'atlas':atlas.size,'frame':[256,256],'frames':8,'feet':244,'bytes':file.stat().st_size}}
(source.parent/'assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
