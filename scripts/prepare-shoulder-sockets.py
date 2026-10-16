"""Read authored body alpha offline; export shoulder attachment metadata only."""
from pathlib import Path
from PIL import Image
import json

root=Path(__file__).resolve().parents[1]
assets=root/'public/assets/visual/characters'
result={}
for cls in ['warrior','hunter']:
 for sex in ['male','female']:
  styles={}
  for style in ['none','basic','reinforced']:
   atlas=Image.open(assets/f'wardrobe-{cls}-{sex}-{style}.png').convert('RGBA')
   frames=[]
   for i in range(12):
    frame=atlas.crop((i%4*256,i//4*256,i%4*256+256,i//4*256+256))
   # Shoulder caps are the widest part of this authored upper-torso band.
   # Head/hair and the belt are deliberately outside the search band.
    band=range(84,104) if cls=='warrior' else range(70,92)
    rows=[]
    for y in band:
     xs=[x for x in range(55,201) if frame.getpixel((x,y))[3]>150]
     if xs:rows.append((max(xs)-min(xs),y,min(xs),max(xs)))
    _,y,left,right=max(rows)
   # Place the hinge inside the painted cap, not at its outer cut edge.
    frames.append({'left':{'x':left+8,'y':y},'right':{'x':right-8,'y':y}})
   styles[style]=frames
  result[f'{cls}-{sex}']=styles['none'] # Legacy fixtures retain the original format.
  result.setdefault('byStyle',{})[f'{cls}-{sex}']=styles
(assets/'character-shoulder-registration.json').write_text(json.dumps(result,indent=2)+'\n')
print('Registered 144 painted shoulder pairs; no artwork changed')

# Register the actual opaque bone axis in the existing cropped limb paintings.
# Uniform runtime scaling preserves sleeve thickness and avoids cardboard joints.
path=assets/'character-arm-registration.json'
arms=json.loads(path.read_text())
for key,parts in arms.items():
 atlas=Image.open(assets/f'{key}.png').convert('RGBA')
 for index,part in enumerate(parts):
  def point(fraction):
   target=round(part['width']*fraction)
   for x in sorted(range(part['width']),key=lambda v:abs(v-target)):
    ys=[y for y in range(part['height']) if atlas.getpixel((part['x']+x,part['y']+y))[3]>180]
    if ys:break
   return {'x':x,'y':ys[len(ys)//2]}
  part['root']=point(.16 if index%3==0 else .12)
  part['tip']=point(.86)
path.write_text(json.dumps(arms,indent=2)+'\n')
