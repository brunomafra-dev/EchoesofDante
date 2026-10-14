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

measurements={}
def save(im,path):
    im.save(path,optimize=True)
    measurements[str(path.relative_to(ROOT))]={'dimensions':list(im.size),'bytes':path.stat().st_size}
# The audited body pipeline has authored walk poses; never restore shifted leg strips.
import runpy
runpy.run_path(str(ROOT/'scripts/prepare-caster-motion.py'),run_name='__main__')
for entry in json.loads((ROOT/'docs/caster-motion-audit/assets.json').read_text(encoding='utf-8')):
    if 'wardrobe-astral-' in entry['asset']:measurements[entry['asset']]={'dimensions':entry['dimensions'],'bytes':entry['bytes']}

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
