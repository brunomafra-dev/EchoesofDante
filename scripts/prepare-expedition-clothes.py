"""Offline registration/crop/atlas packing only; artwork from imagegen, never generated at runtime."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/modular-characters/revision-02/source-art'
OUT=ROOT/'public/assets/visual/characters'
PARTS=['helmet','torso','legs','boots']

def tight(im):
    box=im.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
    if not box:raise ValueError('empty crop')
    return im.crop(box)
def fit(part,box):
    part=tight(part);return part.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
def cell(im,index,cols,rows):
    w,h=im.width/cols,im.height/rows
    return im.crop((round(index%cols*w),round(index//cols*h),round((index%cols+1)*w),round((index//cols+1)*h)))
kit=Image.open(SOURCE/'reinforced-parts.png').convert('RGBA')
for cls in ['warrior','hunter']:
 for sex in ['male','female']:
  neutral=Image.open(SOURCE/f'{cls}-{sex}-clothes.png').convert('RGBA')
  directions=['front','back','side'] if cls=='warrior' else ['all']
  for d in directions:
   oldname=f"warrior-{'female-' if sex=='female' else ''}poses-{d}" if cls=='warrior' else ('star-hunter-male-body' if sex=='male' else 'star-hunter-body-v2')
   old=Image.open(OUT/f'{oldname}.png').convert('RGBA')
   cloth=Image.new('RGBA',old.size)
   sheets={(style,part):Image.new('RGBA',old.size) for style in ['basic','reinforced'] for part in PARTS}
   count=8 if cls=='warrior' else 12
   for i in range(count):
    original=old.crop((i%4*256,i//4*256,i%4*256+256,i//4*256+256))
    box=original.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
    ni=(['front','back','side'].index(d)*8+i) if cls=='warrior' else i
    part=cell(neutral,ni,4,6 if cls=='warrior' else 3)
    # Match original pose bounding box and planted foot; preserve all game anchors.
    resized=fit(part,box);offset=(i%4*256+box[0],i//4*256+box[1]);cloth.alpha_composite(resized,offset)
    height=box[3]-box[1];head=round(box[1]+height*.25);waist=round(box[1]+height*.58);ankle=round(box[1]+height*.88)
    ranges={'helmet':(box[1],head),'torso':(head,waist),'legs':(waist,ankle),'boots':(ankle,box[3])}
    row=['front','back','side'].index(d) if cls=='warrior' else i//4
    for part,(top,bottom) in ranges.items():
     crop=original.crop((0,top,256,bottom));bounds=crop.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
     if not bounds:continue
     target=(bounds[0],top+bounds[1],bounds[2],top+bounds[3])
     basic=crop
     if part=='helmet':
      crown=original.crop((0,box[1],256,round(box[1]+height*.17)))
      hbox=crown.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
      if hbox:
       target=(hbox[0],top+bounds[1],hbox[2],top+bounds[3])
       basic=Image.new('RGBA',crop.size);basic.alpha_composite(crop.crop((target[0],0,target[2],crop.height)),(target[0],0))
     if part=='torso':
      # Shoulder caps belong to the torso, not the helmet. Crop the original
      # lateral strips above the torso boundary without repainting any art.
      crown=original.crop((0,box[1],256,round(box[1]+height*.17)))
      hb=crown.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
      if hb:
       captop=round(box[1]+height*.17)
       for left,right in [(0,hb[0]),(hb[2],256)]:
        cap=original.crop((left,captop,right,head))
        sheets['basic',part].alpha_composite(cap,(i%4*256+left,i//4*256+captop))
     if part=='helmet' and cls=='hunter':
      helmet=Image.open(OUT/f"warrior-poses-{['front','back','side'][row]}.png").crop((0,40,256,90))
      basic=Image.new('RGBA',crop.size);basic.alpha_composite(fit(helmet,target),(target[0],target[1]-top))
     sheets['basic',part].alpha_composite(basic,(i%4*256,i//4*256+top))
     enhanced=Image.new('RGBA',(256,256))
     if part=='torso':
      art=Image.open(OUT/f"{cls}-pilot-torso-{['front','back','side'][row]}.png").convert('RGBA')
      enhanced.alpha_composite(fit(art,target),(target[0],target[1]))
     elif part in ['legs','boots']:
      art=cell(kit,row*4+(1 if part=='legs' else 2),4,3)
      # Register each leg separately to each existing stepping leg.
      for half in range(2):
       region=crop.crop((half*128,0,(half+1)*128,crop.height));b=region.getchannel('A').point(lambda a:255 if a>45 else 0).getbbox()
       if not b:continue
       t=(b[0]+half*128,b[1]+top,b[2]+half*128,b[3]+top)
       a=art.crop((round(half*art.width/2),0,round((half+1)*art.width/2),art.height))
       # Leg source includes feet: crop away boot before fitting leg guards.
       if part=='legs':a=a.crop((0,0,a.width,round(a.height*.78)))
       enhanced.alpha_composite(fit(a,t),(t[0],t[1]))
     else:
      art=cell(kit,row*4,4,3);enhanced.alpha_composite(fit(art,target),(target[0],target[1]))
     sheets['reinforced',part].alpha_composite(enhanced,(i%4*256,i//4*256))
   cloth.save(OUT/f"{cls}-{sex}-clothes{'-'+d if cls=='warrior' else ''}.png",optimize=True)
   for (style,part),im in sheets.items():im.resize((im.width//2,im.height//2),Image.Resampling.LANCZOS).save(OUT/f'{cls}-{sex}-{style}-{part}-{d}.png',optimize=True)
# Same arm pivots/cell bounding boxes as the established grip rig.
source=Image.open(SOURCE/'arms-clothes.png').convert('RGBA');old=Image.open(OUT/'warrior-arm-kit.png').convert('RGBA')
plain=Image.new('RGBA',old.size);reinforced=old.copy()
for i in range(6):
 b=cell(old,i,3,2).getbbox();a=cell(source,i,3,2);plain.alpha_composite(fit(a,b),(i%3*128+b[0],i//3*128+b[1]))
 if i%3==2:
  a=cell(kit,(0 if i<3 else 1)*4+3,4,3);a=a.crop((0,0,a.width//2,a.height))
  reinforced.paste((0,0,0,0),(i%3*128,i//3*128,i%3*128+128,i//3*128+128));reinforced.alpha_composite(fit(a,b),(i%3*128+b[0],i//3*128+b[1]))
plain.save(OUT/'expedition-arm-kit.png',optimize=True);reinforced.save(OUT/'reinforced-arm-kit.png',optimize=True)
files=list(OUT.glob('*-clothes*.png'))+list(OUT.glob('*-basic-*.png'))+list(OUT.glob('*-reinforced-*.png'))+[OUT/'expedition-arm-kit.png',OUT/'reinforced-arm-kit.png']
(SOURCE.parent/'asset-measurements.json').write_text(json.dumps({p.name:{'size':Image.open(p).size,'bytes':p.stat().st_size} for p in files},indent=2)+'\n')
