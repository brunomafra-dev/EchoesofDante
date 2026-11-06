"""Small runtime copies of the game's original complete boss paintings."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parent.parent
out=root/'public/assets/visual/companions';out.mkdir(parents=True,exist_ok=True)
records=[]
for species,boss,frame in [('bulwark','warden',512),('frostling','vesper',256)]:
 source=root/f'public/assets/visual/creature-finish/{boss}-v1.webp'
 image=Image.open(source).convert('RGBA').resize((768,384),Image.Resampling.LANCZOS)
 target=out/f'{species}-v1.webp';image.save(target,lossless=True,method=6)
 records.append({'species':species,'source':source.relative_to(root).as_posix(),'file':target.name,'frame':192,'frames':8,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'changes':'Uniform downsample of eight complete painted poses. No assembled limbs or borrowed franchise assets.'})
(out/'CREDITS.md').write_text('# Companions 0.1.199\n\nOriginal Echoes of Dante Warden and Vesper complete paintings, uniformly downsampled for the Broto Guardiao and Filhote de Vesper companions. Existing source paintings retained; no third-party game assets.\n',encoding='utf-8')
(out/'manifest.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
print([(a['species'],a['bytes'])for a in records])
