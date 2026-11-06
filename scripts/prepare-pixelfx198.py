"""Pack selected licensed effects into bounded, shared sprite sheets, offline."""
from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/visual/pixelfx'
manifest=json.loads((out/'source-manifest.json').read_text())
assets={}
for item in manifest['effects']:
    name=item['name'];meta=json.loads((out/(name+'-source.json')).read_text())
    source=Image.open(out/(name+'-source.png')).convert('RGBA')
    w,h=item['frameWidth'],item['frameHeight'];scale=min(1,160/max(w,h))
    tw,th=round(w*scale),round(h*scale)
    sheet=Image.new('RGBA',(tw*4,th*4))
    for i,f in enumerate(meta['frames']):
        r=f['frame'];tile=source.crop((r['x'],r['y'],r['x']+w,r['y']+h))
        sheet.paste(tile.resize((tw,th),Image.Resampling.LANCZOS),(i%4*tw,i//4*th))
    file=out/(name+'.png');sheet.save(file,optimize=True)
    assets[name]={'width':tw,'height':th,'origin':[item['origin'][0]/w,item['origin'][1]/h],'frames':16,'duration':item['duration'],'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
    # Production intermediates are private; only the game-ready sheet is public.
    private=root/'.local/pixelfx198-input';private.mkdir(parents=True,exist_ok=True)
    for suffix in ['-source.png','-source.json']:(out/(name+suffix)).replace(private/(name+suffix))
(out/'manifest.json').write_text(json.dumps(assets,indent=2)+'\n',encoding='utf-8')
(root/'src/visual/pixelfx198.json').write_text(json.dumps(assets,separators=(',',':'))+'\n')
print('PixelFX:',len(assets),'sheets',sum(x['bytes'] for x in assets.values()),'bytes')
