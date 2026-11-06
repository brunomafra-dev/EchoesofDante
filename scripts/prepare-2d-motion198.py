"""Register complete painted figures and bake four in-betweens per view on CPU.

No limbs are cut, rotated or assembled. Existing sources are retained. Optical
flow is a production interpolation, not newly authored animation or new anatomy.
"""
from pathlib import Path
import json, hashlib
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT/'public/assets/visual/complete-actors'
OUT = ROOT/'docs/2d-refinement'
OUT.mkdir(parents=True, exist_ok=True)
anchors = json.loads((ROOT/'src/visual/actorRegistration.json').read_text())
warrior = json.loads((ROOT/'src/visual/warriorWalkRegistration.json').read_text())
S = 192
grid = np.stack(np.meshgrid(np.arange(S), np.arange(S)), axis=-1).astype(np.float32)
flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
audit = []

def registered(tile, anchor):
    cx, neck = anchor
    scale = (183-55)/(183-neck)
    matrix = np.float32([[scale, 0, 96-cx*scale], [0, scale, 183*(1-scale)]])
    return cv2.warpAffine(tile, matrix, (S,S), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)

def between(a, b):
    # Premultiply before interpolation so transparent gutters never darken edges.
    aa, bb = a.astype(np.float32)/255, b.astype(np.float32)/255
    aa[:,:,:3] *= aa[:,:,3:4]; bb[:,:,:3] *= bb[:,:,3:4]
    ga = cv2.cvtColor(a, cv2.COLOR_RGBA2GRAY)
    gb = cv2.cvtColor(b, cv2.COLOR_RGBA2GRAY)
    ab = flow.calc(ga, gb, None); ba = flow.calc(gb, ga, None)
    # Keep the registered skull stable. No head oscillation or interpolation
    # across an equipment seam is introduced by the gait production step.
    ab[:116] = 0; ba[:116] = 0
    # Keep the original ground plane. An unbounded downward flow clipped a
    # rear Hunter boot in inspection; fade vertical deformation near the soles.
    ab[:,:,1] *= np.clip((183-grid[:,:,1])/27,0,1)
    # Reflective blade pixels must remain straight, including a downward tip.
    rgb=a[:,:,:3].astype(float);bright=(rgb.max(2)>135)&((rgb.max(2)-rgb.min(2))<65)
    protect=cv2.dilate(bright.astype(np.uint8),np.ones((9,9),np.uint8))>0
    ab[protect]=0
    result = []
    for t in [1/3, 2/3]:
        wa = cv2.remap(aa, grid-ab*t, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        # One complete source supplies each intermediate silhouette. Blending
        # the two contacts made translucent duplicate boots in early inspection.
        c = wa.copy()
        c[:,:,:3] /= np.maximum(c[:,:,3:4], 1/255)
        c[:60] = aa[:60]
        c[:60,:,:3] /= np.maximum(c[:60,:,3:4], 1/255)
        result.append(np.clip(c*255,0,255).astype(np.uint8))
    return result

for cls in ['warrior','hunter','astral','xenobinder']:
    base = 40 if cls == 'warrior' else 32
    for sex in ['male','female']:
        for style in ['none','basic','reinforced']:
            name = f'{cls}-{sex}-{style}'
            source = ART/(name+('-walk-v2' if cls=='warrior' else '')+'.png')
            im = Image.open(source).convert('RGBA')
            table = (warrior if cls=='warrior' else anchors)[f'{cls}-{sex}'][style]
            frames = []
            for f in range(base):
                original = 32+f//4 if cls=='warrior' and f<32 and f%4==0 else f
                tile = np.array(im.crop((original%4*S,original//4*S,(original%4+1)*S,(original//4+1)*S)))
                frames.append(registered(tile,table[original]))
            for row in range(8):
                a,b=frames[row*4+1],frames[row*4+2]
                frames.extend(between(a,b));frames.extend(between(b,a))
            sheet = Image.new('RGBA',(8*S,((len(frames)+7)//8)*S))
            for f,tile in enumerate(frames):sheet.paste(Image.fromarray(tile),(f%8*S,f//8*S))
            target = ART/(name+'-motion-v3.png')
            sheet.save(target,optimize=True)
            audit.append({'file':target.relative_to(ROOT).as_posix(),'source':source.relative_to(ROOT).as_posix(),'frames':len(frames),'columns':8,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
            print(name,len(frames),target.stat().st_size,flush=True)
(OUT/'motion-assets.json').write_text(json.dumps({'method':'Complete-figure registration plus one-source DIS optical-flow lower-body in-betweens; no transparency blend or generated limbs. Four extra frames per direction, protected reflective blades and bounded ground-plane deformation. Warrior idle uses its matching authored passing pose.','assets':audit},indent=2)+'\n')
