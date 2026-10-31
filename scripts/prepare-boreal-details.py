from pathlib import Path
from PIL import Image
import hashlib,json

root=Path(__file__).resolve().parents[1]
source=root/'docs/mobile-boreal-fixes/source'
out=root/'public/assets/boreal-details/melt-pocket-v1.png'
out.parent.mkdir(parents=True,exist_ok=True)
image=Image.open(source/'melt-pocket-generated.png').convert('RGBA')
assert image.getchannel('A').getextrema()[0]==0
image=image.crop(image.getchannel('A').getbbox())
image.thumbnail((480,480),Image.Resampling.LANCZOS)
packed=Image.new('RGBA',(512,512))
packed.alpha_composite(image,((512-image.width)//2,(512-image.height)//2))
packed.save(out,optimize=True)
(source/'asset.json').write_text(json.dumps({'path':out.relative_to(root).as_posix(),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'alphaBounds':packed.getchannel('A').getbbox(),'mode':'Built-in image_gen; alpha trim, resize and transparent padding only'},indent=2)+'\n',encoding='utf-8')
print(out)
