import hashlib,json,re,sys,subprocess
from pathlib import Path
root=Path('docs/frontier-3d/qa/0.1.184');root.mkdir(parents=True,exist_ok=True)
baseline=json.loads(Path('.local/outpost-build-0.1.181.json').read_text(encoding='utf-8'))
unchanged=[]
for path,digest in baseline['assets'].items():
 data=Path('dist'+path).read_bytes()
 assert hashlib.sha256(data).hexdigest()==digest,path
 unchanged.append(path)
new=Path('dist/frontier-3d.html').read_text(encoding='utf-8')
assert 'phaser-' not in new and 'campaignPlaytest-' not in new
files=re.findall(r'(?:src|href)="(/assets/[^"?]+\.(?:js|css))"',new)
files+=['/frontier-3d.html','/test-library.html']
files+=['/'+str(p.relative_to('dist')).replace('\\','/') for p in Path('dist/assets/frontier-3d').glob('*') if p.is_file()]
def digest(f):
 data=Path('dist'+f).read_bytes()
 if Path(f).suffix in ['.html','.json','.md','.txt']:data=data.replace(b'\r\n',b'\n')
 return hashlib.sha256(data).hexdigest()
manifest={'version':'0.1.184','htmlEntries':['/frontier-3d.html','/test-library.html'],'hashes':{f:digest(f) for f in files},'textCanonicalLF':['.html','.json','.md','.txt'],'unchangedCampaignHashes':len(unchanged)}
Path('.local/frontier-build-0.1.184.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
for file in Path('public/assets/frontier-3d').glob('*.json'):
 data=json.loads(file.read_text(encoding='utf-8'))
 for record in data if isinstance(data,list) else data['files']:
  actual=Path('public/assets/frontier-3d',record['file']).read_bytes()
  assert hashlib.sha256(actual).hexdigest()==record['sha256'],record['file']
pkg=json.loads(Path('package.json').read_text());lock=json.loads(Path('package-lock.json').read_text())
assert pkg['version']==lock['version']==lock['packages']['']['version']=='0.1.184'
assert 'frontier-3d.html?v=0.1.184' in Path('test-library.html').read_text(encoding='utf-8')
changed=subprocess.check_output(['git','diff','--name-only','7bbae56'],text=True).splitlines()
assert not any(p.startswith(('src/scenes/','src/systems/','src/network/','server/')) for p in changed)
reports=[]
for path in root.rglob('report.json'):
 data=json.loads(path.read_text(encoding='utf-8'));assert data.get('passed') and not data.get('errors'),str(path);reports.append(str(path))
result={'passed':True,'campaignBaseline':'7bbae56c72ffa08281feb7f02db4d1deeb238393','unchangedCampaignHashes':len(unchanged),'newPublishedHashCount':len(manifest['hashes']),'referenceAssetsVerified':True,'reports':reports,'campaignSourceAndRelayChanged':False}
(root/'build-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print('Passed:',len(unchanged),'unchanged published campaign assets;',len(files),'frontier publication hashes;',len(reports),'passing QA reports')
