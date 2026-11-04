import argparse,hashlib,json,urllib.request
parser=argparse.ArgumentParser();parser.add_argument("--version",default="0.1.185");version=parser.parse_args().version
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from pathlib import Path
manifest=json.loads(Path(f'.local/arrival-build-{version}.json').read_text(encoding='utf-8'))
base='https://echosofdante.vercel.app'
def verify(item):
 path,expected=item
 with urllib.request.urlopen(urllib.request.Request(base+path,headers={'Cache-Control':'no-cache','User-Agent':'Dante-publication-QA'}),timeout=40) as response:data=response.read()
 if Path(path).suffix in manifest['textCanonicalLF']:data=data.replace(b'\r\n',b'\n')
 assert hashlib.sha256(data).hexdigest()==expected,path+' not published'
 return path
with ThreadPoolExecutor(max_workers=4) as pool:verified=list(pool.map(verify,manifest['hashes'].items()))
result={'version':version,'at':datetime.now(timezone.utc).isoformat(),'base':base,'published':True,'matchingHashes':len(verified),'verifiedFiles':verified,'sha256':manifest['hashes'],'textCanonicalLF':manifest['textCanonicalLF']}
out=Path(f'docs/frontier-3d/qa/{version}/publication-hashes.json');out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print('Published:',len(verified),'matching JS/CSS/HTML/models/materials/fonts/license hashes')
