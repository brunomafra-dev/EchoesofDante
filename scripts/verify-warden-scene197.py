"""Verify the isolated art delivery without changing canonical gameplay."""
import hashlib,json,re,struct,subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def sha(data):return hashlib.sha256(data).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True,encoding='utf-8')
def text(path):return (ROOT/path).read_text(encoding='utf-8')
version='0.1.197';out=ROOT/'docs/frontier-3d/qa'/version
package=json.loads(text(Path('package.json')));lock=json.loads(text(Path('package-lock.json')))
assert package['version']==lock['version']==lock['packages']['']['version']==version
assert not git('diff','--name-only','3383376','--','src/scenes','src/entities','src/combat','src/systems','src/config','src/network','server').strip()
old=git('show','3383376:src/experiments/arrival-3d/Warden.ts');new=text(Path('src/experiments/arrival-3d/Warden.ts'))
assert old[old.index(' get solid()'):old.index(' inspect()')]==new[new.index(' get solid()'):new.index(' inspect()')],'Encounter logic changed'
old=git('show','3383376:src/experiments/arrival-3d/World.ts');new=text(Path('src/experiments/arrival-3d/World.ts'))
assert old[old.index(' blocked('):old.index(' setProgress(')]==new[new.index(' blocked('):new.index(' setProgress(')],'Physical world changed'
old=git('show','3383376:src/ui/ApplicationShell.ts');new=text(Path('src/ui/ApplicationShell.ts'))
assert old.replace('arrival-3d.html?v=0.1.196','arrival-3d.html?v=0.1.197')==new

reports=[]
for name in ['scene','state','art','boss','input','entry','performance']:
    p=out/name/'report.json';d=json.loads(p.read_text(encoding='utf-8'));assert d.get('passed') and not d.get('errors'),str(p);reports.append(p.relative_to(ROOT).as_posix())
fights=json.loads((out/'boss/report.json').read_text())['fights']
assert {f['id'] for f in fights}=={'warrior','hunter','astral','xenobinder'}
for f in fights:
    assert f['result']['won'] and f['phases']==[1,2,3]
    assert json.loads((out/'boss'/(f['id']+'-state.json')).read_text())['boss']['art']['active']=='proposal'

models=[]
for name in ['warden-197','warden-arena-197']:
    meta=json.loads(text(Path('public/assets/arrival-3d')/(name+'.json')))
    source=ROOT/'public/assets/arrival-3d'/(name+'.glb');data=source.read_bytes()
    assert len(data)==meta['bytes'] and sha(data)==meta['sha256']
    assert (ROOT/'dist/assets/arrival-3d'/source.name).read_bytes()==data
    assert data[:4]==b'glTF';length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length])
    triangles=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives'])
    assert triangles==meta['triangles'];assert not g.get('animations')
    if name=='warden-197':assert len(g['skins'][0]['joints'])==9
    models.append({'file':source.name,'bytes':len(data),'triangles':triangles,'vertices':sum(g['accessors'][p['attributes']['POSITION']]['count'] for m in g['meshes'] for p in m['primitives']),'materials':len(g.get('materials',[])),'textures':len(g.get('textures',[])),'images':len(g.get('images',[])),'bones':len(g['skins'][0]['joints']) if g.get('skins') else 0,'sha256':sha(data)})

previous=json.loads(text(Path('docs/frontier-3d/qa/0.1.196/publication-hashes.json')))
def canonical(path,data):
    if Path(path).suffix in ['.js','.css','.html','.json','.md','.txt']:data=data.replace(b'\r\n',b'\n')
    if path=='/index.html':data=b'\n'.join(line for line in data.splitlines() if line.strip())+b'\n'
    return data
changed=[];preserved=[]
for path,digest in previous['sha256'].items():
    p=ROOT/'dist'/path.lstrip('/')
    if p.exists() and sha(canonical(path,p.read_bytes()))==digest:preserved.append(path)
    else:changed.append(path)
allowed={'/arrival-3d.html','/arrival-workshop.html','/assets/Effects-blnFtl7S.js','/assets/OrbitControls-gAFM1cj3.js','/assets/arrival-3d/CREDITS.md','/assets/arrival3d-BsOsE8CS.css','/assets/arrival3d-DtSZO00V.js','/assets/arrivalWorkshop-DmXDLIdW.js','/assets/main-1bCKBxf4.js','/index.html','/test-library.html'}
assert set(changed)==allowed,changed
assert len(preserved)==99
assert '?v=0.1.197&amp;lab=warden&amp;scene=197' in text(Path('test-library.html'))
assert (ROOT/'public/assets/arrival-3d/CREDITS.md').read_bytes()==(ROOT/'dist/assets/arrival-3d/CREDITS.md').read_bytes()

# All built JS/CSS, both entry pages, the library, prior model/texture/font/license
# dependencies and the two new models. Manifest is local; sources remain public.
files={p for p in previous['sha256'] if Path(p).suffix not in ['.js','.css','.html']}
for p in (ROOT/'dist/assets').iterdir():
    if p.suffix in ['.js','.css']:files.add('/assets/'+p.name)
files.update(['/index.html','/arrival-3d.html','/arrival-workshop.html','/test-library.html'])
files.update('/assets/arrival-3d/'+name+ext for name in ['warden-197','warden-arena-197'] for ext in ['.glb','.json'])
hashes={p:sha(canonical(p,(ROOT/'dist'/p.lstrip('/')).read_bytes())) for p in sorted(files)}
manifest={'version':version,'passed':True,'hashes':hashes,'textCanonicalLF':['.js','.css','.html','.json','.md','.txt'],'htmlWhitespaceOnlyLines':['/index.html']}
local=ROOT/'.local'/('arrival-build-'+version+'.json');local.parent.mkdir(exist_ok=True);local.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
proof={'version':version,'passed':True,'baseline':'3383376 / published 0.1.196','canonical2DGameplaySourcesUnchanged':True,'wardenGameplayMethodsUnchanged':True,'physicalWorldMethodsUnchanged':True,'menuChange':'Only the existing 3D entry URL version.','preservedPreviousPublishedFiles':len(preserved),'expectedRebuiltOrUpdatedFiles':changed,'localReports':reports,'models':models,'publicationFiles':len(files),'humanApproval':'pending'}
(out/'build-verification.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8');print(json.dumps(proof,indent=2))
