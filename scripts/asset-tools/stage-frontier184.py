from pathlib import Path
import zipfile,posixpath,urllib.parse,json,urllib.request,hashlib
root=Path('.local/visual184');out=(root/'sources').resolve();out.mkdir(parents=True,exist_ok=True)
manifest=json.loads(Path('scripts/asset-tools/frontier184-sources.json').read_text())
for record in manifest['archives']:assert hashlib.sha256((root/record['archive']).read_bytes()).hexdigest()==record['sha256'],record['archive']
def stage(archive,entry,name):
 z=zipfile.ZipFile(root/(archive+'.zip'));g=json.loads(z.read(entry));folder=out/name;folder.mkdir(exist_ok=True)
 for data in [*g.get('images',[]),*g.get('buffers',[])]:
  if 'uri' not in data:continue
  uri=urllib.parse.unquote(data['uri']);path=posixpath.normpath(posixpath.join(posixpath.dirname(entry),uri))
  if path not in z.namelist():
   corrected=path.replace('_png.png','.png')
   assert corrected in z.namelist(),path
   print('Creator URI correction',Path(path).name,'->',Path(corrected).name);path=corrected
  target=folder/Path(path).name;target.write_bytes(z.read(path));data['uri']=target.name
 (folder/'model.gltf').write_text(json.dumps(g))
stage('outfits','Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/Male_Peasant.gltf','clothes')
stage('ubc','Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf','human')
z=zipfile.ZipFile(root/'ubc.zip')
for name in ['Hair_Buzzed','Hair_SimpleParted','Hair_Beard']:
 entry=next(f for f in z.namelist() if 'Rigged to Head Bone' in f and f.endswith('/'+name+'.gltf'))
 stage('ubc',entry,name)
for name in ['tree_small_02','fern_02']:
 meta=manifest['nature'][name];folder=root/'ph'/name;folder.mkdir(parents=True,exist_ok=True)
 for path,m in meta['include'].items():
  dest=folder/path;dest.parent.mkdir(parents=True,exist_ok=True)
  if not dest.exists():dest.write_bytes(urllib.request.urlopen(urllib.request.Request(m['url'],headers={'User-Agent':'EchoesOfDante/asset-preparation (+https://echosofdante.vercel.app)'}),timeout=90).read())
  assert hashlib.md5(dest.read_bytes()).hexdigest()==m['md5']
 data=urllib.request.urlopen(urllib.request.Request(meta['url'],headers={'User-Agent':'EchoesOfDante/asset-preparation (+https://echosofdante.vercel.app)'}),timeout=30).read();assert hashlib.md5(data).hexdigest()==meta['md5'];(folder/'model.gltf').write_bytes(data);print(name,'downloaded and verified')
with zipfile.ZipFile(root/'ual.zip')as z:
 entry=next(f for f in z.namelist()if f.endswith('/Unreal-Godot/UAL1_Standard.glb'));folder=out/'ual';folder.mkdir(exist_ok=True);(folder/'UAL1_Standard.glb').write_bytes(z.read(entry))
