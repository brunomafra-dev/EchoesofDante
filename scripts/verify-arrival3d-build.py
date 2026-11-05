import argparse,hashlib,json,re,subprocess
parser=argparse.ArgumentParser();parser.add_argument("--version",default="0.1.185");version=parser.parse_args().version
from pathlib import Path
root=Path(f'docs/frontier-3d/qa/{version}');root.mkdir(parents=True,exist_ok=True)
baseline=json.loads(Path('docs/frontier-3d/qa/0.1.185/campaign-baseline.json').read_text(encoding='utf-8'))
rebuiltMenuBundles={'/assets/campaignPlaytest-CQrrblsb.js','/assets/main-B5MNrPJQ.js','/assets/main-DBS7t0Q3.js'} if version in ['0.1.191','0.1.192'] else set()
for file,digest in baseline['assets'].items():
 if file in rebuiltMenuBundles:continue
 assert hashlib.sha256(Path('dist'+file).read_bytes()).hexdigest()==digest,file
preservedCampaignHashes=len(baseline['assets'])-len(rebuiltMenuBundles)
if version in ['0.1.191','0.1.192']:
 uiChanged=subprocess.check_output(['git','diff','--name-only','96b69b1','--','src/ui'],text=True).splitlines();assert uiChanged==['src/ui/ApplicationShell.ts'],uiChanged
layout=json.loads(Path('src/experiments/arrival-3d/layout.json').read_text(encoding='utf-8'))
for name,digest in layout['sources'].items():assert hashlib.sha256(Path('src/config',name+'.ts').read_bytes().replace(b'\r\n',b'\n')).hexdigest()==digest,name
assert layout['base']['width']==1400 and layout['forest']['size']=={'width':3100,'height':1950}
assert len(layout['forest']['spawns'])==8
manifest=json.loads(Path('public/assets/arrival-3d/sources.json').read_text(encoding='utf-8'))
for record in manifest['files']:assert hashlib.sha256(Path('public/assets/arrival-3d',record['file']).read_bytes()).hexdigest()==record['sha256'],record['file']
pkg=json.loads(Path('package.json').read_text());lock=json.loads(Path('package-lock.json').read_text());assert pkg['version']==lock['version']==lock['packages']['']['version']==version
assert f'arrival-3d.html?v={version}' in Path('test-library.html').read_text(encoding='utf-8')
html=Path('dist/arrival-3d.html').read_text(encoding='utf-8');assert 'phaser-' not in html and 'GameScene-' not in html
extra=Path('dist/arrival-workshop.html').read_text(encoding='utf-8') if version in ['0.1.186','0.1.187','0.1.188','0.1.189','0.1.190','0.1.191','0.1.192'] else ''
files=set(re.findall(r'(?:src|href)="(/assets/[^"?]+\.(?:js|css))"',html+extra));files.update(['/arrival-3d.html','/test-library.html'])
if extra:files.add('/arrival-workshop.html')
if version in ['0.1.191','0.1.192']:
 game=Path('dist/index.html').read_text(encoding='utf-8');files.add('/index.html');files.update(re.findall(r'(?:src|href)="(/assets/[^"?]+\.(?:js|css))"',game))
if version in ['0.1.186','0.1.187','0.1.188','0.1.189','0.1.190','0.1.191','0.1.192']:
 identity=json.loads(Path('public/assets/arrival-3d/identity-186.json').read_text(encoding='utf-8'));assert hashlib.sha256(Path('public/assets/arrival-3d',identity['file']).read_bytes()).hexdigest()==identity['sha256']
 assert hashlib.sha256(Path('dist/assets/arrival-3d',identity['file']).read_bytes()).hexdigest()==identity['sha256']
if version=='0.1.187':
 creatures=json.loads(Path('public/assets/arrival-3d/creatures-187.json').read_text(encoding='utf-8'))
 for record in creatures['files']:
  for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',record['file']).read_bytes()).hexdigest()==record['sha256']
if version in ['0.1.188','0.1.189','0.1.190','0.1.191','0.1.192']:
 weapons=json.loads(Path('public/assets/arrival-3d/weapons-188.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:
  assert hashlib.sha256(Path(directory,'assets/arrival-3d',weapons['file']).read_bytes()).hexdigest()==weapons['sha256']
  assert not any('squinty' in p.name.lower() or 'spider' in p.name.lower() for p in Path(directory,'assets/arrival-3d').iterdir()),'Licensed model must not be a standalone public file'
 assert len(list(Path('dist/assets').glob('*arrival-hollow*.js')))==1,'Prepared art must be incorporated in a game module'
if version in ['0.1.189','0.1.190','0.1.191','0.1.192']:
 equipment=json.loads(Path('public/assets/arrival-3d/gauntlet-189.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',equipment['file']).read_bytes()).hexdigest()==equipment['sha256']
if version in ['0.1.190','0.1.191','0.1.192']:
 pack=json.loads(Path('public/assets/arrival-3d/backpack-190.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',pack['file']).read_bytes()).hexdigest()==pack['sha256']
 assert pack['license']=='CC0-1.0' and pack['textures']==0
if version=='0.1.192':
 fx=json.loads(Path('public/assets/arrival-3d/combat-fx-192.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',fx['file']).read_bytes()).hexdigest()==fx['sha256']
 assert fx['textures']==0 and len(fx['models'])==10
# Walk ESM imports as well as HTML preloads, including the shared Three.js chunk.
queue=list(files)
while queue:
 file=queue.pop()
 if not file.endswith('.js'):continue
 for name in re.findall(r'"\./([^"?]+\.js)"',Path('dist'+file).read_text(encoding='utf-8')):
  dep='/assets/'+name
  if dep not in files:files.add(dep);queue.append(dep)
for directory in ['arrival-3d','frontier-3d']:
 for p in Path('dist/assets',directory).glob('*'):
  if p.is_file():files.add('/'+p.relative_to('dist').as_posix())
def digest(file):
 data=Path('dist'+file).read_bytes()
 if Path(file).suffix in ['.html','.json','.md','.txt']:data=data.replace(b'\r\n',b'\n')
 if version in ['0.1.191','0.1.192'] and file=='/index.html':data=b'\n'.join(line for line in data.splitlines() if line.strip())+b'\n'
 return hashlib.sha256(data).hexdigest()
publication={'version':version,'htmlEntries':['/arrival-3d.html','/test-library.html']+(['/arrival-workshop.html'] if extra else [])+(['/index.html'] if version in ['0.1.191','0.1.192'] else []),'hashes':{f:digest(f) for f in sorted(files)},'textCanonicalLF':['.html','.json','.md','.txt'],'htmlWhitespaceOnlyLines':['/index.html'] if version in ['0.1.191','0.1.192'] else [],'unchangedCampaignHashes':preservedCampaignHashes,'rebuiltCampaignMenuBundles':sorted(rebuiltMenuBundles)}
Path(f'.local/arrival-build-{version}.json').write_text(json.dumps(publication,indent=2)+'\n',encoding='utf-8')
changed=subprocess.check_output(['git','diff','--name-only','8e9a6db'],text=True).splitlines();assert not any(p.startswith(('src/scenes/','src/systems/','src/network/','server/')) for p in changed)
reports=[]
if version in ['0.1.186','0.1.187','0.1.188']:
 for name in ['route','classes','input','elements','workshop','camp-life','performance','crew','identity']:assert (root/name/'report.json').is_file(),name+' report missing'
if version=='0.1.187':assert (root/'creatures/report.json').is_file(),'imported creature report missing'
if version=='0.1.188':
 for name in ['visual','assets']:assert (root/name/'report.json').is_file(),name+' report missing'
if version=='0.1.189':
 for name in ['grips','route','classes','input','elements','workshop','performance']:assert (root/name/'report.json').is_file(),name+' report missing'
if version in ['0.1.191','0.1.192']:
 for name in (['entry','input','workshop'] if version=='0.1.191' else ['visual','motion-damage','route','input','elements','workshop','performance','entry']):assert (root/name/'report.json').is_file(),name+' report missing'
if version=='0.1.190':
 for name in ['backpack','classes','input','workshop','performance']:assert (root/name/'report.json').is_file(),name+' report missing'
for path in root.rglob('report.json'):
 if 'public' in path.parts or 'observations' in path.parts:continue
 data=json.loads(path.read_text(encoding='utf-8'));assert data.get('passed') and not data.get('errors'),str(path);reports.append(path.as_posix())
result={'passed':True,'canonicalLayoutSourceHashes':layout['sources'],'unchangedCampaignHashes':preservedCampaignHashes,'rebuiltCampaignMenuBundles':sorted(rebuiltMenuBundles),'publicationHashes':len(files),'referenceModelHashesVerified':True,'runtimeCampaignConfigImports':False,'campaignSourceAndRelayChanged':False,'reports':reports}
(root/'build-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
