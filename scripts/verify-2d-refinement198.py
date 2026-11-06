"""Scoped preservation/build manifest and optional verification of the public build."""
import argparse, hashlib, json, re, subprocess, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--public', action='store_true')
p.add_argument('--out')
args = p.parse_args()
root = Path(__file__).resolve().parent.parent
BASE = 'f6a2b1b9db6ff4ce0de084f36678c3f21961d581'
version = json.loads((root/'package.json').read_text())['version']
assert version == '0.1.198'
manifest_path = root/'.local/refinement-build-0.1.198.json'
text_extensions = {'.html', '.js', '.css', '.md', '.txt', '.json'}
def canonical(path, data):
    if Path(path).suffix in text_extensions:
        data = data.replace(b'\r\n', b'\n')
    # Vercel removes blank-only HTML lines.
    if Path(path).suffix == '.html':
        data = b'\n'.join(line for line in data.splitlines() if line.strip())+b'\n'
        # Vite's Windows/Linux HTML serializers can join a tag-boundary line.
        # Keep all text, tags, attributes and scripts; normalize only that newline.
        data = re.sub(rb'>[ \t]*\n[ \t]*<', b'><', data)
    return data
def digest(path, data): return hashlib.sha256(canonical(path, data)).hexdigest()
if not args.public:
    protected = ['src/experiments/arrival-3d', 'src/experiments/arrival-workshop',
                 'public/assets/arrival-3d', 'src/config/classes.ts',
                 'src/config/missions.ts', 'src/config/equipment.ts',
                 'src/systems/LocalJourney.ts', 'src/systems/Progression.ts',
                 'src/systems/Missions.ts', 'src/systems/Movement.ts',
                 'src/entities/Enemy.ts', 'src/entities/HollowCrawler.ts']
    subprocess.run(['git','diff','--exit-code',BASE,'--',*protected],cwd=root,check=True)
    for file,start,end in [('src/combat/AstralCombat.ts',' get canCharge()', ' render('),
                           ('src/combat/XenobinderCombat.ts',' fire(', ' snapshot(')]:
        old=subprocess.check_output(['git','show',BASE+':'+file],cwd=root).decode()
        new=(root/file).read_text(encoding='utf-8')
        assert old[old.index(start):old.index(end)] == new[new.index(start):new.index(end)], file+' combat changed'
    assets=json.loads((root/'docs/2d-refinement/motion-assets.json').read_text())['assets']
    for item in assets:
        data=(root/item['file']).read_bytes()
        assert hashlib.sha256(data).hexdigest()==item['sha256'],item['file']
    effects=json.loads((root/'src/visual/pixelfx198.json').read_text())
    for name,m in effects.items():
        data=(root/'public/assets/visual/pixelfx'/f'{name}.png').read_bytes()
        assert len(data)==m['bytes'] and hashlib.sha256(data).hexdigest()==m['sha256']
    assert not list((root/'public/assets/visual/pixelfx').glob('*-source.*'))
    old_manifest=json.loads((root/'docs/frontier-3d/qa/0.1.197/publication-hashes.json').read_text())
    files=set((root/'dist').glob('*.html'))|set((root/'dist/assets').glob('*.js'))|set((root/'dist/assets').glob('*.css'))
    for folder in ['complete-actors','customization','pixelfx']:
        files.update(f for f in (root/'dist/assets/visual'/folder).rglob('*') if f.is_file() and (folder!='complete-actors' or f.name.endswith('-motion-v3.png')))
    files.add(root/'dist/assets/experiments/forest-finish/hollow-v3.webp')
    preserved={}
    for path,old_hash in old_manifest['sha256'].items():
        if path.startswith('/assets/arrival-3d/'):
            f=root/'dist'/path.lstrip('/');files.add(f)
            assert digest(path,f.read_bytes())==old_hash,path+' changed'
            preserved[path]=old_hash
    hashes={'/'+f.relative_to(root/'dist').as_posix():digest(str(f),f.read_bytes()) for f in sorted(files)}
    result={'version':version,'passed':True,'baseline':BASE,'hashes':hashes,
            'preserved3DAssets':len(preserved),'motionAssets':len(assets),
            'motionDownloadBytes':sum(a['bytes'] for a in assets),
            'pixelSheets':len(effects),'pixelDownloadBytes':sum(m['bytes'] for m in effects.values()),
            'checks':['Protected world, collision, progression, missions, equipment and 3D sources unchanged.',
                      'Astral and companion combat methods byte-identical after line-ending normalization.',
                      'Prepared motion and effect asset hashes match manifests; no raw PixelFX inputs in public.',
                      'All prior 3D art/model hashes match the 0.1.197 publication manifest.'],
            'textCanonicalLF':sorted(text_extensions),'htmlWhitespaceOnlyLines':True,
            'htmlTagBoundaryNewlines':'Normalized; text, tags, attributes and scripts unchanged.'}
    manifest_path.parent.mkdir(parents=True,exist_ok=True)
    manifest_path.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    target=root/(args.out or 'docs/2d-refinement/qa/build-verification.json')
else:
    source=manifest_path if manifest_path.exists() else root/'docs/2d-refinement/qa/build-verification.json'
    manifest=json.loads(source.read_text())
    base='https://echosofdante.vercel.app'
    def verify(item):
        path,expected=item
        req=urllib.request.Request(base+path,headers={'Cache-Control':'no-cache','User-Agent':'Dante-publication-QA'})
        with urllib.request.urlopen(req,timeout=45) as response: data=response.read()
        assert digest(path,data)==expected,path+' is not the tested build'
        return path
    with ThreadPoolExecutor(max_workers=4) as pool: verified=list(pool.map(verify,manifest['hashes'].items()))
    result={'version':version,'published':True,'at':datetime.now(timezone.utc).isoformat(),
            'base':base,'matchingHashes':len(verified),'verifiedFiles':verified}
    target=root/(args.out or 'docs/2d-refinement/qa/publication-hashes.json')
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(('Published' if args.public else 'Build verified'),len(result.get('hashes',result.get('verifiedFiles',[]))),'hashes')
