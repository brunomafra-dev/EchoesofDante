"""Pack authored whole figures; no limb synthesis or runtime optical warp.

python scripts/prepare-preset-pilot.py
Sources: docs/preset-pilot/source/*.png (built-in imagegen, 8 views x 6 poses).
"""
from pathlib import Path
import json,hashlib
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/preset-pilot'
OUT=ROOT/'public/assets/visual/complete-actors/cross'
OUT.mkdir(parents=True,exist_ok=True)
report={'mode':'built-in imagegen; whole-figure crop/registration offline','assets':[]}
for sex in ['female','male']:
 for style in ['none','basic','reinforced']:
  source=DOC/'source'/f'hunter-warrior-{sex}-{style}.png'
  image=Image.open(source).convert('RGBA');w,h=image.size
  assert image.getchannel('A').getextrema()==(0,255)
  poses=[];measurements=[];scales=[]
  for row in range(6):
   for col in range(8):
    tile=np.array(image.crop((round(col*w/8),round(row*h/6),round((col+1)*w/8),round((row+1)*h/6))))
    n,labels,stats,_=cv2.connectedComponentsWithStats((tile[:,:,3]>32).astype('uint8'),8)
    assert n>1
    label=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
    keep=cv2.dilate((labels==label).astype('uint8'),np.ones((3,3),np.uint8))>0
    tile[:,:,3]=np.where(keep,tile[:,:,3],0)
    # Register the body, not the luminous blade, to avoid changing its size
    # when the weapon points sideways. This never modifies any body pixels.
    rgb=tile[:,:,:3].astype(float)
    cyan=(rgb[:,:,1]>rgb[:,:,0]*1.28)&(rgb[:,:,2]>rgb[:,:,0]*1.28)&(rgb[:,:,1]>100)
    body=(tile[:,:,3]>128)&~cyan
    yy,xx=np.where(body);assert len(yy)>1000
    top,bottom=int(yy.min()),int(yy.max())+1
    upper=body.copy();upper[top+int((bottom-top)*.35):]=False
    cx=float(np.median(np.where(upper)[1]))
    if row==0:scales.append(164/(bottom-top))
    scale=scales[col]
    raw=Image.fromarray(tile);box=raw.getchannel('A').getbbox();assert box
    cut=raw.crop(box);cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS)
    x=round(96+(box[0]-cx)*scale);y=round(183+(box[1]-bottom)*scale)
    # Keep a transparent cell border even for an extended saber silhouette.
    x=max(2,min(x,190-cut.width));y=max(2,min(y,190-cut.height))
    assert min(x,y)>=2 and x+cut.width<=190 and y+cut.height<=190,(sex,style,row,col,(x,y),cut.size)
    frame=Image.new('RGBA',(192,192));frame.alpha_composite(cut,(x,y));poses.append(frame)
    measurements.append({'sourceRow':row,'direction':col,'bodyHeight':round((bottom-top)*scale,2),'scale':scale,'floor':183,'bodyCenter':96,'alphaBounds':frame.getchannel('A').getbbox()})
  atlas=Image.new('RGBA',(1536,1728))
  for f in range(72):
   if f<32:d,c=divmod(f,4);row=[0,1,3,5][c]
   elif f<40:d=f-32;row=0
   else:d,phase=divmod(f-40,4);row=1+phase
   atlas.alpha_composite(poses[row*8+d],((f%8)*192,(f//8)*192))
  output=OUT/f'hunter-warrior-{sex}-{style}-v1.png';atlas.save(output,optimize=True)
  report['assets'].append({'sex':sex,'style':style,'source':str(source.relative_to(ROOT)).replace('\\','/'),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'file':str(output.relative_to(ROOT)).replace('\\','/'),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'atlas':[1536,1728],'frames':72,'authoredPoses':48,'measurements':measurements})
(DOC/'measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('Packed',len(report['assets']),'whole-figure atlases')
