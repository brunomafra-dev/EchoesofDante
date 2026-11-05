import argparse,hashlib,json,re,subprocess
parser=argparse.ArgumentParser();parser.add_argument("--version",default="0.1.185");version=parser.parse_args().version
from pathlib import Path
root=Path(f'docs/frontier-3d/qa/{version}');root.mkdir(parents=True,exist_ok=True)
baseline=json.loads(Path('docs/frontier-3d/qa/0.1.185/campaign-baseline.json').read_text(encoding='utf-8'))
rebuiltMenuBundles={'/assets/campaignPlaytest-CQrrblsb.js','/assets/main-B5MNrPJQ.js','/assets/main-DBS7t0Q3.js'} if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196'] else set()
# Canonical class/discovery constants now shared with 3D; Vite repartitions their
# importers. Gameplay source preservation is checked independently below.
if version in ['0.1.193','0.1.194','0.1.195','0.1.196']:rebuiltMenuBundles={'/assets/campaignPlaytest-CQrrblsb.js', '/assets/glacierPlaytest-wZdYXW2s.js', '/assets/GameScene-CTRoUD6_.js', '/assets/main-C5ZCoIy6.js', '/assets/creatureFinish-wMp2Gneg.js', '/assets/qualityReference-C4yP8nt9.js', '/assets/inventoryPlaytest-D2Si5ung.js', '/assets/main-B5MNrPJQ.js', '/assets/worldFinish-Cp221cpy.js', '/assets/basePlaytest-C6SHsimq.js', '/assets/CoopSession-CMZ8Z9Sh.js', '/assets/main-DBS7t0Q3.js', '/assets/forestFinish-BQfjl3nz.js', '/assets/LocalJourney-Duxx5BnI.js'}
if version=='0.1.196':
 rebuiltMenuBundles={'/assets/GameScene-CTRoUD6_.js', '/assets/wholeBody-BI28ie1m.js', '/assets/game-0auHfTkW.js', '/assets/CoopSession-CMZ8Z9Sh.js', '/assets/basePlaytest-C6SHsimq.js', '/assets/main-DBS7t0Q3.js', '/assets/main-C5ZCoIy6.js', '/assets/qualityReference-C4yP8nt9.js', '/assets/campaignPlaytest-CQrrblsb.js', '/assets/glacierPlaytest-wZdYXW2s.js', '/assets/inventoryPlaytest-D2Si5ung.js', '/assets/main-B5MNrPJQ.js', '/assets/progression-Bq2rHKqT.js', '/assets/worldFinish-Cp221cpy.js', '/assets/npcReview-Z07iQTXa.js', '/assets/LocalJourney-Duxx5BnI.js', '/assets/Controls-DaKoTlyT.js', '/assets/creatureFinish-wMp2Gneg.js', '/assets/Movement-CBzfCq9l.js', '/assets/regionalExpeditions-cfJyB5zc.js', '/assets/forestFinish-BQfjl3nz.js', '/assets/permanence-uQwWAwvp.js'}
 assert not subprocess.check_output(['git','diff','--name-only','9fe759f','--','src/scenes','src/entities','src/combat','src/systems','src/config','src/network','server'],text=True).strip(),'Canonical gameplay sources changed'
for file,digest in baseline['assets'].items():
 if file in rebuiltMenuBundles:continue
 assert hashlib.sha256(Path('dist'+file).read_bytes()).hexdigest()==digest,file
preservedCampaignHashes=len(baseline['assets'])-len(rebuiltMenuBundles)
if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
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
extra=Path('dist/arrival-workshop.html').read_text(encoding='utf-8') if version in ['0.1.186','0.1.187','0.1.188','0.1.189','0.1.190','0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196'] else ''
files=set(re.findall(r'(?:src|href)="(/assets/[^"?]+\.(?:js|css))"',html+extra));files.update(['/arrival-3d.html','/test-library.html'])
if extra:files.add('/arrival-workshop.html')
if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
 game=Path('dist/index.html').read_text(encoding='utf-8');files.add('/index.html');files.update(re.findall(r'(?:src|href)="(/assets/[^"?]+\.(?:js|css))"',game))
if version in ['0.1.186','0.1.187','0.1.188','0.1.189','0.1.190','0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
 identity=json.loads(Path('public/assets/arrival-3d/identity-186.json').read_text(encoding='utf-8'));assert hashlib.sha256(Path('public/assets/arrival-3d',identity['file']).read_bytes()).hexdigest()==identity['sha256']
 assert hashlib.sha256(Path('dist/assets/arrival-3d',identity['file']).read_bytes()).hexdigest()==identity['sha256']
if version=='0.1.187':
 creatures=json.loads(Path('public/assets/arrival-3d/creatures-187.json').read_text(encoding='utf-8'))
 for record in creatures['files']:
  for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',record['file']).read_bytes()).hexdigest()==record['sha256']
if version in ['0.1.188','0.1.189','0.1.190','0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
 weapons=json.loads(Path('public/assets/arrival-3d/weapons-188.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:
  assert hashlib.sha256(Path(directory,'assets/arrival-3d',weapons['file']).read_bytes()).hexdigest()==weapons['sha256']
  assert not any('squinty' in p.name.lower() or 'spider' in p.name.lower() for p in Path(directory,'assets/arrival-3d').iterdir()),'Licensed model must not be a standalone public file'
 assert len(list(Path('dist/assets').glob('*arrival-hollow*.js')))==1,'Prepared art must be incorporated in a game module'
if version in ['0.1.189','0.1.190','0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
 equipment=json.loads(Path('public/assets/arrival-3d/gauntlet-189.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',equipment['file']).read_bytes()).hexdigest()==equipment['sha256']
if version in ['0.1.190','0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
 pack=json.loads(Path('public/assets/arrival-3d/backpack-190.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',pack['file']).read_bytes()).hexdigest()==pack['sha256']
 assert pack['license']=='CC0-1.0' and pack['textures']==0
if version=='0.1.192':
 fx=json.loads(Path('public/assets/arrival-3d/combat-fx-192.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',fx['file']).read_bytes()).hexdigest()==fx['sha256']
 assert fx['textures']==0 and len(fx['models'])==10
if version in ['0.1.193','0.1.194','0.1.195','0.1.196']:
 fx=json.loads(Path('public/assets/arrival-3d/combat-fx-193.json').read_text(encoding='utf-8'))
 crew=json.loads(Path('public/assets/arrival-3d/crew-193.json').read_text(encoding='utf-8'))
 for record in [fx,*crew['models']]:
  for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',record['file']).read_bytes()).hexdigest()==record['sha256']
 assert fx['textures']==0 and len(fx['models'])==16
 for name in (['identity-bridge','state'] if version=='0.1.196' else ['identity-bridge','crew'] if version=='0.1.193' else ['identity-bridge','looks','assets']):assert (root/name/'report.json').is_file(),name+' report missing'
if version in ['0.1.194','0.1.195','0.1.196']:
 looks=json.loads(Path('public/assets/arrival-3d/looks-194.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',looks['file']).read_bytes()).hexdigest()==looks['sha256']
 assert len(looks['models'])==22 and looks['textures']==4
if version in ['0.1.195','0.1.196']:
 work=json.loads(Path('public/assets/arrival-3d/crew-work-195.json').read_text(encoding='utf-8'))
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',work['file']).read_bytes()).hexdigest()==work['sha256']
 assert len(work['models'])==11 and work['textures']==5
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
if version in ['0.1.194','0.1.195','0.1.196']:files.update('/assets/settlement-life/'+name+'.webp' for name in ['ivo-work-r1','lia-work-r1','nara-work-r1','caio-motion-r4','elisa-motion-r5'])
def digest(file):
 data=Path('dist'+file).read_bytes()
 if Path(file).suffix in ['.html','.json','.md','.txt']:data=data.replace(b'\r\n',b'\n')
 if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196'] and file=='/index.html':data=b'\n'.join(line for line in data.splitlines() if line.strip())+b'\n'
 return hashlib.sha256(data).hexdigest()
publication={'version':version,'htmlEntries':['/arrival-3d.html','/test-library.html']+(['/arrival-workshop.html'] if extra else [])+(['/index.html'] if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196'] else []),'hashes':{f:digest(f) for f in sorted(files)},'textCanonicalLF':['.html','.json','.md','.txt'],'htmlWhitespaceOnlyLines':['/index.html'] if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196'] else [],'unchangedCampaignHashes':preservedCampaignHashes,'rebuiltCampaignMenuBundles':sorted(rebuiltMenuBundles)}
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
if version in ['0.1.191','0.1.192','0.1.193','0.1.194','0.1.195','0.1.196']:
 for name in (['state','campaign','boss','guard','return','residents','journey-ux','approaches','warden-art','identity-bridge','crew','input','workshop','entry','performance'] if version=='0.1.196' else ['crew','looks','identity-bridge','camp-life','input','workshop','entry','performance'] if version=='0.1.195' else ['entry','input','workshop'] if version=='0.1.191' else ['looks','identity-bridge','visual','motion-damage','input','workshop','performance','entry'] if version in ['0.1.194','0.1.195','0.1.196'] else ['visual','motion-damage','route','input','elements','workshop','performance','entry']):assert (root/name/'report.json').is_file(),name+' report missing'
if version=='0.1.190':
 for name in ['backpack','classes','input','workshop','performance']:assert (root/name/'report.json').is_file(),name+' report missing'
for path in root.rglob('report.json'):
 if 'public' in path.parts or 'observations' in path.parts:continue
 data=json.loads(path.read_text(encoding='utf-8'));assert data.get('passed') and not data.get('errors'),str(path);reports.append(path.as_posix())
if version=='0.1.196':
 stone=json.loads(Path('public/assets/arrival-3d/cavern-stone-196.json').read_text());assert hashlib.sha256(Path('public/assets/arrival-3d',stone['file']).read_bytes()).hexdigest()==stone['sha256'];assert hashlib.sha256(Path(stone['source']).read_bytes()).hexdigest()==stone['sourceSha256']
 warden=json.loads(Path('public/assets/arrival-3d/warden-196.json').read_text());assert warden['triangles']==6004 and warden['bones']==9
 for directory in ['public','dist']:assert hashlib.sha256(Path(directory,'assets/arrival-3d',warden['file']).read_bytes()).hexdigest()==warden['sha256']
result={'passed':True,'canonicalLayoutSourceHashes':layout['sources'],'unchangedCampaignHashes':preservedCampaignHashes,'rebuiltCampaignMenuBundles':sorted(rebuiltMenuBundles),'publicationHashes':len(files),'referenceModelHashesVerified':True,'runtimeCampaignConfigImports':version in ['0.1.193','0.1.194','0.1.195','0.1.196'],'campaignSourceAndRelayChanged':False,'reports':reports}
(root/'build-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
