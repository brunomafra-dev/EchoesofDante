from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,subprocess
root=Path('.');out=root/'docs/complete-actors/revision-02/qa';report={'passed':True,'atlases':[],'unchangedOtherClasses':[]}
for cls in ['warrior','hunter']:
 for sex in ['male','female']:
  for style in ['none','basic','reinforced']:
   name=f'{cls}-{sex}-{style}.png';im=Image.open(root/'public/assets/visual/complete-actors'/name);drift=0
   for row in range(8):
    heads=[]
    for col in range(3):
     a=np.array(im.crop((col*192,row*192,(col+1)*192,(row+1)*192)))[:,:,3];ys,xs=np.where(a>40);top=ys.min();bottom=ys.max();yh,xh=np.where(a[top:top+round((bottom-top+1)*.2)]>40);heads.append(float(xh.mean()))
     assert top>=16 and bottom<=186,(name,row,col,top,bottom)
    drift=max(drift,max(heads)-min(heads))
   # A real opposite-support pair, rather than two copies of one front step.
   feet=[]
   for col in [1,2]:
    a=np.array(im.crop((col*192,0,(col+1)*192,192)))[:,:,3];ys,xs=np.where(a>40);yf,xf=np.where(a[ys.max()-7:ys.max()+1]>40);feet.append(float(xf.mean()))
   assert feet[0]>feet[1]+5,(name,feet)
   assert drift<2,(name,drift)
   report['atlases'].append({'file':name,'maxHeadAxisDriftPixels':round(drift,3),'frontSupportCentroidX':[round(f,3) for f in feet]})
for cls in ['astral','xenobinder']:
 for sex in ['male','female']:
  for style in ['none','basic','reinforced']:
   path=f'public/assets/visual/complete-actors/{cls}-{sex}-{style}.png';before=subprocess.check_output(['git','show','03c5881:'+path]);after=Path(path).read_bytes();assert before==after,path;report['unchangedOtherClasses'].append(path)
files=[]
for p in sorted((root/'docs/complete-actors/revision-02/source').glob('*.png')):
 im=Image.open(p);files.append({'file':p.name,'width':im.width,'height':im.height,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'origin':'image_gen.imagegen; original whole-figure artwork'})
(root/'docs/complete-actors/revision-02/sources.json').write_text(json.dumps(files,indent=2)+'\n',encoding='utf-8')
report['downloadBytes']=sum(p.stat().st_size for p in (root/'public/assets/visual/complete-actors').glob('*.png'))
(out/'registration.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'passed':report['passed'],'atlases':len(report['atlases']),'maxHeadAxisDrift':max(a['maxHeadAxisDriftPixels'] for a in report['atlases']),'unchanged':len(report['unchangedOtherClasses']),'downloadMiB':report['downloadBytes']/1024**2}))
