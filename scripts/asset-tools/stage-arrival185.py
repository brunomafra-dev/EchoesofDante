from pathlib import Path
import zipfile,posixpath,urllib.parse,json,hashlib
root=Path('.local/visual184');out=root/'sources';manifest=json.loads(Path('scripts/asset-tools/frontier184-sources.json').read_text())
for r in manifest['archives']:assert hashlib.sha256((root/r['archive']).read_bytes()).hexdigest()==r['sha256']
def stage(archive,entry,name):
 with zipfile.ZipFile(root/(archive+'.zip'))as z:
  g=json.loads(z.read(entry));folder=out/name;folder.mkdir(parents=True,exist_ok=True)
  for resource in [*g.get('images',[]),*g.get('buffers',[])]:
   if 'uri' not in resource:continue
   path=posixpath.normpath(posixpath.join(posixpath.dirname(entry),urllib.parse.unquote(resource['uri'])))
   if path not in z.namelist():path=path.replace('_png.png','.png')
   target=folder/Path(path).name;target.write_bytes(z.read(path));resource['uri']=target.name
  (folder/'model.gltf').write_text(json.dumps(g),encoding='utf-8')
stage('outfits','Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/Female_Peasant.gltf','clothes-female')
stage('ubc','Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Female_FullBody.gltf','human-female')
with zipfile.ZipFile(root/'ubc.zip')as z:
 for name in ['Hair_Buns','Hair_BuzzedFemale','Hair_Long']:
  entry=next(f for f in z.namelist()if'Rigged to Head Bone'in f and f.endswith('/'+name+'.gltf'));stage('ubc',entry,name)
print('Female complete outfit, whole-body source and compatible hairstyles staged from verified CC0 archives.')
