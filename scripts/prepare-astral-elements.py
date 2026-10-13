"""Prepare original elemental paintings and native electricity offline.
Runtime uses small reusable image pools; this script is never shipped/executed there.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import math, json, random

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/astral/elemental-v2/source-art'
OUT = ROOT / 'public/assets/visual/astral'
OUT.mkdir(parents=True, exist_ok=True)
metrics = {}

def save(image, name):
    path = OUT / f'astral-{name}-v2.png'
    image.save(path, optimize=True)
    metrics[str(path.relative_to(ROOT))] = {'dimensions': list(image.size), 'bytes': path.stat().st_size}

def tight(image):
    bounds = image.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if bounds is None: raise ValueError('Missing alpha silhouette')
    return image.crop(bounds)

def fit(image, size):
    image = image.copy()
    image.thumbnail(size, Image.Resampling.LANCZOS)
    return image

for element in ['fire', 'water', 'earth']:
    sheet = Image.open(SOURCE / f'{element}.png').convert('RGBA')
    assert sheet.getpixel((0,0))[3] == 0, 'Background must actually be transparent'
    projectile = tight(sheet.crop((0,0,sheet.width//2,sheet.height)))
    formation = tight(sheet.crop((sheet.width//2,0,sheet.width,sheet.height)))
    bolts = Image.new('RGBA', (512,96))
    fields = Image.new('RGBA', (768,192))
    for frame in range(4):
        shot = fit(projectile, (116,64))
        if element == 'earth': shot = shot.rotate((frame-1.5)*7, Image.Resampling.BICUBIC, expand=True)
        else: shot = shot.rotate((frame-1.5)*1.5, Image.Resampling.BICUBIC, expand=True)
        bolts.alpha_composite(shot, (frame*128+(128-shot.width)//2,(96-shot.height)//2))
        art = fit(formation, (174,166))
        if element != 'earth':
            art = art.resize((art.width, round(art.height*[1,.985,1.02,.99][frame])), Image.Resampling.LANCZOS)
        cell = Image.new('RGBA',(192,192))
        shift = (3-frame)*35 if element == 'earth' else 0
        cell.alpha_composite(art,((192-art.width)//2,176-art.height+shift))
        # The stone is revealed above a fixed ground contact; it never scales like rubber.
        if element == 'earth': cell.paste((0,0,0,0),(0,177,192,192))
        fields.alpha_composite(cell,(frame*192,0))
    save(bolts, element+'-bolt')
    save(fields, element+'-field')

cyan=(95,230,216)
electric_bolts=Image.new('RGBA',(512,96))
electric_fields=Image.new('RGBA',(768,192))
for frame in range(4):
    bolt=Image.new('RGBA',(128,96));draw=ImageDraw.Draw(bolt)
    path=[(8,48),(30,38+frame*3),(43,54),(65,34+frame*2),(77,53),(116,48)]
    draw.line(path,fill=(*cyan,65),width=12);bolt=bolt.filter(ImageFilter.GaussianBlur(3))
    draw=ImageDraw.Draw(bolt);draw.line(path,fill=(*cyan,220),width=4);draw.line(path,fill=(232,255,251,255),width=1)
    draw.line([(55,46),(48,68-frame*3),(31,65)],fill=(*cyan,180),width=2)
    electric_bolts.alpha_composite(bolt,(frame*128,0))
    field=Image.new('RGBA',(192,192));draw=ImageDraw.Draw(field)
    rng=random.Random(60+frame)
    for i in range(6):
        x,y=38+i*21,110+rng.randrange(-30,30)
        points=[(x,y),(x+8,y-23),(x-4,y-38),(x+13,y-54)]
        draw.line(points,fill=(*cyan,180),width=3);draw.line(points,fill=(225,255,250,235),width=1)
    electric_fields.alpha_composite(field,(frame*192,0))
save(electric_bolts,'energy-bolt');save(electric_fields,'energy-field')

for element in ['energy','fire','water','earth']:
    atlas=Image.new('RGBA',(512,128))
    for frame in range(4):
        cell=Image.new('RGBA',(128,128));draw=ImageDraw.Draw(cell);rng=random.Random(41)
        if element=='energy':
            # A technological lattice with crossing conductors, never a magic rune/ring.
            for i in range(-3,4):
                draw.line([(10,64+i*11),(118,64+i*11)],fill=(*cyan,105+frame*25),width=1)
                draw.line([(64+i*11,10),(64+i*11,118)],fill=(*cyan,140),width=1)
            for x,y in [(42,42),(64,64),(86,86),(42,86),(86,42)]:draw.ellipse((x-2,y-2,x+2,y+2),fill=(216,255,249,220))
            mask=Image.new('L',(128,128));ImageDraw.Draw(mask).ellipse((8,12,120,116),fill=255)
            cell.putalpha(Image.composite(cell.getchannel('A'),Image.new('L',(128,128)),mask))
        elif element=='fire':
            # Soft contact warmth: the illustrated field already contains real embers.
            pixels=cell.load()
            for y in range(128):
                for x in range(128):
                    r=math.hypot((x-64)/56,(y-64)/46)
                    pixels[x,y]=(150,66+frame*5,22,round(max(0,1-r*r)**2*65))
        elif element=='water':
            draw.ellipse((10,17,118,112),fill=(44,107,124,55))
            for i in range(4):
                inset=12+i*12
                draw.arc((inset,inset,128-inset,128-inset),15+frame*12,115+frame*12,fill=(159,220,226,110-i*10),width=2)
        else:
            # Diffuse grounded shadow, without a hard circular decal under the rock.
            pixels=cell.load()
            for y in range(128):
                for x in range(128):
                    r=math.hypot((x-64)/57,(y-64)/47)
                    pixels[x,y]=(27,24,20,round(max(0,1-r*r)**2*105))
        atlas.alpha_composite(cell,(frame*128,0))
    save(atlas,element+'-ground')

(SOURCE.parent/'asset-measurements.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(metrics),'elemental atlases;',sum(x['bytes'] for x in metrics.values()),'bytes')
