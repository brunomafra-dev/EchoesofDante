"""Technical atlas preparation only: uniform resize, registration and WebP export.
All creature painting is generated offline with the built-in imagegen tool.
One common scale per species; never stretch limbs or rescale individual poses.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/creature-finish'
OUT = ROOT / 'public/assets/visual/creature-finish'
OUT.mkdir(parents=True, exist_ok=True)
specs = json.loads((DOC / 'art-prompts.json').read_text(encoding='utf-8'))
sources = {s['id']: Path(s['path']) for s in json.loads((DOC / 'sources.json').read_text(encoding='utf-8'))}
report = []
overview = Image.new('RGB', (1200, 4 * 250), '#243536')
draw = ImageDraw.Draw(overview)

def box(im):
    return im.getchannel('A').point(lambda a: 255 if a > 96 else 0).getbbox()

for index, s in enumerate(specs):
    im = Image.open(sources[s['id']]).convert('RGBA')
    cell, cols = s['cell'], s['columns']
    frames = []
    for i in range(cols * 2):
        x, y = i % cols, i // cols
        frame = im.crop((round(x * im.width / cols), round(y * im.height / 2), round((x+1) * im.width / cols), round((y+1) * im.height / 2)))
        b = box(frame)
        assert b, s['id']
        # Retain edge antialiasing around the measured solid figure.
        b = (max(0,b[0]-3),max(0,b[1]-3),min(frame.width,b[2]+3),min(frame.height,b[3]+3))
        frames.append(frame.crop(b))
    original = Image.open(ROOT / s['source']).convert('RGBA').crop((0,0,cell,cell))
    b = box(original)
    baseline = round(cell * (.78 if s['id']=='warden' else .90 if s['id']=='soterrado' else 241/256))
    desired_w = min(cell*.89, b[2]-b[0])
    desired_h = min(baseline-cell*.06, b[3]-b[1])
    scale = min(desired_w/frames[0].width, desired_h/frames[0].height,
                (cell*.94)/max(f.width for f in frames), (baseline-cell*.035)/max(f.height for f in frames))
    atlas = Image.new('RGBA',(cols*cell,2*cell))
    bounds=[]
    for i, f in enumerate(frames):
        f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.LANCZOS)
        # Every complete pose shares scale and ground baseline. No runtime cutouts.
        x=(cell-f.width)//2; y=baseline-f.height
        atlas.alpha_composite(f,(i%cols*cell+x,i//cols*cell+y))
        bounds.append([x,y,x+f.width,baseline])
    path=OUT/(s['id']+'-v1.webp')
    atlas.save(path,'WEBP',quality=93,method=6)
    report.append({'id':s['id'],'texture':s['texture'],'file':path.relative_to(ROOT).as_posix(),'width':atlas.width,'height':atlas.height,'frames':cols*2,'cell':cell,'bytes':path.stat().st_size,'rgbaBytes':atlas.width*atlas.height*4,'commonScale':scale,'groundPixel':baseline,'bounds':bounds,'generatedSource':sources[s['id']].name})
    new=atlas.crop((0,0,cell,cell));old=original.copy()
    for j, tile in enumerate([old,new]):
        tile.thumbnail((115,215));px=(index%5)*240+j*120;py=(index//5)*250
        overview.paste(tile,(px+(115-tile.width)//2,py+215-tile.height),tile)
    draw.text(((index%5)*240,(index//5)*250+220),s['name'],fill='#ecd9b3')
    print(s['id'],atlas.size,path.stat().st_size)
(DOC/'assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
overview.save(DOC/'comparison.jpg',quality=92)
print('Total bytes',sum(s['bytes'] for s in report),'RGBA MiB',sum(s['rgbaBytes'] for s in report)/1024**2)
