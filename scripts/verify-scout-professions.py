"""Check shipped source provenance, alpha, distinct gait and emitter pixels."""
from pathlib import Path
import json,hashlib
import argparse
import numpy as np
from PIL import Image
args=argparse.ArgumentParser();args.add_argument('--preset',choices=['hunter','warrior','astral'],default='hunter');args.add_argument('--revision',default=None);options=args.parse_args()
preset=options.preset;revision=options.revision or {'hunter':'203','warrior':'204','astral':'205'}[preset]
ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/{'hunter':'docs/scout-professions','warrior':'docs/pioneer-professions','astral':'docs/erudite-professions'}[preset]
out=ROOT/f'docs/2d-refinement/qa/{revision}/asset-geometry';out.mkdir(parents=True,exist_ok=True)
report={'passed':False,'assets':[]}
try:
 expected={'hunter':12,'warrior':18,'astral':18}[preset]
 data=json.loads((DOC/'measurements.json').read_text(encoding='utf8'));assert len(data['assets'])==expected
 anchor_file={'hunter':'scoutEmitterAnchors.json','warrior':'pioneerEmitterAnchors.json','astral':'eruditeEmitterAnchors.json'}[preset]
 anchors=json.loads((ROOT/'src/visual'/anchor_file).read_text(encoding='utf8'))
 for asset in data['assets']:
  p=ROOT/asset['file'];image=Image.open(p).convert('RGBA');assert image.size==(1536,1536)
  assert hashlib.sha256(p.read_bytes()).hexdigest()==asset['sha256'];assert hashlib.sha256((ROOT/asset['source']).read_bytes()).hexdigest()==asset['sourceSha256']
  for f in range(64):
   tile=np.array(image.crop((f%8*192,f//8*192,f%8*192+192,f//8*192+192)))
   assert np.count_nonzero(tile[:,:,3]>128)>2500
   assert np.all(tile[[0,-1],:,3]==0)and np.all(tile[:,[0,-1],3]==0)
  for d in range(8):
   phases=[]
   for phase in range(4):
    f=32+d*4+phase;a=np.array(image.crop((f%8*192,f//8*192,f%8*192+192,f//8*192+192)));phases.append((a[110:,:,3]>128).tobytes())
   assert len(set(phases))==4
   x,y=anchors[asset['profession']][asset['sex']][asset['style']][d];f=d*4+3
   tile=np.array(image.crop((f%8*192,f//8*192,f%8*192+192,f//8*192+192)));ix,iy=round(x),round(y)
   assert 4<ix<188 and 4<iy<180
   assert np.count_nonzero(tile[max(0,iy-6):iy+7,max(0,ix-6):ix+7,3]>128)>20,'Emitter must lie on the painted instrument'
  heights=[m['bodyHeight']for m in asset['measurements']];assert all(140<h<177 for h in heights)
  report['assets'].append({'file':asset['file'],'sha256':asset['sha256'],'bytes':asset['bytes'],'bodyHeightRange':[min(heights),max(heights)],'frames':64,'authoredFigures':48,'directions':8,'distinctWalkPhases':4,'emitterOnInstrument':True,'decodedBytes':1536*1536*4})
 report['summary']={'preset':preset,'revision':revision,'atlasCount':len(data['assets']),'compressedBytes':sum(a['bytes']for a in data['assets']),'decodedBytesPerAtlas':1536*1536*4,'emitterMethods':{m:sum(a['emitterMethods'].count(m)for a in data['assets'])for m in sorted({m for a in data['assets']for m in a['emitterMethods']})}}
 report['passed']=True
finally:(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(revision,preset,'authored figures',report['passed'])
