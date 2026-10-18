"""Regression for source clipping; never use alpha cleanup to fix anatomy."""
from pathlib import Path
import json,hashlib,subprocess
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/complete-actors/revision-05'
manifest=json.loads((ROOT/'public/assets/visual/complete-actors/manifest.json').read_text())
report={'passed':False,'sourceFrames':[],'unchangedActors':[],'sources':[]}
for actor in ['warrior-female','hunter-male','hunter-female']:
 for style,data in manifest[actor]['styles'].items():
  assert len(data['frames'])==32
  for f in data['frames']:
   if 'revision-05' not in f.get('sourceFile',''):continue
   assert min(f['sourceCoreMargins'])>=3,(actor,style,f)
   report['sourceFrames'].append({'actor':actor,'style':style,'frame':f})
assert len(report['sourceFrames'])==30,len(report['sourceFrames'])
for cls in ['astral','xenobinder']:
 for sex in ['male','female']:
  for style in ['none','basic','reinforced']:
   name=f'public/assets/visual/complete-actors/{cls}-{sex}-{style}.png'
   old=subprocess.check_output(['git','show',f'c57d61f:{name}'],cwd=ROOT)
   assert old==(ROOT/name).read_bytes(),name
   report['unchangedActors'].append(name)
for source in (OUT/'source').glob('*.png'):
 image=Image.open(source);data=source.read_bytes()
 assert image.mode=='RGBA' and image.getchannel('A').getextrema()[0]==0
 report['sources'].append({'file':source.name,'dimensions':list(image.size),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
for image in (ROOT/'public/assets/visual/complete-actors').glob('*.png'):
 assert Image.open(image).size==(768,1536),image
audit=json.loads((OUT/'anchor-audit.json').read_text())
assert len(audit)==768
assert all(43<=a['neck'][1]<=76 and a['score']<=.65 for a in audit)
report['anchors']=len(audit);report['passed']=True
(OUT/'source-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'correctedSourceFrames':len(report['sourceFrames']),'unchangedAssets':len(report['unchangedActors']),'anchors':len(audit)}))
