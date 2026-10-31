from pathlib import Path
from PIL import Image
import json,hashlib

root=Path(__file__).resolve().parents[1]
source=root/'docs/ice-transfer/source'
out=root/'public/assets/ice-transfer'
out.mkdir(parents=True,exist_ok=True)
image=Image.open(source/'sled-generated.png').convert('RGBA')
assert image.getchannel('A').getextrema()[0]==0
image=image.crop(image.getchannel('A').getbbox())
image.thumbnail((216,216),Image.Resampling.LANCZOS)
packed=Image.new('RGBA',(256,256))
packed.alpha_composite(image,((256-image.width)//2,232-image.height))
path=out/'sled-v1.png'
packed.save(path,optimize=True)
(source/'asset.json').write_text(json.dumps({'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'alphaBounds':packed.getchannel('A').getbbox(),'mode':'Built-in image_gen new RGBA whole sled; deterministic alpha trim, resize and padding only.'},indent=2)+'\n',encoding='utf-8')
print(path)
