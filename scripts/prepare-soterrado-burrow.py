"""Prepare the original burrow painting, its foreground lip, and a small dust puff offline."""
from pathlib import Path
import hashlib, json
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
source = Image.open(root/'docs/soterrado-boss/source-art/burrow-source.png').convert('RGBA')
box = source.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
assert box, 'Empty burrow source'
painting = source.crop(box)
painting.thumbnail((496,272),Image.Resampling.LANCZOS)
hole = Image.new('RGBA',(512,288))
hole.alpha_composite(painting,((512-painting.width)//2,(288-painting.height)//2))
# Keep the painted front edge on a separate, perfectly registered quad. This
# technical alpha split hides the creature's feet without a runtime mask/Graphics.
lip = hole.copy()
alpha = lip.getchannel('A')
for y in range(lip.height):
    for x in range(lip.width):
        lateral = (x-256)/256
        edge = (0.47+0.22*max(0,1-lateral*lateral))*288
        weight = min(1,max(0,(y-edge)/4))
        alpha.putpixel((x,y),round(alpha.getpixel((x,y))*weight))
lip.putalpha(alpha)
clean = Image.new('RGBA',lip.size)
clean.alpha_composite(lip)
lip = clean
cloud = Image.new('RGBA',(64,64))
brush = ImageDraw.Draw(cloud)
for box in [(7,22,42,47),(23,13,50,43),(32,25,59,48),(13,11,35,35)]:
    brush.ellipse(box,fill=(225,174,105,110))
cloud = cloud.filter(ImageFilter.GaussianBlur(4))
destination=root/'public/assets/visual/environment'
files=[]
for name,image in [('soterrado-burrow',hole),('soterrado-burrow-lip',lip),('soterrado-dust',cloud)]:
    path=destination/f'{name}.png';image.save(path,optimize=True);files.append(path)
report=[{'file':str(p.relative_to(root)).replace('\\','/'),'dimensions':list(Image.open(p).size),
         'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in files]
(root/'docs/soterrado-boss/burrow-pass/asset-measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
