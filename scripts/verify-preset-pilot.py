"""Inspect shipped alpha, source provenance and real gait pixels."""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'docs/2d-refinement/qa/202/asset-geometry';out.mkdir(parents=True,exist_ok=True)
report={'passed':False,'assets':[]}
try:
 manifest=json.loads((ROOT/'docs/preset-pilot/measurements.json').read_text(encoding='utf8'))
 for asset in manifest['assets']:
  path=ROOT/asset['file'];image=Image.open(path).convert('RGBA');assert image.size==(1536,1728)
  assert hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256']
  source=ROOT/asset['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==asset['sourceSha256']
  for f in range(72):
   a=np.array(image.crop((f%8*192,f//8*192,f%8*192+192,f//8*192+192)))
   assert np.count_nonzero(a[:,:,3]>128)>3000
   assert np.all(a[[0,-1],:,3]==0) and np.all(a[:,[0,-1],3]==0)
  for direction in range(8):
   phases=[]
   for phase in range(4):
    f=40+direction*4+phase
    pixels=np.array(image.crop((f%8*192,f//8*192,f%8*192+192,f//8*192+192)))
    phases.append((pixels[110:,:,3]>128).tobytes())
   assert len(set(phases))==4,(asset['file'],direction,'repeated leg pose')
  assert all(145<m['bodyHeight']<173 for m in asset['measurements'])
  report['assets'].append({'file':asset['file'],'bytes':asset['bytes'],'frames':72,'authoredFigures':48,'directions':8,'gaitPhasesPerDirection':4,'decodedBytes':1536*1728*4,'bodyHeightRange':[min(m['bodyHeight']for m in asset['measurements']),max(m['bodyHeight']for m in asset['measurements'])]})
 report['passed']=True
finally:(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print('202 painted figures:',report['passed'])
