"""Prepare whole-figure atlases. No limb segmentation, rigging or generated poses."""
import hashlib
import json
from pathlib import Path
from PIL import Image
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/complete-actors'
OUT = ROOT / 'public/assets/visual/complete-actors'
SIZE = 192
ROWS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
manifest = {}
def row_bounds(source, count=8):
    alpha=np.array(source)[:,:,3]
    # Registration of complete figures; tolerate the uneven gutters in the artwork.
    projection=(alpha[:,:round(source.width*.74)]>40).sum(axis=1).astype(float)
    end=source.height if count==8 else int(np.where(projection>20)[0][-1])+1
    smooth=np.convolve(projection,np.ones(5)/5,mode='same')
    result=[0]
    for i in range(1,count):
        guess=end*i/count; radius=end/count*.38
        lo,hi=round(guess-radius),round(guess+radius)
        result.append(lo+int(np.argmin(smooth[lo:hi])))
    return result+[min(end,source.height)]

def main_figure(whole):
    pixels=np.array(whole)
    n,labels,stats,_=cv2.connectedComponentsWithStats((pixels[:,:,3]>16).astype('uint8'),8)
    assert n>1
    keep=int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))+1
    # Remove isolated fragments from the neighboring cell, never assemble anatomy.
    mask=(labels==keep).astype('uint8')
    mask=cv2.dilate(mask,np.ones((5,5),np.uint8))
    pixels[:,:,3]=np.where(mask,pixels[:,:,3],0)
    return Image.fromarray(pixels)
for cls in ['warrior', 'hunter', 'astral', 'xenobinder']:
    for sex in ['male', 'female']:
        actor = f'{cls}-{sex}'
        styles = {}
        for style in ['none', 'basic', 'reinforced']:
            path = DOC / 'source' / f'{actor}-{style}.png'
            if not path.exists():
                continue
            source = Image.open(path).convert('RGBA')
            assert abs(source.height/source.width-2) < .01, (path.name, source.size)
            assert source.getchannel('A').getextrema() == (0, 255), path.name
            atlas = Image.new('RGBA', (4*SIZE, 8*SIZE))
            # Find the complete body inside each column before cutting gutters.
            # Adjacent poses occasionally have unequal heights in generated art.
            alpha=np.array(source)[:,:,3]
            solid=cv2.erode((alpha>40).astype('uint8'),np.ones((3,3),np.uint8),iterations=2)
            _,_,components,centers=cv2.connectedComponentsWithStats(solid,8)
            count=7 if actor=='hunter-female' and style!='none' else 8
            ys=row_bounds(source,count)
            if actor=='warrior-female' and style=='none':ys=[0,224,439,664,890,1126,1362,1580,source.height]
            frames = []
            for row in range(8):
                for col in range(4):
                    art=source
                    if actor in ['hunter-female','warrior-female','warrior-male'] and row==7:
                        art=Image.open(DOC/'source'/f'{actor}-sw-correction.png').convert('RGBA')
                        correction_row=['none','basic','reinforced'].index(style)
                        by=row_bounds(art,3)
                        box=(round(col*art.width/4),by[correction_row],round((col+1)*art.width/4),by[correction_row+1])
                    else:
                        box=(round(col*source.width/4),ys[row],round((col+1)*source.width/4),ys[row+1])
                        candidates=[i for i in range(1,len(components))
                                    if components[i,4]>500 and source.height/8*.6<components[i,3]<source.height/8*1.4
                                    and box[0]<centers[i,0]<box[2] and box[1]<centers[i,1]<box[3]]
                        if candidates:
                            i=max(candidates,key=lambda i:components[i,4])
                            box=(box[0],max(0,int(components[i,1])-4),box[2],min(source.height,int(components[i,1]+components[i,3])+4))
                    whole = main_figure(art.crop(box))
                    if actor in ['hunter-female','warrior-female','warrior-male'] and row==7: whole=whole.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    bbox = whole.getchannel('A').getbbox()
                    assert bbox and bbox[3]-bbox[1] > whole.height*.5, (path.name,row,col,bbox)
                    scale = min(164/(bbox[3]-bbox[1]),174/(bbox[2]-bbox[0]))
                    cropped=whole.crop(bbox)
                    width,height=round(cropped.width*scale),round(cropped.height*scale)
                    bottom=np.array(cropped)[:,:,3][-max(4,round(cropped.height*.08)):]
                    _,footxs=np.where(bottom>40)
                    footx=float(np.mean(footxs)) if len(footxs) else cropped.width/2
                    left=max(3,min(SIZE-width-3,round(SIZE/2-footx*scale)))
                    top=183-height
                    frame = Image.new('RGBA',(SIZE,SIZE))
                    frame.alpha_composite(cropped.resize((width,height),Image.Resampling.LANCZOS),(left,top))
                    atlas.alpha_composite(frame,(col*SIZE,row*SIZE))
                    frames.append({'index':row*4+col,'direction':ROWS[row],'action':col,
                                   'sourceBox':list(box),'sourceTop':top,'feetY':183,
                                   'correction':f'{actor}-sw-correction.png' if actor in ['hunter-female','warrior-female','warrior-male'] and row==7 else None})
            target = OUT / f'{actor}-{style}.png'
            atlas.save(target,optimize=True)
            styles[style]={'file':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),
                           'source':path.relative_to(ROOT).as_posix(),'sourceWidth':source.width,'sourceHeight':source.height,
                           'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'frames':frames}
        if styles:
            manifest[actor]={'classId':cls,'sex':sex,'frameSize':SIZE,'width':4*SIZE,'height':8*SIZE,
                             'feetY':183,'sourceType':'Whole human paintings, image_gen.imagegen','styles':styles}
assert len(manifest)==8 and sum(len(a['styles']) for a in manifest.values())==24, 'Missing production artwork'
(OUT / 'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(DOC / 'assets.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'actors':len(manifest),'atlases':sum(len(a['styles']) for a in manifest.values()),
                  'missing':[f'{c}-{s}-{t}' for c in ['warrior','hunter','astral','xenobinder'] for s in ['male','female'] for t in ['none','basic','reinforced'] if t not in manifest.get(f'{c}-{s}',{}).get('styles',{})]}))
