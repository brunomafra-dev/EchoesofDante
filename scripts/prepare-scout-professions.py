"""Register complete authored cross-identity figures for all supported presets.

No body segmentation or pose generation. Requires local Pillow/NumPy/OpenCV;
the browser/build consume only the prepared PNGs and measured palm anchors.
"""
from pathlib import Path
import argparse,hashlib,json
import cv2
import numpy as np
from PIL import Image

options=argparse.ArgumentParser();options.add_argument('--preset',choices=['hunter','warrior','astral'],default='hunter');args=options.parse_args()
preset=args.preset
ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/{'hunter':'docs/scout-professions','warrior':'docs/pioneer-professions','astral':'docs/erudite-professions'}[preset]
OUT=ROOT/'public/assets/visual/complete-actors/cross'
OUT.mkdir(parents=True,exist_ok=True)
report={'mode':'built-in imagegen; offline whole-figure registration','assets':[]}
emitters={}
overrides=json.loads((DOC/'emitter-overrides.json').read_text(encoding='utf8')) if (DOC/'emitter-overrides.json').exists() else {}
professions={'hunter':['astral','xenobinder'],'warrior':['hunter','astral','xenobinder'],'astral':['warrior','hunter','xenobinder']}[preset]
for profession in professions:
 emitters[profession]={}
 for sex in ['female','male']:
  emitters[profession][sex]={}
  for style in ['none','basic','reinforced']:
   source=DOC/'source'/f'{preset}-{profession}-{sex}-{style}.png'
   if not source.exists():continue
   image=Image.open(source).convert('RGBA');w,h=image.size
   assert image.getchannel('A').getextrema()==(0,255)
   poses=[];measurements=[];scales=[];anchors=[];anchor_methods=[]
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
      if profession in ['astral','hunter','warrior']:core=solid&(rgb[:,:,1]>125)&(rgb[:,:,2]>135)&(rgb[:,:,1]>rgb[:,:,0]*1.35)&(rgb[:,:,2]>rgb[:,:,0]*1.35)
      else:core=solid&(rgb[:,:,1]>110)&(rgb[:,:,0]<210)&(rgb[:,:,1]>rgb[:,:,0]*.9)&(rgb[:,:,1]>rgb[:,:,2]*1.3)
      if preset in ('warrior','astral'):
       if profession in ['hunter','astral','warrior']:core=solid&(rgb[:,:,1]>75)&(rgb[:,:,2]>85)&(rgb[:,:,1]>rgb[:,:,0]*1.15)&(rgb[:,:,2]>rgb[:,:,0]*1.2)
       if profession=='xenobinder':
        green=(rgb[:,:,1]>105)&(rgb[:,:,1]>rgb[:,:,0]*1.2)&(rgb[:,:,1]>rgb[:,:,2]*1.5)
        amber=(rgb[:,:,0]>115)&(rgb[:,:,1]>100)&(rgb[:,:,2]<rgb[:,:,1]*.65)&(rgb[:,:,0]>rgb[:,:,2]*1.5)
        core=solid&(green|amber)
       # Face visors and colored trousers are not muzzle/hand emitters.
       py,px=np.indices(core.shape);head=(np.abs(px-cx)<(bottom-top)*.16)&(py<top+(bottom-top)*.28)
       legs=py>top+(bottom-top)*.65
       core&=~head&~legs
       n,parts,partstats,centers=cv2.connectedComponentsWithStats(core.astype('uint8'),8)
       candidates=[i for i in range(1,n) if partstats[i,cv2.CC_STAT_AREA]>=3]
       manual=overrides.get(f'{profession}-{sex}-{style}',{}).get(str(col))
       if manual and 'atlasPoint' in manual:
        anchors.append([round(float(manual['atlasPoint'][0]),2),round(float(manual['atlasPoint'][1]),2)])
        anchor_methods.append(manual['kind']);continue
       if candidates:
        chosen=max(candidates,key=lambda i:(centers[i,0]-cx)**2+(centers[i,1]-(top+(bottom-top)*.45))**2)
        core=parts==chosen
       elif not manual:
        # Some rear palms/barrel ends have neutral shading. Register the visible
        # end of the raised instrument, never invent a missing luminous pixel.
        reach=solid&~head&(py>top+(bottom-top)*.20)&(py<top+(bottom-top)*.68)
        ry,rx=np.where(reach);assert len(rx)>10
        right=col in [1,2,3,4];edge=rx.max() if right else rx.min()
        tip=reach&((px>=edge-3) if right else (px<=edge+3));ty,tx=np.where(tip)
        manual={'point':[float(tx.mean()),float(ty.mean())],'kind':'neutral-shaded-instrument-tip'}
      else:manual=None
      if manual:ex0,ey0=manual['point']
      else:
       ey,ex=np.where(core);assert len(ex)>2,(profession,sex,style,col,'no visible palm/wrist emitter')
       ex0,ey0=float(np.mean(ex)),float(np.mean(ey))
      anchors.append([round(x+(ex0-box[0])*scale,2),round(y+(ey0-box[1])*scale,2)])
      anchor_methods.append(manual['kind'] if manual else 'painted-energy-core')
   atlas=Image.new('RGBA',(1536,1536))
   for f in range(64):
    if f<32:d,c=divmod(f,4);row=[0,1,3,5][c]
    else:d,phase=divmod(f-32,4);row=1+phase
    atlas.alpha_composite(poses[row*8+d],((f%8)*192,(f//8)*192))
   output=OUT/f'{preset}-{profession}-{sex}-{style}-v1.png';atlas.save(output,optimize=True)
   emitters[profession][sex][style]=anchors
   report['assets'].append({'profession':profession,'sex':sex,'style':style,'source':source.relative_to(ROOT).as_posix(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'file':output.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size,'atlas':[1536,1536],'frames':64,'authoredFigures':48,'emitterAnchors':anchors,'emitterMethods':anchor_methods,'measurements':measurements})
(DOC/'measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
expected={'hunter':12,'warrior':18,'astral':18}[preset]
anchor_file={'hunter':'scoutEmitterAnchors.json','warrior':'pioneerEmitterAnchors.json','astral':'eruditeEmitterAnchors.json'}[preset]
if len(report['assets'])==expected:(ROOT/'src/visual'/anchor_file).write_text(json.dumps(emitters,indent=2)+'\n',encoding='utf8')
print('Packed',len(report['assets']),'complete',preset,'atlases')
