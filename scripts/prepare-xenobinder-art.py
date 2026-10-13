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
shoulders={}
for sex in ['male','female']:
    sheet=Image.open(SOURCE/f'{sex}.png').convert('RGBA');assert sheet.getchannel('A').getextrema()[0]==0
    sockets=[]
    for tier,style in enumerate(['none','basic','reinforced']):
        atlas=Image.new('RGBA',(1024,768))
        for direction in range(3):
            part=isolate(sheet.crop((round(direction*sheet.width/3),round(tier*sheet.height/3),round((direction+1)*sheet.width/3),round((tier+1)*sheet.height/3))))
            scale=224/part.height;part=part.resize((round(part.width*scale),224),Image.Resampling.LANCZOS)
            base=Image.new('RGBA',(256,256));base.alpha_composite(part,((256-part.width)//2,20))
            for frame in range(4):
                body=base.copy()
                if frame in [1,2]:
                    sign=1 if frame==1 else -1
                    legs=base.crop((0,152,256,256));body.paste((0,0,0,0),(0,154,256,256))
                    body.alpha_composite(legs.crop((0,0,128,104)),(sign*2,152-sign*2))
                    body.alpha_composite(legs.crop((128,0,256,104)),(128-sign*2,152+sign*2))
                atlas.alpha_composite(body,(frame*256,direction*256))
                if tier==0:
                    band=[]
                    for y in range(70,92):
                        xs=[x for x in range(55,201) if base.getpixel((x,y))[3]>145]
                        if xs:band.append((max(xs)-min(xs),y,min(xs),max(xs)))
                    _,y,left,right=max(band);sockets.append({'left':{'x':left+7,'y':y},'right':{'x':right-7,'y':y}})
        save(atlas,OUT/f'wardrobe-xenobinder-{sex}-{style}.png')
    shoulders[sex]=sockets
(OUT/'xenobinder-shoulders.json').write_text(json.dumps(shoulders,indent=2)+'\n',encoding='utf-8')
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
