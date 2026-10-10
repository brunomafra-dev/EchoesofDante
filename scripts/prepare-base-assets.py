"""Offline packaging of original generated shuttle and existing expedition portraits."""
from pathlib import Path
import json,sys
from PIL import Image, ImageDraw
out=Path('public/assets/base');out.mkdir(parents=True,exist_ok=True)
if len(sys.argv)>1:
 art=Image.open(sys.argv[1]).convert('RGBA');art.thumbnail((640,480),Image.Resampling.LANCZOS);art.save(out/'landing-shuttle.png',optimize=True)
if len(sys.argv)>2:
 art=Image.open(sys.argv[2]).convert('RGBA');art.thumbnail((256,256),Image.Resampling.LANCZOS);art.save(out/'field-shelter.png',optimize=True)
root=Path('public/assets/visual/characters')
kit=Image.open(root/'expedition-arm-kit.png').convert('RGBA')
registration=json.loads((root/'character-arm-registration.json').read_text())['expedition-arm-kit']
def arm(index,size):
 r=registration[index];p=kit.crop((r['x'],r['y'],r['x']+r['width'],r['y']+r['height']));return p.resize(size,Image.Resampling.LANCZOS).rotate(-82,expand=True,resample=Image.Resampling.BICUBIC)
for role,sex in [('medic','female'),('smith','male'),('expedition','female')]:
 art=Image.open(root/f'wardrobe-warrior-{sex}-none.png').convert('RGBA').crop((0,0,256,256))
 for flip,x in [(False,82),(True,157)]:
  upper=arm(0,(34,20));fore=arm(1,(30,17));glove=arm(2,(15,15))
  if flip:upper=upper.transpose(Image.Transpose.FLIP_LEFT_RIGHT);fore=fore.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  art.alpha_composite(upper,(x,91));art.alpha_composite(fore,(x+3,118));art.alpha_composite(glove,(x+5,144))
 art=art.crop(art.getbbox());art.thumbnail((112,160),Image.Resampling.LANCZOS);art.save(out/f'base-{role}.png',optimize=True)
for tier in [1,2,3]:
 # Resource drops remain minerals/materials; equipment uses its own miniatures.
 art=Image.open('public/assets/visual/environment/mineral-growth.png').convert('RGBA');art=art.crop(art.getbbox());art.thumbnail((32,32))
 canvas=Image.new('RGBA',(48,48));canvas.alpha_composite(art,(8,8));d=ImageDraw.Draw(canvas);d.ellipse((28,29,44,45),fill='#b9a371',outline='#ead49a',width=2);canvas.save(out/f'resource-{tier}.png',optimize=True)
