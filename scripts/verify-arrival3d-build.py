import argparse,hashlib,json,re,subprocess
parser=argparse.ArgumentParser();parser.add_argument("--version",default="0.1.185");version=parser.parse_args().version
from pathlib import Path
root=Path(f'docs/frontier-3d/qa/{version}');root.mkdir(parents=True,exist_ok=True)
baseline=json.loads(Path('docs/frontier-3d/qa/0.1.185/campaign-baseline.json').read_text(encoding='utf-8'))
for file,digest in baseline['assets'].items():assert hashlib.sha256(Path('dist'+file).read_bytes()).hexdigest()==digest,file
layout=json.loads(Path('src/experiments/arrival-3d/layout.json').read_text(encoding='utf-8'))
for name,digest in layout['sources'].items():assert hashlib.sha256(Path('src/config',name+'.ts').read_bytes().replace(b'\r\n',b'\n')).hexdigest()==digest,name
assert layout['base']['width']==1400 and layout['forest']['size']=={'width':3100,'height':1950}
assert len(layout['forest']['spawns'])==8
manifest=json.loads(Path('public/assets/arrival-3d/sources.json').read_text(encoding='utf-8'))
for record in manifest['files']:assert hashlib.sha256(Path('public/assets/arrival-3d',record['file']).read_bytes()).hexdigest()==record['sha256'],record['file']
pkg=json.loads(Path('package.json').read_text());lock=json.loads(Path('package-lock.json').read_text());assert pkg['version']==lock['version']==lock['packages']['']['version']==version
assert f'arrival-3d.html?v={version}' in Path('test-library.html').read_text(encoding='utf-8')
html=Path('dist/arrival-3d.html').read_text(encoding='utf-8');assert 'phaser-' not in html and 'GameScene-' not in html
extra=Path('dist/arrival-workshop.html').read_text(encoding='utf-8') if version=='0.1.186' else ''
files=set(re.findall(r'(?:src|href)="(/assets/[^"?]+\.(?:js|css))"',html+extra));files.update(['/arrival-3d.html','/test-library.html'])
if extra:files.add('/arrival-workshop.html')
if version=='0.1.186':
 identity=json.loads(Path('public/assets/arrival-3d/identity-186.json').read_text(encoding='utf-8'));assert hashlib.sha256(Path('public/assets/arrival-3d',identity['file']).read_bytes()).hexdigest()==identity['sha256']
 assert hashlib.sha256(Path('dist/assets/arrival-3d',identity['file']).read_bytes()).hexdigest()==identity['sha256']
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
 return hashlib.sha256(data).hexdigest()
publication={'version':version,'htmlEntries':['/arrival-3d.html','/test-library.html']+(['/arrival-workshop.html'] if extra else []),'hashes':{f:digest(f) for f in sorted(files)},'textCanonicalLF':['.html','.json','.md','.txt'],'unchangedCampaignHashes':len(baseline['assets'])}
Path(f'.local/arrival-build-{version}.json').write_text(json.dumps(publication,indent=2)+'\n',encoding='utf-8')
changed=subprocess.check_output(['git','diff','--name-only','8e9a6db'],text=True).splitlines();assert not any(p.startswith(('src/scenes/','src/systems/','src/network/','server/')) for p in changed)
reports=[]
if version=='0.1.186':
 for name in ['route','classes','input','elements','workshop','camp-life','performance','crew','identity']:assert (root/name/'report.json').is_file(),name+' report missing'
for path in root.rglob('report.json'):
 if 'public' in path.parts or 'observations' in path.parts:continue
 data=json.loads(path.read_text(encoding='utf-8'));assert data.get('passed') and not data.get('errors'),str(path);reports.append(path.as_posix())
result={'passed':True,'canonicalLayoutSourceHashes':layout['sources'],'unchangedCampaignHashes':len(baseline['assets']),'publicationHashes':len(files),'referenceModelHashesVerified':True,'runtimeCampaignConfigImports':False,'campaignSourceAndRelayChanged':False,'reports':reports}
(root/'build-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
