from pathlib import Path
from PIL import Image
base=Path('public/assets/visual/characters'); out=Path('public/assets/items');out.mkdir(parents=True,exist_ok=True)
for tier,style in [(1,'basic'),(2,'reinforced'),(3,'reinforced')]:
 sheet=Image.open(base/f'wardrobe-warrior-male-{style}.png').convert('RGBA')
 for slot,box in {'helmet':(80,14,181,88),'armor':(58,88,198,154),'legs':(70,154,188,213),'boots':(65,210,191,256),'gloves':(22,91,82,154)}.items():
  art=sheet.crop(box)
  if slot=='gloves':
   kit=Image.open(base/f'{"warrior" if tier==1 else "reinforced"}-arm-kit.png').convert('RGBA');art=kit.crop((256,0,384,128));art=art.crop(art.getbbox())
  art.thumbnail((52,52));canvas=Image.new('RGBA',(64,64));canvas.alpha_composite(art,((64-art.width)//2,(64-art.height)//2));canvas.save(out/f'{slot}-{tier}.png',optimize=True)
 for cls in ['warrior','hunter']:
  name=('warrior-saber-painted.png' if cls=='warrior' else 'star-hunter-weapon-v2.png') if tier==1 else f'{cls}-pilot-weapon.png'
  art=Image.open(base/name).convert('RGBA')
  if cls=='hunter' and tier==1:art=art.crop((0,0,256,256))
  art=art.crop(art.getbbox());art.thumbnail((56,56));canvas=Image.new('RGBA',(64,64));canvas.alpha_composite(art,((64-art.width)//2,(64-art.height)//2));canvas.save(out/f'{cls}-weapon-{tier}.png',optimize=True)
 # Accessory reuses the authored environmental mineral.
 art=Image.open('public/assets/visual/environment/mineral-growth.png').convert('RGBA');art=art.crop(art.getbbox());art.thumbnail((40,40));canvas=Image.new('RGBA',(64,64));canvas.alpha_composite(art,(17,17));canvas.save(out/f'accessory-{tier}.png',optimize=True)
