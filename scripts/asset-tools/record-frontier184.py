"""Verify original free archives, extract their actual licenses, record derived hashes."""
from pathlib import Path
import hashlib,json,zipfile
out=Path('public/assets/frontier-3d');root=Path('.local/visual184')
sources=[('ubc','fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40','License_Standard.txt','Quaternius-UBC-CC0.txt'),('ual','cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724','License.txt','Quaternius-UAL-CC0.txt'),('outfits','c3468b18871cc8c8f05ab14df7712baf22cb9f389cbd870babf130e595187f70','License_Standard.txt','Quaternius-Outfits-CC0.txt')]
for name,digest,suffix,dest in sources:
 data=(root/(name+'.zip')).read_bytes();assert hashlib.sha256(data).hexdigest()==digest,name
 with zipfile.ZipFile(root/(name+'.zip'))as z:
  entry=next(f for f in z.namelist() if f.endswith('/'+suffix));license=z.read(entry)
  assert b'CC0' in license or b'Zero' in license
  normalized='\n'.join(line.rstrip() for line in license.decode('utf-8-sig').splitlines()).rstrip()+'\n';(out/dest).write_text(normalized,encoding='utf-8',newline='\n')
archives=[]
for (name,digest,_,_),url in zip(sources,['https://quaternius.itch.io/universal-base-characters','https://quaternius.itch.io/universal-animation-library','https://quaternius.itch.io/modular-character-outfits-fantasy']):archives.append({'archive':name+'.zip','sha256':digest,'officialPage':url,'edition':'free Standard','license':'CC0-1.0 as included in the verified archive'})
nature={name:json.loads((root/(name+'-files.json')).read_text())['gltf']['1k']['gltf'] for name in ['tree_small_02','fern_02']}
Path('scripts/asset-tools/frontier184-sources.json').write_text(json.dumps({'archives':archives,'nature':nature},indent=2)+'\n',encoding='utf-8')
names=['crew-explorer.glb','crew-ivo.glb','tree_small_02.glb','tree_small_02_far.glb','fern_02.glb','rock-moss-far.glb','tree-canopy-0.webp','tree-canopy-1.webp']+[s[3]for s in sources]
files=[{'file':name,'bytes':(out/name).stat().st_size,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest()}for name in names]
manifest={'version':'0.1.184','sources':archives,'natureSourceManifest':'scripts/asset-tools/frontier184-sources.json','derivation':'Complete clothing rig plus head/hair on shared bones and eight in-place clips. PBR maps preserved at 512. Natural trunk/branches simplified offline; crossed canopy impostors baked from the complete tree at 768x1024. Fern geometry simplified; distant rock LOD. No external runtime API.','treeBake':json.loads((root/'tree-bake.json').read_text()),'files':files}
(out/'visual184.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('Verified',len(files),'derived files and three original archive licenses.')
