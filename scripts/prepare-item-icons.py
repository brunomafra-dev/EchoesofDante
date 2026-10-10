from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
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
 # Wearable focus: authored metal housing, clasp and a small mineral core.
 # Supersampling happens offline, never in the game loop.
 canvas=Image.new('RGBA',(256,256));d=ImageDraw.Draw(canvas)
 accent={1:'#a98cff',2:'#ffbd54',3:'#a98cff'}[tier]
 d.ellipse((101,20,155,75),fill='#1a252b',outline='#a7ada2',width=9)
 d.rounded_rectangle((71,57,185,214),radius=37,fill='#151f26',outline='#747d7b',width=9)
 d.rounded_rectangle((79,62,175,201),radius=30,fill='#414c51',outline='#bcc1af',width=5)
 d.rounded_rectangle((95,81,163,178),radius=22,fill='#11191f',outline='#626d70',width=5)
 d.ellipse((106,94,154,163),fill=accent,outline='#d8cbea',width=4)
 d.ellipse((114,103,126,126),fill='#ece2d6')
 d.line((89,91,89,164),fill='#d0c6aa',width=5)
 d.line((171,107,171,177),fill='#202b30',width=6)
 d.rounded_rectangle((99,182,157,195),radius=4,fill='#b5ab90')
 canvas=canvas.resize((64,64),Image.Resampling.LANCZOS)
 canvas.save(out/f'accessory-{tier}.png',optimize=True)

# Ground views use the exact inventory/character miniature, with readable scale
# and baked contact shadow. No generic mineral marker or runtime decoration.
ground=out/'ground';ground.mkdir(exist_ok=True)
for source in sorted(out.glob('*.png')):
 art=Image.open(source).convert('RGBA');art=art.crop(art.getbbox());art.thumbnail((54,49),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(64,64));shadow=Image.new('RGBA',(64,64))
 d=ImageDraw.Draw(shadow);d.ellipse((10,44,54,57),fill=(4,10,12,115))
 canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(2)))
 canvas.alpha_composite(art,((64-art.width)//2,51-art.height))
 canvas.save(ground/source.name,optimize=True)
