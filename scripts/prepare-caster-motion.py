"""Register imagegen-authored complete leg poses offline; retain original faces/torso.
No leg strip cutting/shifting, no generated art in the gameplay loop.
"""
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/caster-motion-audit/source-art'
OUT=ROOT/'public/assets/visual/characters'
SOURCE.mkdir(parents=True,exist_ok=True)
report=[]
def isolate(frame):
    mask=frame.getchannel('A').point(lambda a:255 if a>35 else 0);pixels=mask.load();seen=set();largest=[]
    for y in range(frame.height):
        for x in range(frame.width):
            if not pixels[x,y] or (x,y) in seen:continue
            stack=[(x,y)];seen.add((x,y));group=[]
            while stack:
                a,b=stack.pop();group.append((a,b))
                for nx,ny in ((a-1,b),(a+1,b),(a,b-1),(a,b+1)):
                    if 0<=nx<frame.width and 0<=ny<frame.height and pixels[nx,ny] and (nx,ny) not in seen:seen.add((nx,ny));stack.append((nx,ny))
            if len(group)>len(largest):largest=group
    keep=Image.new('L',frame.size);kp=keep.load()
    for x,y in largest:kp[x,y]=255
    keep=keep.filter(ImageFilter.MaxFilter(5));frame.putalpha(ImageChops.multiply(frame.getchannel('A'),keep))
    box=frame.getchannel('A').point(lambda a:255 if a>35 else 0).getbbox()
    if not box:raise ValueError('Missing leg pose')
    return frame.crop(box)
def cell(sheet,col,row,columns):
    return isolate(sheet.crop((round(col*sheet.width/columns),round(row*sheet.height/3),round((col+1)*sheet.width/columns),round((row+1)*sheet.height/3))))
def midpoint(im,ys):
    spans=[]
    for y in ys:
        xs=[x for x in range(im.width) if im.getpixel((x,y))[3]>145]
        if xs:spans.append((min(xs)+max(xs))/2)
    return sorted(spans)[len(spans)//2] if spans else im.width/2
def sockets(im):
    band=[]
    for y in range(70,92):
        xs=[x for x in range(55,201) if im.getpixel((x,y))[3]>145]
        if xs:band.append((max(xs)-min(xs),y,min(xs),max(xs)))
    _,y,left,right=max(band)
    return {'left':{'x':left+7,'y':y},'right':{'x':right-7,'y':y}}
for cls in ['astral','xenobinder']:
    directions=Image.open(SOURCE/f'{cls}-directions.png').convert('RGBA')
    assert directions.getchannel('A').getextrema()[0]==0
    registration={'byStyle':{}}
    for sex in ['male','female']:
        front=Image.open(SOURCE/f'{cls}-{sex}-front.png').convert('RGBA')
        assert front.getchannel('A').getextrema()[0]==0
        styles={}
        for tier,style in enumerate(['none','basic','reinforced']):
            target=OUT/f'wardrobe-{cls}-{sex}-{style}.png'
            basefile=SOURCE/f'base-{cls}-{sex}-{style}.png'
            if not basefile.exists():
                old=Image.open(target).convert('RGBA');columns=old.width//256;base=Image.new('RGBA',(256,768))
                for row in range(3):base.alpha_composite(old.crop((0,row*256,256,(row+1)*256)),(0,row*256))
                base.save(basefile,optimize=True)
            base=Image.open(basefile).convert('RGBA');atlas=Image.new('RGBA',(1280,768));points=[]
            for row in range(3):
                idle=base.crop((0,row*256,256,(row+1)*256));atlas.alpha_composite(idle,(0,row*256));points.append(sockets(idle))
                if row==0:
                    # Two authored contact/passing poses with mirrored counterpart.
                    # The upper identity never mirrors; technical legwear is shared.
                    left=[cell(front,0,tier,4),cell(front,1,tier,4)]
                    poses=left+[p.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for p in left]
                elif row==1:
                    left=[cell(directions,0,tier,8),cell(directions,1,tier,8)]
                    poses=left+[p.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for p in left]
                else:poses=[cell(directions,col,tier,8) for col in range(4,8)]
                waist=midpoint(idle,range(124,133))
                for i,pose in enumerate(poses):
                    factor=124/pose.height;pose=pose.resize((round(pose.width*factor),124),Image.Resampling.LANCZOS)
                    center=midpoint(pose,range(3,16));body=Image.new('RGBA',(256,256))
                    body.alpha_composite(pose,(round(waist-center),120))
                    # Original complete head/torso, including its real shoulder caps.
                    # Clear transparent upper pixels too: a walking belt must not
                    # bleed behind the standing torso's edges.
                    body.paste((0,0,0,0),(0,0,256,132))
                    body.alpha_composite(idle.crop((0,0,256,132)),(0,0))
                    atlas.alpha_composite(body,((i+1)*256,row*256));points.append(sockets(body))
            atlas.save(target,optimize=True);styles[style]=points
            report.append({'asset':str(target.relative_to(ROOT)),'dimensions':list(atlas.size),'frames':15,'feet':244,'bytes':target.stat().st_size})
        registration[sex]=styles['none'];registration['byStyle'][sex]=styles
    (OUT/f'{cls}-shoulders.json').write_text(json.dumps(registration,indent=2)+'\n',encoding='utf-8')
(SOURCE.parent/'assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
# Separate class-specific sleeves, forearms and hands; pack/register offline.
arm_registration={}
for tier in ['none','basic','reinforced']:
    sheet=Image.open(SOURCE/f'arms-{tier}.png').convert('RGBA')
    assert sheet.getchannel('A').getextrema()[0]==0
    for cls,start in [('astral',0),('xenobinder',2)]:
        key=f'{cls}-arm-{tier}';atlas=Image.new('RGBA',(384,256));parts=[]
        for row in range(2):
            for col in range(3):
                piece=isolate(sheet.crop((round(col*sheet.width/3),round((start+row)*sheet.height/4),round((col+1)*sheet.width/3),round((start+row+1)*sheet.height/4))))
                k=min(120/piece.width,110/piece.height)
                piece=piece.resize((round(piece.width*k),round(piece.height*k)),Image.Resampling.LANCZOS)
                x=col*128+(128-piece.width)//2;y=row*128+(128-piece.height)//2
                atlas.alpha_composite(piece,(x,y))
                parts.append({'x':x,'y':y,'width':piece.width,'height':piece.height})
        target=OUT/f'{key}.png';atlas.save(target,optimize=True);arm_registration[key]=parts
        report.append({'asset':str(target.relative_to(ROOT)),'dimensions':list(atlas.size),'frames':6,'bytes':target.stat().st_size})
(OUT/'caster-arm-registration.json').write_text(json.dumps(arm_registration,indent=2)+'\n',encoding='utf-8')
(SOURCE.parent/'assets.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
