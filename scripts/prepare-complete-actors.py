"""Prepare whole-figure atlases. No limb segmentation, rigging or generated poses."""
import hashlib
import json
from pathlib import Path
from PIL import Image
import cv2
import numpy as np
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/complete-actors'
OUT = ROOT / 'public/assets/visual/complete-actors'
REV = DOC / 'revision-02'
SIZE = 192
ROWS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW']
manifest = {}

@lru_cache(maxsize=32)
def source_image(path):
    return Image.open(path).convert('RGBA')

def column_bounds(source,count):
    # Generated sheets have uneven outer margins. Equal thirds cut wrists.
    alpha=np.array(source)[:,:,3]
    weights=(alpha>128).sum(axis=0).astype(float);xs=np.arange(source.width)
    centers=np.interp((np.arange(count)+.5)/count,np.cumsum(weights)/weights.sum(),xs)
    for _ in range(40):
        labels=np.abs(xs[:,None]-centers).argmin(axis=1)
        updated=np.array([np.average(xs[labels==i],weights=weights[labels==i]) for i in range(count)])
        if np.max(np.abs(updated-centers))<.01:break
        centers=updated
    centers.sort()
    return [0]+[round((a+b)/2) for a,b in zip(centers[:-1],centers[1:])]+[source.width]
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

def main_figure(whole,strict=False):
    pixels=np.array(whole)
    n,labels,stats,_=cv2.connectedComponentsWithStats((pixels[:,:,3]>16).astype('uint8'),8)
    assert n>1
    keep=int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))+1
    # Remove isolated fragments from the neighboring cell, never assemble anatomy.
    mask=(labels==keep).astype('uint8')
    mask=cv2.dilate(mask,np.ones((5,5),np.uint8))
    if strict:mask=((labels==keep)|((pixels[:,:,3]<=16)&(mask>0))).astype('uint8')
    pixels[:,:,3]=np.where(mask,pixels[:,:,3],0)
    return Image.fromarray(pixels)

def contact_pose(actor,style,row,side):
    """Extract a COMPLETE authored support pose, never a leg/arm fragment."""
    path=REV/'source'/f'{actor}-{side}-contact.png'
    count=7 if (side=='right' and actor in ['hunter-female','warrior-female']) or (side=='left' and actor.startswith('warrior')) else 8
    source_row=row if count==8 or row<4 else row-1
    corrections={('hunter-female',4):0,('warrior-male',7):2}
    if side=='right' and (actor,row) in corrections:
        path=REV/'source'/'contact-corrections.png'
        count=3;source_row=corrections[actor,row]
    if row==4 and (side=='left' and actor.startswith('warrior') or side=='right' and actor=='warrior-female'):
        path=REV/'source'/'rear-contacts.png';count=3
        source_row=0 if actor=='warrior-male' else 1 if side=='left' else 2
    if side=='right' and actor=='hunter-male' and row==4:
        path=REV/'source'/'hunter-male-rear-right.png';count=1;source_row=0
    mirrored=False
    if side=='right' and actor=='warrior-female':
        path=DOC/'revision-05'/'source'/('warrior-female-right-front.png' if row<4 else 'warrior-female-right-back.png')
        count=4;source_row=row%4
    if side=='right' and actor.startswith('hunter') and row==7:
        path=DOC/'revision-05'/'source'/'hunter-sw-contact.png';count=2
        source_row=0 if actor=='hunter-male' else 1;mirrored=True
    if side=='right' and actor=='hunter-male' and row==6:
        path=REV/'source'/'hunter-male-left-contact.png';count=8;source_row=2;mirrored=True
    art=source_image(path)
    assert art.getchannel('A').getextrema()[0]==0, path.name
    by=row_bounds(art,count)
    if path.name=='hunter-sw-contact.png':by=[0,512,1024]
    if path.name=='hunter-male-right-contact.png':by=[0,212,410,596,788,986,1176,1354,1536]
    if path.name.startswith('warrior-female-right-') and count==4:by=[0,432,800,1152,1536] if 'front' in path.name else [0,392,768,1140,1536]
    col=['none','basic','reinforced'].index(style)
    bx=column_bounds(art,3)
    box=(max(0,bx[col]-8),by[source_row],min(art.width,bx[col+1]+8),by[source_row+1])
    whole=main_figure(art.crop(box),True);bbox=whole.getchannel('A').getbbox()
    if mirrored:
        whole=whole.transpose(Image.Transpose.FLIP_LEFT_RIGHT);bbox=whole.getchannel('A').getbbox()
    assert bbox and bbox[3]-bbox[1]>whole.height*.5,(path.name,row,col,bbox)
    return whole,bbox,box,mirrored,path
for cls in ['warrior', 'hunter', 'astral', 'xenobinder']:
    for sex in ['male', 'female']:
        actor = f'{cls}-{sex}'
        styles = {}
        for style in ['none', 'basic', 'reinforced']:
            original = DOC / 'source' / f'{actor}-{style}.png'
            revision = REV / 'source' / f'{actor}-{style}.png'
            path = revision if revision.exists() else original
            revised_source = path==revision
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
            count=7 if actor=='hunter-female' and style!='none' and not revised_source else 8
            ys=row_bounds(source,count)
            if actor=='warrior-female' and style=='none':ys=[0,224,439,664,890,1126,1362,1580,source.height]
            frames = []
            row_figures=[]
            for row in range(8):
                figures=[]
                for col in range(4):
                    if cls in ['warrior','hunter'] and col in [1,2]:
                        figures.append(contact_pose(actor,style,row,'left' if col==1 else 'right'))
                        continue
                    art=source
                    corrected=actor in ['hunter-female','warrior-female','warrior-male'] and row==7 and not revised_source
                    if corrected:
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
                    whole = main_figure(art.crop(box),cls in ['warrior','hunter'])
                    if corrected: whole=whole.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    bbox = whole.getchannel('A').getbbox()
                    assert bbox and bbox[3]-bbox[1] > whole.height*.5, (path.name,row,col,bbox)
                    actual_source=DOC/'source'/f'{actor}-sw-correction.png' if corrected else path
                    figures.append((whole,bbox,box,corrected,actual_source))
                row_figures.append(figures)

            for row,figures in enumerate(row_figures):
                # The support foot is not the torso's origin. Register the WHOLE
                # locomotion paintings to one head axis. Each independently
                # authored painting is calibrated uniformly as a WHOLE figure
                # to the standing height; no part is stretched or assembled.
                stable=cls in ['warrior','hunter']
                headxs=[]
                if stable:
                    for whole,bbox,_,_,_ in figures[:3]:
                        a=np.array(whole)[:,:,3]
                        top,bottom=bbox[1],bbox[1]+max(3,round((bbox[3]-bbox[1])*.20))
                        _,xs=np.where(a[top:bottom]>40)
                        headxs.append(float(np.mean(xs)))
                    scales=[164/(f[1][3]-f[1][1]) for f in figures[:3]]
                    left_extent=max((headxs[i]-figures[i][1][0])*scales[i] for i in range(3))
                    right_extent=max((figures[i][1][2]-headxs[i])*scales[i] for i in range(3))
                    if left_extent+right_extent>174:
                        ratio=174/(left_extent+right_extent)
                        scales=[s*ratio for s in scales];left_extent*=ratio;right_extent*=ratio
                    head_target=max(3+left_extent,min(96,189-right_extent))
                for col,(whole,bbox,box,corrected,frame_source) in enumerate(figures):
                    scale = min(164/(bbox[3]-bbox[1]),174/(bbox[2]-bbox[0]))
                    if stable and col<3:scale=scales[col]
                    cropped=whole.crop(bbox)
                    width,height=round(cropped.width*scale),round(cropped.height*scale)
                    bottom=np.array(cropped)[:,:,3][-max(4,round(cropped.height*.08)):]
                    _,footxs=np.where(bottom>40)
                    footx=float(np.mean(footxs)) if len(footxs) else cropped.width/2
                    left=max(3,min(SIZE-width-3,round(SIZE/2-footx*scale)))
                    top=183-height
                    if stable and col<3:
                        left=round(head_target-(headxs[col]-bbox[0])*scale)
                        top=183-height
                        assert top+height<=SIZE and left>=0 and left+width<=SIZE,(path.name,row,col,left,top,width,height)
                    frame = Image.new('RGBA',(SIZE,SIZE))
                    frame.alpha_composite(cropped.resize((width,height),Image.Resampling.LANCZOS),(left,top))
                    atlas.alpha_composite(frame,(col*SIZE,row*SIZE))
                    info={'index':row*4+col,'direction':ROWS[row],'action':col,
                                   'sourceBox':list(box),'sourceTop':top,'feetY':183,
                                   'correction':f'{actor}-sw-correction.png' if corrected else None}
                    if stable:info.update({'sourceFile':frame_source.relative_to(ROOT).as_posix(),
                                           'registration':'head-axis/uniform-whole-figure' if col<3 else 'feet',
                                           'scale':scale,'left':left,'top':top,
                                           'headX':round(left+(headxs[col]-bbox[0])*scale,3) if col<3 else None,
                                           'neckY':round(183-128*height/164,3) if col<3 else None,
                                           'importHeight':height,'mirrored':corrected,
                                           'cropMargins':[bbox[0],bbox[1],whole.width-bbox[2],whole.height-bbox[3]]})
                    if stable:
                        ya,xa=np.where(np.array(whole)[:,:,3]>128)
                        info['sourceCoreMargins']=[int(xa.min()),int(ya.min()),int(whole.width-xa.max()-1),int(whole.height-ya.max()-1)]
                    frames.append(info)
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
