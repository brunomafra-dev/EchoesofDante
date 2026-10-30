"""Pack generated RGBA sheets deterministically; no painting or alpha removal."""
from pathlib import Path
from PIL import Image
import hashlib, json
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/mission-identity/source'
OUT=ROOT/'public/assets/mission-identity'
OUT.mkdir(parents=True,exist_ok=True)
report=[]
components=[]
for name in ['research','survival']:
    source=Image.open(SOURCE/(name+'-generated.png')).convert('RGBA')
    assert source.getchannel('A').getextrema()[0]==0, 'Generated alpha required'
    atlas=Image.new('RGBA',(1024,1024))
    pixels=np.array(source)
    count,labels,stats,centers=cv2.connectedComponentsWithStats(cv2.dilate((pixels[:,:,3]>8).astype(np.uint8),np.ones((3,3),np.uint8)),8)
    groups={i:[] for i in range(16)}
    for component in range(1,count):
        if stats[component,cv2.CC_STAT_AREA]<60: continue
        x,y=centers[component]
        groups[min(3,int(y/source.height*4))*4+min(3,int(x/source.width*4))].append(component)
    for i in range(16):
        col,row=i%4,i//4
        assert groups[i],(name,i)
        isolated=pixels.copy()
        isolated[~np.isin(labels,groups[i])]=0
        cell=Image.fromarray(isolated)
        bounds=cell.getchannel('A').getbbox()
        assert bounds,(name,i)
        components.append({'sheet':name,'frame':i,'components':groups[i],'sourceBounds':bounds})
        cell=cell.crop(bounds);cell.thumbnail((216,216),Image.Resampling.LANCZOS)
        packed=Image.new('RGBA',(256,256));packed.alpha_composite(cell,((256-cell.width)//2,232-cell.height))
        atlas.alpha_composite(packed,(col*256,row*256))
        if name=='research' and 12<=i<=14:
            packed.save(OUT/f'necklace-{i-11}-v1.png',optimize=True)
    path=OUT/(name+'-v1.png');atlas.save(path,optimize=True)
for path in sorted(OUT.glob('*.png')):
    report.append({'path':path.relative_to(ROOT).as_posix(),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(ROOT/'docs/mission-identity/assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
(SOURCE/'components.json').write_text(json.dumps(components,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
