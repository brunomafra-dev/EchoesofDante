import hashlib,json
from pathlib import Path
folder=Path('public/assets/arrival-3d')
sources=json.loads(Path('scripts/asset-tools/frontier184-sources.json').read_text())['archives']
records=[]
for p in sorted(folder.glob('*.glb')):
    records.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
data={'version':'0.1.185','archives':sources,'processing':'Complete male/female work-clothing rigs; shared adult head and selectable tagged hair meshes. Rebind to one skeleton, merge compatible outfit primitives, twelve in-place animation clips, mesh reduction and embedded 512px WebP. Runtime colors and class gear. No limb sprites. Reproduction: stage-arrival185.py then prepare-arrival185.mjs after frontier184 staging.','files':records}
(folder/'sources.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
print('Recorded',len(records),'derived GLBs with archive provenance and SHA-256.')
