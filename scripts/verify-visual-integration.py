import hashlib
import json
import re
import struct
import subprocess
from pathlib import Path

root = Path('docs/visual-integration')
for name in ['before', 'after', 'lab', 'ice-regression', 'frost-controls', 'coop-dev', 'compiled']:
    assert (root / 'qa' / name / 'report.json').exists(), name
reports = list((root / 'qa').rglob('report.json'))
for file in reports:
    data = json.loads(file.read_text(encoding='utf-8'))
    assert data.get('passed') is True, (str(file), data.get('failure'))
    assert not data['errors'], (str(file), data['errors'])
links = 0
for file in [root / 'README.md', root / 'art.md']:
    for target in re.findall(r'\]\(([^)]+)\)', file.read_text(encoding='utf-8')):
        if '://' in target or target.startswith(('#', 'C:')):
            continue
        if file == root / 'README.md' and target == 'qa/verification.json':
            links += 1  # This script writes its own evidence only after passing.
            continue
        assert (file.parent / target.split('#')[0]).exists(), (str(file), target)
        links += 1
before = json.loads((root / 'qa/before/report.json').read_text(encoding='utf-8'))
after = json.loads((root / 'qa/after/report.json').read_text(encoding='utf-8'))
geometry = []
for a, b in zip(before['scenes'], after['scenes']):
    assert a['name'] == b['name']
    # Existing walking workers have radius 14 and a time-dependent center.
    # Preserve/count them separately; all other colliders must match exactly.
    static_a = [o for o in a['solids'] if o['radius'] != 14]
    static_b = [o for o in b['solids'] if o['radius'] != 14]
    assert static_a == static_b, a['name']
    assert len(a['solids']) == len(b['solids']), a['name']
    geometry.append({'stop': a['name'], 'staticCollidersUnchanged': True,
                     'total': len(a['solids']), 'walkingWorkers': len(a['solids']) - len(static_a)})
png = (Path('public/assets/boreal-details/melt-pocket-v2.png')).read_bytes()
width, height, bits, color = struct.unpack('>IIBB', png[16:26])
assert (width, height, bits, color) == (1254, 1254, 8, 6), 'RGBA PNG required'
base = '8749631281ac4804821509049649e816c740a80a'
entries = subprocess.check_output(['git', 'ls-tree', '-r', base, '--',
    'public/assets/visual/route-identity', 'public/assets/visual/world-finish',
    'src/config/routeIdentity.ts', 'src/config/regional-expeditions.json'], text=True)
preserved = []
for line in entries.splitlines():
    metadata, name = line.split('\t')
    content = Path(name).read_bytes()
    if Path(name).suffix in ['.ts', '.json']:
        content = content.replace(b'\r\n', b'\n')  # Git canonical text on Windows.
    digest = hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()
    assert digest == metadata.split()[2], name
    preserved.append(name)
pkg = json.loads(Path('package.json').read_text(encoding='utf-8'))
lock = json.loads(Path('package-lock.json').read_text(encoding='utf-8'))
assert pkg['version'] == lock['version'] == lock['packages']['']['version'] == '0.1.181'
assert 'visual-review=1&amp;v=0.1.181' in Path('test-library.html').read_text(encoding='utf-8')
result = {'passed': True, 'passingReports': len(reports), 'localLinks': links,
          'baseline': base, 'canonicalGitText': True, 'preservedFiles': preserved, 'geometry': geometry,
          'newArt': {'width': width, 'height': height, 'rgba': True,
                     'sha256': hashlib.sha256(png).hexdigest()}}
(root / 'qa/verification.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(f'Passed: {len(reports)} reports, {links} links, {len(preserved)} unchanged terrain/config files, eight collider snapshots and RGBA art')
