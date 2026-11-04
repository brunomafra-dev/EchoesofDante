"""Download pinned, hash-verified art source inputs (not game executable code)."""
import json,hashlib,urllib.request
from pathlib import Path
manifest=json.loads(Path('scripts/asset-tools/arrival187-sources.json').read_text())
for record in manifest['files']:
 path=Path('.local/creature187',record['path']);path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest()!=record['sha256']:
  host='raw.githubusercontent.com' if record['path'].endswith('.txt')else'media.githubusercontent.com/media'
  url=f"https://{host}/{manifest['repository']}/{manifest['revision']}/{record['path']}"
  data=urllib.request.urlopen(url,timeout=90).read();assert hashlib.sha256(data).hexdigest()==record['sha256'],record['path'];path.write_bytes(data)
 assert path.stat().st_size==record['bytes']
 print('Verified',record['path'])
