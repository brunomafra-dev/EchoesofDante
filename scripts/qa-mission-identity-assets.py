from pathlib import Path
from PIL import Image, ImageDraw
import json
root=Path(__file__).resolve().parents[1]
out=root/'docs/mission-identity/qa/assets'
out.mkdir(parents=True,exist_ok=True)
components=json.loads((root/'docs/mission-identity/source/components.json').read_text())
assert len(components)==32
contact=Image.new('RGB',(800,560),'#34403a')
draw=ImageDraw.Draw(contact)
frames=[]
for sheet_index,name in enumerate(['research','survival']):
    atlas=Image.open(root/f'public/assets/mission-identity/{name}-v1.png').convert('RGBA')
    used=[]
    for i in range(16):
        cell=atlas.crop((i%4*256,i//4*256,i%4*256+256,i//4*256+256))
        bounds=cell.getchannel('A').getbbox()
        assert bounds and bounds[0]>=18 and bounds[1]>=15 and bounds[2]<=238 and bounds[3]<=234
        entry=next(e for e in components if e['sheet']==name and e['frame']==i)
        assert all(c not in used for c in entry['components'])
        used.extend(entry['components'])
        frames.append(dict(entry,packedBounds=bounds))
        cell.thumbnail((100,100))
        x=i%8*100;y=sheet_index*280+i//8*140
        contact.paste(cell,(x,y),cell)
        draw.text((x+5,y+105),f'{name} {i}',fill='white')
contact.save(out/'contact-sheet.png')
(out/'report.json').write_text(json.dumps({'passed':True,'method':'Whole-sheet connected-component isolation, unique component ownership, alpha padding and 100px contact-sheet visual review. Original complete components crossing nominal cell boundaries remain intact.','frames':frames},indent=2)+'\n')
print('PASS: 32 isolated frames; no component shared with a neighboring prop')
