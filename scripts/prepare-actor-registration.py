"""Measure complete-pose anchors offline; never crop or reassemble runtime limbs."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'public/assets/visual/complete-actors'
OUT=ROOT/'docs/complete-actors/revision-03'
OUT.mkdir(parents=True,exist_ok=True)
data={};audit=[]
# Reviewed exceptions: matching a braid/raised hand is not a neck anchor.
OVERRIDES={('hunter-female','reinforced',15):(79,56),
           ('hunter-female','reinforced',19):(87,56)}
for cls in ['warrior','hunter','astral','xenobinder']:
 for sex in ['male','female']:
  actor=f'{cls}-{sex}';data[actor]={}
  for style in ['none','basic','reinforced']:
   image=np.array(Image.open(ART/f'{actor}-{style}.png').convert('RGBA'))
   anchors=[]
   for row in range(8):
    idle=image[row*192:(row+1)*192,:192]
    ys,_=np.where(idle[:,:,3]>40);top=int(ys.min())
    _,hx=np.where(idle[top:top+25,:,3]>40);cx=round(float(hx.mean()))
    x=max(0,cx-22);template=idle[top:top+36,x:x+44,:3];mask=idle[top:top+36,x:x+44,3]
    for col in range(4):
     f=row*4+col;frame=image[row*192:(row+1)*192,col*192:(col+1)*192]
     best=None
     for scale in [.8,.9,1.,1.1,1.2]:
      t=cv2.resize(template,None,fx=scale,fy=scale);m=cv2.resize(mask,(t.shape[1],t.shape[0]))
      result=cv2.matchTemplate(frame[4:90,25:167,:3],t,cv2.TM_SQDIFF_NORMED,mask=m)
      result=np.nan_to_num(result,nan=9,posinf=9,neginf=9)
      score,_,loc,_=cv2.minMaxLoc(result)
      if best is None or score<best[0]:best=(score,25+loc[0],4+loc[1],t.shape[1],t.shape[0])
     score,left,y,w,h=best
     neck=(round(left+w/2,2),y+h)
     # Revision 02 registered these entire locomotion figures at this axis.
     # Template matching a different painting must not move it onto a shoulder.
     if cls in ['warrior','hunter'] and col<3:neck=(96,55)
     if (actor,style,f) in OVERRIDES:neck=OVERRIDES[actor,style,f]
     anchors.append(list(neck))
     audit.append({'actor':actor,'style':style,'frame':f,'score':round(score,4),'neck':list(neck)})
   data[actor][style]=anchors
(ROOT/'src/visual/actorRegistration.json').write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf-8')
(OUT/'anchor-audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'anchors':len(audit),'suspect':[a for a in audit if a['score']>.65 or a['neck'][1]>76 or a['neck'][1]<43]}))
