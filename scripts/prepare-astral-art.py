"""Offline atlas registration of original imagegen paintings and native VFX.
No per-axis warping. Clothing bands match the existing modular body contract.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math, shutil
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/astral/source-art'
OUT=ROOT/'public/assets/visual/characters'
FX=ROOT/'public/assets/visual/astral'
ITEMS=ROOT/'public/assets/items'
for p in [SOURCE,OUT,FX,ITEMS/'ground']:p.mkdir(parents=True,exist_ok=True)

def tight(im):
    b=im.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
    if not b:raise ValueError('Empty authored asset')
    return im.crop(b)

sheet=Image.open(SOURCE/'bodies.png').convert('RGBA')
columns=[90,320,580,790,1020,1265,1536]
shoulders={};measurements={}
def save(im,path):
    im.save(path,optimize=True)
    measurements[str(path.relative_to(ROOT))]={'dimensions':list(im.size),'bytes':path.stat().st_size}

for sex,col in [('male',0),('female',3)]:
    sockets=[]
    for tier,style in enumerate(['none','basic','reinforced']):
        atlas=Image.new('RGBA',(1024,768))
        for direction in range(3):
            x1,x2=columns[col+direction:col+direction+2]
            y1=round(tier*sheet.height/3);y2=round((tier+1)*sheet.height/3)
            part=tight(sheet.crop((x1,y1,x2,y2)))
            scale=224/part.height
            part=part.resize((round(part.width*scale),224),Image.Resampling.LANCZOS)
            base=Image.new('RGBA',(256,256));base.alpha_composite(part,((256-part.width)//2,20))
            for frame in range(4):
                body=base.copy()
                # Tiny rigid displacements of the painted complete legs; no stretching.
                if frame in [1,2]:
                    sign=1 if frame==1 else -1
                    legs=base.crop((0,152,256,256));body.paste((0,0,0,0),(0,154,256,256))
                    left=legs.crop((0,0,128,104));right=legs.crop((128,0,256,104))
                    body.alpha_composite(left,(sign*2,152-sign*2));body.alpha_composite(right,(128-sign*2,152+sign*2))
                atlas.alpha_composite(body,(frame*256,direction*256))
                if tier==0:
                    band=[]
                    for y in range(70,92):
                        xs=[x for x in range(55,201) if base.getpixel((x,y))[3]>145]
                        if xs:band.append((max(xs)-min(xs),y,min(xs),max(xs)))
                    _,y,left,right=max(band)
                    sockets.append({'left':{'x':left+7,'y':y},'right':{'x':right-7,'y':y}})
        save(atlas,OUT/f'wardrobe-astral-{sex}-{style}.png')
    shoulders[sex]=sockets
(OUT/'astral-shoulders.json').write_text(json.dumps(shoulders,indent=2)+'\n',encoding='utf-8')

weapons=Image.open(SOURCE/'gauntlets.png').convert('RGBA')
for i,style in enumerate(['starter','current','advanced']):
    part=tight(weapons.crop((round(i*weapons.width/3),0,round((i+1)*weapons.width/3),weapons.height)))
    part.thumbnail((120,80),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(128,96));canvas.alpha_composite(part,((128-part.width)//2,(96-part.height)//2))
    save(canvas,OUT/f'astral-{style}-weapon.png')
    icon=Image.new('RGBA',(96,96));icon.alpha_composite(canvas.resize((96,72),Image.Resampling.LANCZOS),(0,12));save(icon,ITEMS/f'astral-weapon-{i+1}.png')
    ground=Image.new('RGBA',(96,96));d=ImageDraw.Draw(ground);d.ellipse((14,57,82,75),fill=(3,15,21,100));ground.alpha_composite(icon);save(ground,ITEMS/'ground'/f'astral-weapon-{i+1}.png')

colors={'energy':(95,230,216),'fire':(255,106,74),'water':(131,204,216),'earth':(255,189,84)}
for element,color in colors.items():
    # Small native effect textures baked once offline, reused by fixed pools.
    zone=Image.new('RGBA',(256,256));pixels=zone.load()
    for y in range(256):
        for x in range(256):
            r=math.hypot(x-127.5,y-127.5)/127
            if r<=1:
                edge=math.exp(-((r-.88)/.04)**2)*160
                haze=max(0,1-r)*48
                pixels[x,y]=(*color,round(min(190,edge+haze)))
    draw=ImageDraw.Draw(zone)
    # Broken edge marks also communicate form/state without relying on color.
    for a in range(0,360,90):draw.arc((13,13,242,242),a+8,a+28,fill=(*color,210),width=3)
    save(zone,FX/f'astral-{element}-zone.png')
    bolt=Image.new('RGBA',(64,32));draw=ImageDraw.Draw(bolt);draw.ellipse((1,4,60,28),fill=(*color,60));draw.ellipse((12,10,55,22),fill=(*color,230));draw.ellipse((25,13,53,19),fill=(235,255,249,255));save(bolt,FX/f'astral-{element}-bolt.png')
(SOURCE.parent/'asset-measurements.json').write_text(json.dumps(measurements,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(measurements),'assets;',sum(d['bytes'] for d in measurements.values()),'bytes')
