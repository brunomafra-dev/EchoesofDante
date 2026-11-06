"""Re-use authored complete heads, registered to the common neck, for the editor.
No paid/imported assets or generated faces. Hair choices also change the authored
face; the UI calls them 'Rosto e corte' rather than promising arbitrary hair meshes.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import cv2,numpy as np
import json,hashlib
root=Path(__file__).resolve().parents[1];art=root/'public/assets/visual/complete-actors'
out=root/'public/assets/visual/customization';out.mkdir(parents=True,exist_ok=True)
records=[]
necks={'warrior':68,'astral':57,'hunter':62,'xenobinder':58}
def semantic_masks(tile,neck,direction):
    rgba=np.array(tile);rgb=rgba[:,:,:3];alpha=rgba[:,:,3]>40
    y,x=np.mgrid[:80,:80];light=rgb.astype(float).mean(2)
    labels=np.full((80,80),cv2.GC_PR_BGD,np.uint8);labels[~alpha]=cv2.GC_BGD
    back=direction in [3,4,5]
    labels[alpha&((y<neck-25)|((light<90)&(y<neck-7)))]=cv2.GC_PR_FGD
    labels[alpha&(y<neck-30)]=cv2.GC_FGD
    if back:labels[alpha&(y<neck-9)]=cv2.GC_FGD
    else:
        cx=40+(7 if direction in [1,2] else -7 if direction in [6,7] else 0)
        labels[alpha&(abs(x-cx)<8)&(y>neck-20)&(y<neck-5)]=cv2.GC_BGD
    cv2.setRNGSeed(198)
    cv2.grabCut(rgb,labels,None,np.zeros((1,65)),np.zeros((1,65)),4,cv2.GC_INIT_WITH_MASK)
    hair=alpha&np.isin(labels,[cv2.GC_FGD,cv2.GC_PR_FGD])
    r,g,b=[rgb[:,:,i].astype(float)for i in range(3)]
    skin=alpha&~hair&(r>g*1.06)&(g>b*1.04)&(r-b>16)&(y>neck-31)
    mask=np.zeros_like(rgba);mask[:,:,0]=hair*255;mask[:,:,1]=skin*255;mask[:,:,3]=rgba[:,:,3]
    return Image.fromarray(mask)
for sex in ['male','female']:
    for destination,neck in necks.items():
        sheet=Image.new('RGBA',(8*80,4*80));masks=Image.new('RGBA',sheet.size)
        styles=[(destination,'basic' if destination=='hunter' else 'none'),('warrior','none'),('astral','none'),('hunter','basic')]
        for row,(cls,style) in enumerate(styles):
            source=art/f'{cls}-{sex}-{style}-motion-v3.png';image=Image.open(source).convert('RGBA')
            for direction in range(8):
                frame=direction*4;tile=image.crop((frame%8*192+56,frame//8*192,frame%8*192+136,frame//8*192+80))
                # Uniform head registration uses the actual chin/neck, rather
                # than the old y=55 upper-face anchor which cut faces in half.
                mask=Image.new('L',(80,80));d=ImageDraw.Draw(mask)
                sn=necks[cls];d.polygon([(2,0),(78,0),(76,sn-16),(52,sn+2),(28,sn+2),(4,sn-16)],fill=255)
                rgba=np.array(tile);rgba[:,:,3]=np.minimum(rgba[:,:,3],np.array(mask));tile=Image.fromarray(rgba)
                semantic=semantic_masks(tile,sn,direction)
                scale=(neck-19)/(sn-19);w,h=round(80*scale),round(80*scale)
                fitted=Image.new('RGBA',(80,80));fitted.alpha_composite(tile.resize((w,h),Image.Resampling.LANCZOS),(round(40-w/2),round(19*(1-scale))))
                fitted_mask=Image.new('RGBA',(80,80));fitted_mask.alpha_composite(semantic.resize((w,h),Image.Resampling.NEAREST),(round(40-w/2),round(19*(1-scale))))
                sheet.paste(fitted,(direction*80,row*80))
                masks.paste(fitted_mask,(direction*80,row*80))
            records.append({'sex':sex,'destination':destination,'neck':neck,'choice':['original','practical','astral','stellar'][row],'source':source.relative_to(root).as_posix()})
        sheet.save(out/f'heads-{destination}-{sex}.png',optimize=True)
        masks.save(out/f'masks-{destination}-{sex}.png',optimize=True)
(out/'CREDITS.md').write_text('# Appearance atlas\n\nOriginal Echoes of Dante complete-figure paintings, reused from the existing authored sources. Three complete face/hair sets per presentation, eight views, offline registered neck crops. Palette changes are baked once on appearance/equipment changes. No third-party assets.\n',encoding='utf-8')
(out/'sources.json').write_text(json.dumps(records,indent=2)+'\n')
print('Prepared eight fitted 640 x 320 head atlases and shared semantic masks.')
