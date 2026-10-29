import hashlib
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

version = '0.1.166'
manifest_path = Path('.local/outpost-build-0.1.166.json')
if sys.argv[1] == 'capture':
    files = list(Path('dist/assets').glob('*.js')) + list(Path('dist/assets/settlement-life').glob('*')) + list(Path('dist/assets/colonization').glob('*'))
    manifest = {'version': version, 'html': {name: Path('dist', name).read_text(encoding='utf-8') for name in ['index.html', 'campaign-playtest.html', 'test-library.html']}, 'assets': {('/' + str(p.relative_to('dist')).replace('\\', '/')): hashlib.sha256(p.read_bytes()).hexdigest() for p in files if p.is_file()}}
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print('Captured', version, len(manifest['assets']), 'JavaScript/art hashes')
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
            assert 'permanence=outpost' in remote and version in remote
    def verify(item):
        path, expected = item
        assert hashlib.sha256(get(path)).hexdigest() == expected, path
        return path
    with ThreadPoolExecutor(max_workers=6) as pool:
        verified = list(pool.map(verify, manifest['assets'].items()))
    with urllib.request.urlopen('https://echoes-of-dante-rooms.onrender.com/coop/health', timeout=40) as response:
        relay = json.load(response)
    result = {'version': version, 'verifiedAt': datetime.now(timezone.utc).isoformat(), 'buildPublished': True, 'verifiedFiles': verified, 'sha256': manifest['assets'], 'relay': relay, 'coopCompatible': relay.get('protocol') == 16 and relay.get('outposts') == 1}
    out = Path('docs/outpost/qa/publication')
    out.mkdir(parents=True, exist_ok=True)
    if '--read-only' not in sys.argv:
        (out / 'hashes.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'version': version, 'matchingHashes': len(verified), 'coopCompatible': result['coopCompatible'], 'relay': relay}))
