"""Register complete authored scout figures for Astral/Beast Binder.

No body segmentation or pose generation. Requires local Pillow/NumPy/OpenCV;
the browser/build consume only the prepared PNGs and measured palm anchors.
"""
from pathlib import Path
import hashlib,json
import cv2
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/scout-professions'
OUT=ROOT/'public/assets/visual/complete-actors/cross'
OUT.mkdir(parents=True,exist_ok=True)
report={'mode':'built-in imagegen; offline whole-figure registration','assets':[]}
emitters={}
for profession in ['astral','xenobinder']:
 emitters[profession]={}
 for sex in ['female','male']:
  emitters[profession][sex]={}
  for style in ['none','basic','reinforced']:
   source=DOC/'source'/f'hunter-{profession}-{sex}-{style}.png'
   if not source.exists():continue
   image=Image.open(source).convert('RGBA');w,h=image.size
   assert image.getchannel('A').getextrema()==(0,255)
   poses=[];measurements=[];scales=[];anchors=[]
   for row in range(6):
    for col in range(8):
     tile=np.array(image.crop((round(col*w/8),round(row*h/6),round((col+1)*w/8),round((row+1)*h/6))))
     n,labels,stats,_=cv2.connectedComponentsWithStats((tile[:,:,3]>32).astype('uint8'),8)
     assert n>1
     label=1+np.argmax(stats[1:,cv2.CC_STAT_AREA]);keep=cv2.dilate((labels==label).astype('uint8'),np.ones((3,3),np.uint8))>0
     tile[:,:,3]=np.where(keep,tile[:,:,3],0)
     rgb=tile[:,:,:3].astype(float);solid=tile[:,:,3]>128
     cyan=(rgb[:,:,1]>rgb[:,:,0]*1.28)&(rgb[:,:,2]>rgb[:,:,0]*1.28)&(rgb[:,:,1]>100)
     body=solid&~cyan;yy,xx=np.where(body);assert len(yy)>1000
     top,bottom=int(yy.min()),int(yy.max())+1
     cap=body.copy();cap[top+int((bottom-top)*.22):]=False
     cx=float(np.median(np.where(cap)[1]))
     if row==0:scales.append(164/(bottom-top))
     scale=scales[col]
     raw=Image.fromarray(tile);box=raw.getchannel('A').getbbox();assert box
     cut=raw.crop(box);cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS)
     x=round(96+(box[0]-cx)*scale);y=round(183+(box[1]-bottom)*scale)
     x=max(2,min(x,190-cut.width));y=max(2,min(y,190-cut.height))
     assert min(x,y)>=2 and x+cut.width<=190 and y+cut.height<=190,(profession,sex,style,row,col,(x,y),cut.size)
     frame=Image.new('RGBA',(192,192));frame.alpha_composite(cut,(x,y));poses.append(frame)
     measurements.append({'sourceRow':row,'direction':col,'bodyHeight':round((bottom-top)*scale,2),'scale':scale,'floor':183,'alphaBounds':frame.getchannel('A').getbbox()})
     if row==5:
      if profession=='astral':core=solid&(rgb[:,:,1]>125)&(rgb[:,:,2]>135)&(rgb[:,:,1]>rgb[:,:,0]*1.35)&(rgb[:,:,2]>rgb[:,:,0]*1.35)
      else:core=solid&(rgb[:,:,1]>110)&(rgb[:,:,0]<210)&(rgb[:,:,1]>rgb[:,:,0]*.9)&(rgb[:,:,1]>rgb[:,:,2]*1.3)
      ey,ex=np.where(core);assert len(ex)>2,(profession,sex,style,col,'no visible palm/wrist emitter')
      anchors.append([round(x+(float(np.mean(ex))-box[0])*scale,2),round(y+(float(np.mean(ey))-box[1])*scale,2)])
   atlas=Image.new('RGBA',(1536,1536))
   for f in range(64):
    if f<32:d,c=divmod(f,4);row=[0,1,3,5][c]
    else:d,phase=divmod(f-32,4);row=1+phase
    atlas.alpha_composite(poses[row*8+d],((f%8)*192,(f//8)*192))
   output=OUT/f'hunter-{profession}-{sex}-{style}-v1.png';atlas.save(output,optimize=True)
   emitters[profession][sex][style]=anchors
   report['assets'].append({'profession':profession,'sex':sex,'style':style,'source':source.relative_to(ROOT).as_posix(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'file':output.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'atlas':[1536,1536],'frames':64,'authoredFigures':48,'emitterAnchors':anchors,'measurements':measurements})
(DOC/'measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
if len(report['assets'])==12:(ROOT/'src/visual/scoutEmitterAnchors.json').write_text(json.dumps(emitters,indent=2)+'\n',encoding='utf8')
print('Packed',len(report['assets']),'complete scout atlases')
