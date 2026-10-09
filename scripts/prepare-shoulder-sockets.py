"""Read authored body alpha offline; export shoulder attachment metadata only."""
from pathlib import Path
from PIL import Image
import json

root=Path(__file__).resolve().parents[1]
assets=root/'public/assets/visual/characters'
result={}
for cls in ['warrior','hunter']:
 for sex in ['male','female']:
  atlas=Image.open(assets/f'wardrobe-{cls}-{sex}-none.png').convert('RGBA')
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
  result[f'{cls}-{sex}']=frames
(assets/'character-shoulder-registration.json').write_text(json.dumps(result,indent=2)+'\n')
print('Registered 48 painted shoulder pairs; no artwork changed')
