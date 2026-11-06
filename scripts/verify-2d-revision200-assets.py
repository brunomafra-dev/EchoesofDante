"""Check shipped sprite pixels, not the runtime display-size constant."""
from pathlib import Path
import json
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
report={'passed':False,'checks':[]}
out=root/'docs/2d-refinement/qa/200/asset-geometry';out.mkdir(parents=True,exist_ok=True)
try:
 for sex in ['male','female']:
  for style in ['none','basic','reinforced']:
   image=Image.open(root/f'public/assets/visual/complete-actors/warrior-{sex}-{style}-motion-v5.png').convert('RGBA')
   frames=[]
   for direction in range(8):
    for frame in [direction*4,direction*4+3]+([40+direction*4+i for i in range(4)]if direction in [2,6]else[]):
     tile=np.array(image.crop((frame%8*192,frame//8*192,frame%8*192+192,frame//8*192+192)))
     yy,xx=np.where(tile[:,:,3]>128)
     assert len(yy)>1000
     assert max(yy)-min(yy) in range(157,171),(sex,style,frame,'painted height changed',int(max(yy)-min(yy)))
     assert max(yy) in range(178,185),(sex,style,frame,'ground registration')
     assert np.all(tile[[0,-1],:,3]<8) and np.all(tile[:,[0,-1],3]<8),(sex,style,frame,'opaque cell border/background')
     frames.append({'frame':frame,'height':int(max(yy)-min(yy)+1),'top':int(min(yy)),'floor':int(max(yy)),'width':int(max(xx)-min(xx)+1)})
   # New actual contact/passing pixels must vary for both sides.
   for direction in [2,6]:
    silhouettes=[]
    for phase in range(4):
     f=40+direction*4+phase
     a=np.array(image.crop((f%8*192,f//8*192,f%8*192+192,f//8*192+192)))[:,:,3]
     silhouettes.append((a[110:]>128).tobytes())
    assert len(set(silhouettes))==4
   report['checks'].append({'sex':sex,'outfit':style,'frames':frames})
 for cls in ['warrior','hunter','astral','xenobinder']:
  for sex in ['male','female']:
   image=Image.open(root/f'public/assets/visual/customization/heads-{cls}-{sex}-v2.png').convert('RGBA')
   assert image.size==(640,480)
   for row in [4,5]:
    for view in range(8):
     a=np.array(image.crop((view*80,row*80,view*80+80,row*80+80)))
     assert np.count_nonzero(a[:,:,3]>128)>350
     assert np.all(a[[0,-1],:,3]==0) and np.all(a[:,[0,-1],3]==0)
 report['passed']=True
finally:
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('200 painted geometry',report['passed'])
