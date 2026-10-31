import hashlib
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

versions = [value for value in sys.argv[2:] if not value.startswith('--')]
version = versions[0] if versions else '0.1.166'
manifest_path = Path('.local/outpost-build-' + version + '.json')
if sys.argv[1] == 'capture':
    files = list(Path('dist/assets').glob('*.js')) + list(Path('dist/assets/settlement-life').glob('*')) + list(Path('dist/assets/colonization').glob('*')) + list(Path('dist/assets/mission-identity').glob('*.png')) + list(Path('dist/assets/buried-record').glob('*.png')) + list(Path('dist/assets/frost-water').glob('*.png')) + list(Path('dist/assets/ice-transfer').glob('*.png'))
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
            assert ({'0.1.167': 'outpost-support=1', '0.1.168': 'vitals=1', '0.1.169': 'permanence=signal', '0.1.170': 'permanence=echo', '0.1.171': 'permanence=wind', '0.1.172': 'mission-identity=1', '0.1.173': 'permanence=dunes', '0.1.174': 'permanence=buried', '0.1.175': 'permanence=frost', '0.1.176': 'permanence=icecave'}.get(version, 'permanence=outpost')) in remote and version in remote
    def verify(item):
        path, expected = item
        assert hashlib.sha256(get(path)).hexdigest() == expected, path
        return path
    with ThreadPoolExecutor(max_workers=6) as pool:
        verified = list(pool.map(verify, manifest['assets'].items()))
    try:
        with urllib.request.urlopen('https://echoes-of-dante-rooms.onrender.com/coop/health', timeout=20) as response:
            relay = json.load(response)
    except Exception as error:
        # Frontend publication and relay availability are separate gates.
        relay = {'unavailable': str(error)}
    result = {'version': version, 'verifiedAt': datetime.now(timezone.utc).isoformat(), 'buildPublished': True, 'verifiedFiles': verified, 'sha256': manifest['assets'], 'relay': relay, 'coopCompatible': relay.get('protocol') == 16 and relay.get('outposts') == 1 and (version not in ['0.1.169', '0.1.170', '0.1.171', '0.1.172', '0.1.173', '0.1.174', '0.1.175','0.1.176'] or relay.get('signals') == 1) and (version not in ['0.1.170', '0.1.171', '0.1.172', '0.1.173', '0.1.174', '0.1.175','0.1.176'] or relay.get('circuits') == 1) and (version not in ['0.1.171','0.1.172', '0.1.173', '0.1.174', '0.1.175','0.1.176'] or relay.get('wind') == 1) and (version not in ['0.1.173','0.1.174','0.1.175','0.1.176'] or relay.get('dunes') == 1) and (version not in ['0.1.174','0.1.175','0.1.176'] or relay.get('buried') == 1) and (version not in ['0.1.175','0.1.176'] or relay.get('frost') == 1) and (version != '0.1.176' or relay.get('icecave') == 1)}
    out = Path('docs/outpost/qa/publication') if version == '0.1.166' else Path('docs/outpost/qa/publication', version)
    out.mkdir(parents=True, exist_ok=True)
    if '--read-only' not in sys.argv:
        (out / 'hashes.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'version': version, 'matchingHashes': len(verified), 'coopCompatible': result['coopCompatible'], 'relay': relay}))
