"""Contact / authored passing / contact gait, baked as complete paintings.

The 198 cycle warped directly between two wide contacts and omitted the passing
stance. Reuse actual whole-figure paintings without generated intermediate
anatomy. This remains a limited painted gait, requiring human playtest.
"""
from pathlib import Path
import json,hashlib
import cv2,numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent;art=root/'public/assets/visual/complete-actors'
out=root/'docs/2d-refinement/qa/199';out.mkdir(parents=True,exist_ok=True)
anchors=json.loads((root/'src/visual/actorRegistration.json').read_text())
warrior=json.loads((root/'src/visual/warriorWalkRegistration.json').read_text())
S=192
records=[]
def registered(tile,anchor):
 cx,neck=anchor;scale=128/(183-neck)
 return cv2.warpAffine(tile,np.float32([[scale,0,96-cx*scale],[0,scale,183*(1-scale)]]),(S,S),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
for cls in ['warrior','hunter','astral','xenobinder']:
 for sex in ['male','female']:
  for style in ['none','basic','reinforced']:
   name=f'{cls}-{sex}-{style}';source=art/(name+('-walk-v2'if cls=='warrior'else'')+'.png');image=Image.open(source).convert('RGBA')
   table=(warrior if cls=='warrior'else anchors)[f'{cls}-{sex}'][style];base=40 if cls=='warrior'else 32;frames=[]
   for f in range(base):
    original=32+f//4 if cls=='warrior'and f<32 and f%4==0 else f
    tile=np.array(image.crop((original%4*S,original//4*S,original%4*S+S,original//4*S+S)))
    frames.append(registered(tile,table[original]))
   for row in range(8):
    passing=frames[32+row if cls=='warrior'else row*4]
    frames.extend([passing.copy(),frames[row*4+2].copy(),passing.copy(),frames[row*4+1].copy()])
   atlas=Image.new('RGBA',(S*8,((len(frames)+7)//8)*S))
   for f,tile in enumerate(frames):atlas.paste(Image.fromarray(tile),(f%8*S,f//8*S))
   target=art/(name+'-motion-v4.png');atlas.save(target,optimize=True)
   records.append({'file':target.relative_to(root).as_posix(),'source':source.relative_to(root).as_posix(),'frames':len(frames),'columns':8,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()});print(name,flush=True)
(out/'motion-assets.json').write_text(json.dumps({'method':'Four-phase gait from three actual painted whole-figure poses: contact / passing / opposite contact / passing. The passing pose is reused for the other half-cycle. No optical-flow deformation or independently assembled limbs.','assets':records},indent=2)+'\n',encoding='utf-8')
