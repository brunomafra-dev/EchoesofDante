"""Offline crop/resize/registration of original imagegen art. No runtime generation.
Run python scripts/prepare-modular-characters.py. Source alpha/paint preserved.
"""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/modular-characters/source-art'
OUT=ROOT/'public/assets/visual/characters'
def crop(im,box):
    part=im.crop(box)
    occupied=part.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
    if not occupied:raise ValueError(box)
    return part.crop(occupied)
def atlas(name,source,cols,edges,rows,height,ground=None):
    im=Image.open(SOURCE/source).convert('RGBA')
    sheet=Image.new('RGBA',(1024,256*len(rows)*(2 if cols==8 else 1)))
    for outputrow,row in enumerate(rows):
        parts=[crop(im,(round(c*im.width/cols),edges[row],round((c+1)*im.width/cols),edges[row+1])) for c in range(cols)]
        scale=height/parts[0].height
        for i,p in enumerate(parts):
            p=p.resize((round(p.width*scale),round(p.height*scale)),Image.Resampling.LANCZOS)
            assert p.width<256 and p.height<248,(name,i,p.size)
            index=outputrow*cols+i
            y=(ground-p.height) if ground is not None else 20
            sheet.alpha_composite(p,(index%4*256+(256-p.width)//2,index//4*256+y))
    sheet.save(OUT/name,optimize=True)
for direction,row in [('front',0),('back',2),('side',3)]:
    atlas(f'warrior-female-poses-{direction}.png','warrior-female.png',8,[0,227,441,670,890,1086],[row],196,236)
atlas('star-hunter-male-body.png','hunter-male-armless.png',4,[0,370,733,1086],[0,1,2],224)
for cls in ['warrior','hunter']:
    im=Image.open(SOURCE/f'{cls}-kit.png').convert('RGBA')
    for direction,box in [('front',(100,0,700,505)),('back',(830,0,1360,505)),('side',(150,500,590,1024))]:
        p=crop(im,box);p.thumbnail((224,224),Image.Resampling.LANCZOS)
        p.save(OUT/f'{cls}-pilot-torso-{direction}.png',optimize=True)
    box=(590,675,1536,850) if cls=='warrior' else (605,565,1536,925)
    p=crop(im,box)
    if cls=='warrior':
        # Register actual hilt centre at the same pixel as the original saber.
        p=p.resize((244,round(p.height*244/p.width)),Image.Resampling.LANCZOS)
        weapon=Image.new('RGBA',(256,64));weapon.alpha_composite(p,(3,34-p.height//2))
    else:
        p.thumbnail((256,128),Image.Resampling.LANCZOS);weapon=p
    weapon.save(OUT/f'{cls}-pilot-weapon.png',optimize=True)
files=list(OUT.glob('warrior-female-poses-*.png'))+list(OUT.glob('*-pilot-*.png'))+[OUT/'star-hunter-male-body.png']
measurements={p.name:{'dimensions':Image.open(p).size,'bytes':p.stat().st_size} for p in files}
(ROOT/'docs/modular-characters/asset-measurements.json').write_text(json.dumps(measurements,indent=2)+'\n')
print(json.dumps(measurements))
