import hashlib
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

version = sys.argv[2] if len(sys.argv) > 2 else '0.1.155'
manifest_path = Path('.local', 'permanence-build-' + version + '.json')
if sys.argv[1] == 'capture':
    files = [p for p in Path('dist/assets').glob('*.js')]
    report = {'version': version, 'html': {name: Path('dist', name).read_text(encoding='utf-8') for name in ['index.html', 'campaign-playtest.html', 'test-library.html']}, 'assets': {('/' + str(p.relative_to('dist')).replace('\\', '/')): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
    manifest_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print('Captured', version, len(files), 'JavaScript hashes')
else:
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    base = 'https://echosofdante.vercel.app'
    def get(path):
        with urllib.request.urlopen(urllib.request.Request(base + path, headers={'Cache-Control': 'no-cache'}), timeout=40) as response:
            return response.read()
    for name, local in manifest['html'].items():
        remote = get('/' + name).decode('utf-8')
        for asset in re.findall(r'(?:src|href)="(/assets/[^"?]+\.js)"', local):
            assert asset in remote, (name, asset, 'publication is older')
        if name == 'test-library.html':
            assert version in remote
    def verify(item):
        path, expected = item
        assert hashlib.sha256(get(path)).hexdigest() == expected, path
        return path
    with ThreadPoolExecutor(max_workers=6) as pool:
        verified = list(pool.map(verify, manifest['assets'].items()))
    with urllib.request.urlopen('https://echoes-of-dante-rooms.onrender.com/coop/health', timeout=40) as response:
        relay = json.load(response)
    out = Path('docs/permanence/qa/publication', version)
    out.mkdir(parents=True, exist_ok=True)
    result = {'version': version, 'verifiedAt': datetime.now(timezone.utc).isoformat(), 'buildPublished': True, 'matchingJavaScript': verified, 'relay': relay, 'coopCompatible': relay.get('protocol') == 16}
    (out / 'hashes.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, indent=2))
