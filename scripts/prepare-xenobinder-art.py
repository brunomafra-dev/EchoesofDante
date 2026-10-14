"""Offline registration of original Xenobinder paintings. No runtime generation."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import json, math
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/xenobinder/source-art'
OUT=ROOT/'public/assets/visual/characters'
FX=ROOT/'public/assets/visual/xenobinder'
ITEMS=ROOT/'public/assets/items'
for p in [SOURCE,OUT,FX,ITEMS/'ground']:p.mkdir(parents=True,exist_ok=True)
measurements={}
def save(im,path):
    im.save(path,optimize=True)
    measurements[str(path.relative_to(ROOT))]={'dimensions':list(im.size),'bytes':path.stat().st_size}
def tight(im):
    box=im.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
    if not box:raise ValueError('Empty asset')
    return im.crop(box)
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
    return tight(frame)
# Audited complete walk poses replace the old cut/shift leg export.
import runpy
runpy.run_path(str(ROOT/'scripts/prepare-caster-motion.py'),run_name='__main__')
for entry in json.loads((ROOT/'docs/caster-motion-audit/assets.json').read_text(encoding='utf-8')):
    if 'wardrobe-xenobinder-' in entry['asset']:measurements[entry['asset']]={'dimensions':entry['dimensions'],'bytes':entry['bytes']}
sheet=Image.open(SOURCE/'symbiont.png').convert('RGBA');assert sheet.getchannel('A').getextrema()[0]==0
frames=[isolate(sheet.crop((round(i%4*sheet.width/4),round(i//4*sheet.height/2),round((i%4+1)*sheet.width/4),round((i//4+1)*sheet.height/2)))) for i in range(8)]
scale=min(230/max(f.width for f in frames),226/max(f.height for f in frames));atlas=Image.new('RGBA',(1024,512))
for i,frame in enumerate(frames):
    f=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
    atlas.alpha_composite(f,(i%4*256+(256-f.width)//2,i//4*256+244-f.height))
save(atlas,OUT/'dante-symbiont-motion.png')
sheet=Image.open(SOURCE/'conductors.png').convert('RGBA');assert sheet.getchannel('A').getextrema()[0]==0
for i,style in enumerate(['starter','current','advanced']):
    part=isolate(sheet.crop((round(i*sheet.width/3),0,round((i+1)*sheet.width/3),sheet.height)))
    part.thumbnail((120,80),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(128,96));canvas.alpha_composite(part,((128-part.width)//2,(96-part.height)//2));save(canvas,OUT/f'xenobinder-{style}-weapon.png')
    icon=Image.new('RGBA',(96,96));icon.alpha_composite(canvas.resize((96,72),Image.Resampling.LANCZOS),(0,12));save(icon,ITEMS/f'xenobinder-weapon-{i+1}.png')
    ground=Image.new('RGBA',(96,96));ImageDraw.Draw(ground).ellipse((14,57,82,75),fill=(3,15,21,100));ground.alpha_composite(icon);save(ground,ITEMS/'ground'/f'xenobinder-weapon-{i+1}.png')
color=(107,180,100)
bolt=Image.new('RGBA',(64,32));d=ImageDraw.Draw(bolt);d.ellipse((1,4,60,28),fill=(*color,55));d.ellipse((12,10,55,22),fill=(*color,220));d.ellipse((25,13,53,19),fill=(235,255,220,255));save(bolt,FX/'xeno-bolt.png')
link=Image.new('RGBA',(96,16));d=ImageDraw.Draw(link)
for offset in [-2,2]:
    d.line([(x,8+offset+round(math.sin(x/12)*2)) for x in range(96)],fill=(*color,120),width=2)
save(link,FX/'xeno-link.png')
pulse=Image.new('RGBA',(256,256));px=pulse.load()
for y in range(256):
    for x in range(256):
        dx=x-127.5;dy=y-127.5;r=math.hypot(dx,dy)/127;a=math.atan2(dy,dx)
        rim=.83+math.sin(a*5)*.025+math.sin(a*9)*.015
        if r<=1:px[x,y]=(*color,round(min(180,math.exp(-((r-rim)/.035)**2)*140+max(0,1-r)*32)))
save(pulse,FX/'xeno-pulse.png')
(SOURCE.parent/'asset-measurements.json').write_text(json.dumps(measurements,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(measurements),'assets;',sum(d['bytes'] for d in measurements.values()),'bytes')
