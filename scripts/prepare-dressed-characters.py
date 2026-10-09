"""Technical offline crop/uniform scale/registration. No per-axis anatomy warping.
Artwork authored as whole dressed bodies by imagegen; original art retained.
"""
from PIL import Image
from pathlib import Path
import json
from collections import deque
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/visual/characters'
SOURCE=ROOT/'docs/modular-characters/revision-03/source-art'
CLOTH=ROOT/'docs/modular-characters/revision-02/source-art'
def tight(im):
 # Ignore tiny disconnected spill from neighboring atlas cells when finding
 # the actor's bounds. Keep head/feet/shoulders as independent painted parts.
 alpha=im.getchannel('A');w,h=im.size;pixels=alpha.tobytes()
 unseen={i for i,a in enumerate(pixels) if a>45};components=[]
 while unseen:
  seed=unseen.pop();queue=deque([seed]);points=[seed]
  while queue:
   i=queue.popleft();x=i%w
   for n in ([i-1] if x else [])+([i+1] if x+1<w else [])+[i-w,i+w]:
    if n in unseen:unseen.remove(n);queue.append(n);points.append(n)
  components.append(points)
 if not components:raise ValueError('empty frame')
 threshold=max(24,max(map(len,components))*.02)
 points=[i for c in components if len(c)>=threshold for i in c]
 b=(min(i%w for i in points),min(i//w for i in points),max(i%w for i in points)+1,max(i//w for i in points)+1)
 return im.crop(b)
def cell(im,i,columns,rows):
 w,h=im.width/columns,im.height/rows
 return im.crop((round(i%columns*w),round(i//columns*h),round((i%columns+1)*w),round((i//columns+1)*h)))
files=[];audit=[]
for cls in ['warrior','hunter']:
 for sex in ['male','female']:
  baseline=Image.open(SOURCE/f'{cls}-{sex}-reference.png').convert('RGBA')
  enhanced=Image.open(SOURCE/f'{cls}-{sex}-reinforced.png').convert('RGBA')
  clothes=Image.open(CLOTH/f'{cls}-{sex}-clothes.png').convert('RGBA')
  for style,source in [('none',clothes),('basic',baseline),('reinforced',enhanced)]:
   atlas=Image.new('RGBA',(1024,768))
   height=196 if cls=='warrior' else 224;ground=236 if cls=='warrior' else 244
   for row in range(3):
    sourceRow=row*2 if style=='none' and cls=='warrior' else row
    rows=6 if style=='none' and cls=='warrior' else 3
    for f in range(4):
     part=tight(cell(source,sourceRow*4+f,4,rows))
     scale=height/part.height
     size=(round(part.width*scale),round(part.height*scale))
     assert size[0]<230 and size[1]<248,(cls,sex,style,row,f,size)
     part=part.resize(size,Image.Resampling.LANCZOS)
     atlas.alpha_composite(part,(f*256+(256-part.width)//2,row*256+ground-part.height))
     audit.append({'class':cls,'sex':sex,'style':style,'row':row,'frame':f,'uniformScale':scale,'size':size,'foot':ground})
   name=f'wardrobe-{cls}-{sex}-{style}.png';atlas.save(OUT/name,optimize=True);files.append(OUT/name)
   if style=='none':
    if cls=='warrior':
     for row,d in enumerate(['front','back','side']):
      name=f'warrior-{sex}-stance-{d}.png';atlas.crop((0,row*256,1024,(row+1)*256)).save(OUT/name,optimize=True);files.append(OUT/name)
    else:
     name=f'hunter-{sex}-stance.png';atlas.save(OUT/name,optimize=True);files.append(OUT/name)
# Crop painted arm bounds once. Runtime thickness excludes transparent margins.
registration={}
for name in ['warrior-arm-kit','expedition-arm-kit','reinforced-arm-kit']:
 im=Image.open(OUT/(name+'.png')).convert('RGBA');bounds=[]
 for i in range(6):
  c=cell(im,i,3,2);b=c.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
  bounds.append({'x':i%3*128+b[0],'y':i//3*128+b[1],'width':b[2]-b[0],'height':b[3]-b[1]})
 registration[name]=bounds
(OUT/'character-arm-registration.json').write_text(json.dumps(registration,indent=2)+'\n')
weapons=Image.open(SOURCE/'starter-weapons.png').convert('RGBA')
for cls,row in [('hunter',0),('warrior',1)]:
 part=tight(cell(weapons,row,1,2));width=244;scale=width/part.width
 part=part.resize((width,round(part.height*scale)),Image.Resampling.LANCZOS)
 if cls=='warrior':
  canvas=Image.new('RGBA',(256,64));canvas.alpha_composite(part,(3,34-part.height//2))
 else:
  # Trigger is ~30% along the rifle; shaft axis crosses above it at y=34.
  canvas=Image.new('RGBA',(256,128));canvas.alpha_composite(part,(3,34-round(part.height*.32)))
 name=f'{cls}-starter-weapon.png';canvas.save(OUT/name,optimize=True);files.append(OUT/name)
(SOURCE.parent/'registration-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
(SOURCE.parent/'asset-measurements.json').write_text(json.dumps({p.name:{'dimensions':Image.open(p).size,'bytes':p.stat().st_size} for p in files},indent=2)+'\n')
print('Prepared',len(files),'assets;',sum(p.stat().st_size for p in files),'bytes')
