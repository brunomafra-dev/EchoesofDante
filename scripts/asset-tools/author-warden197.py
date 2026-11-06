"""Original Warden review sculpt. CPU mesh/texture authoring; no offline render.

Blender 4.5 LTS --background --factory-startup --python scripts/asset-tools/author-warden197.py
The nine-bone contract matches Warden.ts. No gameplay data is generated here.
"""
import bpy, bmesh, math, random, json, hashlib, struct, zlib
from pathlib import Path
from mathutils import Vector
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
TMP=ROOT/'.local/warden197'; TMP.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public/assets/arrival-3d'
random.seed(197)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def cv(p): return (p[0],-p[2],p[1])
def png(path,a):
    a=np.asarray(a,dtype=np.uint8); h,w,c=a.shape
    def chunk(k,d): return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
    raw=b''.join(b'\0'+a[y].tobytes() for y in range(h))
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

# Original periodic mineral grain. Real normal/roughness maps, not painted light.
N=512; yy,xx=np.mgrid[:N,:N]/N; rng=np.random.default_rng(197)
fine=rng.random((N,N))-.5
freq=np.fft.fftfreq(N)*N;fx,fy=np.meshgrid(freq,freq);radius=np.maximum(1,np.sqrt(fx*fx+fy*fy))
h=np.fft.ifft2(np.fft.fft2(rng.normal(size=(N,N)))/radius**1.3).real
h=h/max(.0001,h.std())*.12+fine*.035
# Periodic cellular fractures, with variable mineral deposit widths. They add
# fissures and edge grain rather than broad directional bands resembling wood.
nearest=np.full((N,N),10.);second=nearest.copy()
for sx,sy in rng.random((92,2)):
    ddx=np.abs(xx-sx);ddy=np.abs(yy-sy);d=np.sqrt(np.minimum(ddx,1-ddx)**2+np.minimum(ddy,1-ddy)**2)
    second=np.minimum(second,np.maximum(nearest,d));nearest=np.minimum(nearest,d)
gap=second-nearest;crack=np.exp(-gap*1100);edge=np.exp(-gap*160)
grain=np.clip(.69+h*.72-crack*.30+edge*.055+fine*.035,0,1)
h=h*.45-crack*.035+edge*.012
base=np.stack([grain*1.03,grain*1.005,grain*.95],axis=-1)
png(TMP/'mineral-color.png',np.clip(base*255,0,255))
dx=(np.roll(h,-1,1)-np.roll(h,1,1))*5; dy=(np.roll(h,-1,0)-np.roll(h,1,0))*5
norm=np.stack([-dx,-dy,np.ones_like(h)],axis=-1); norm/=np.linalg.norm(norm,axis=-1)[...,None]
png(TMP/'mineral-normal.png',(norm*.5+.5)*255)
rough=np.clip(.72+h*.13+fine*.055,.55,.92); png(TMP/'mineral-roughness.png',np.repeat(rough[...,None],3,axis=2)*255)
images={k:bpy.data.images.load(str(TMP/('mineral-'+k+'.png'))) for k in ['color','normal','roughness']}
images['normal'].colorspace_settings.name='Non-Color';images['roughness'].colorspace_settings.name='Non-Color'

def linear(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def mat(name,color,rough=.8,texture=True,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    rgb=tuple(linear(int(color[i:i+2],16)/255) for i in [1,3,5]);p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough
    if texture:
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=images['color']
        # Tint baked into the shared material factor after export; glTF export
        # supports direct texture * factor through a MULTIPLY node.
        mix=m.node_tree.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(*rgb,1)
        m.node_tree.links.new(tex.outputs['Color'],mix.inputs[1]);m.node_tree.links.new(mix.outputs[0],p.inputs['Base Color'])
        texn=m.node_tree.nodes.new('ShaderNodeTexImage');texn.image=images['normal'];nm=m.node_tree.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.3
        m.node_tree.links.new(texn.outputs['Color'],nm.inputs['Color']);m.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal'])
        texr=m.node_tree.nodes.new('ShaderNodeTexImage');texr.image=images['roughness'];m.node_tree.links.new(texr.outputs['Color'],p.inputs['Roughness'])
    if emission:p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=emission
    return m

shell=mat('Ivory weathered carapace','#a6a99f')
lip=mat('Fresh limestone cutting edges','#c4c2b1')
skin=mat('Deep violet mineral tendons','#554b5c',.86)
amber=mat('Recessed amber mineral','#c69249',.58,False)
core=mat('Recessed violet heart','#ac8ed9',.38,False,.65)
cavity=mat('Crown interior stone','#3c3941',.95)
floorMat=mat('Arena cool slate','#68716f',texture=False)
rockMat=mat('Arena stratified stone','#838680')

bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Warden197';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0]);bones={}
def bone(name,a,b,parent=None):
    v=rig.data.edit_bones.new(name);v.head=cv(a);v.tail=cv(b)
    if parent:v.parent=bones[parent]
    bones[name]=v
bone('Root',(0,0,0),(0,.4,0));bone('Torso',(0,1,0),(0,2.3,0),'Root');bone('Crown',(0,2.2,0),(0,3.1,.1),'Torso')
for side in [-1,1]:
    s='L' if side<0 else 'R'
    bone('Arm'+s,(side*.72,2,0),(side*1.12,1.35,.15),'Torso')
    bone('Claw'+s,(side*1.12,1.35,.15),(side*1.3,.55,.55),'Arm'+s)
    bone('Leg'+s,(side*.48,1,0),(side*.62,.28,.05),'Root')
bpy.ops.object.mode_set(mode='OBJECT');pieces=[];arena=[]

def mesh(name,verts,faces,uvs,material,joint=None,smooth=True,wrap=0):
    g=bpy.data.meshes.new(name);g.from_pydata([cv(p) for p in verts],[],faces);g.update()
    bm=bmesh.new();bm.from_mesh(g);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(g);bm.free()
    layer=g.uv_layers.new(name='UVMap')
    for poly in g.polygons:
        poly.use_smooth=smooth
        values=[uvs[g.loops[i].vertex_index] for i in poly.loop_indices];seam=wrap and max(v[0] for v in values)-min(v[0] for v in values)>wrap*.5
        for i in poly.loop_indices:
            u,v=uvs[g.loops[i].vertex_index];layer.data[i].uv=(u+wrap if seam and u<wrap*.5 else u,v)
    o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);g.materials.append(material)
    if joint:o.vertex_groups.new(name=joint).add(list(range(len(verts))),1,'REPLACE');pieces.append(o)
    else:arena.append(o)
    return o

def loft(name,rows,material,joint,segments=20,bulge=.012):
    # Smooth swept closed volumes, each row = x,y,z, lateral radius, front radius.
    rows=[list(r) for r in rows];dense=[]
    for j in range(len(rows)-1):
        for sub in range(3):
            t=sub/3;a=np.array(rows[max(0,j-1)]);b=np.array(rows[j]);c=np.array(rows[j+1]);d=np.array(rows[min(len(rows)-1,j+2)])
            r=.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
            dense.append(r)
    dense.append(np.array(rows[-1]));verts=[];uvs=[];faces=[]
    for j,r in enumerate(dense):
        tangent=Vector(dense[min(j+1,len(dense)-1)][:3]-dense[max(j-1,0)][:3]);tangent.normalize()
        front=Vector((0,0,1));u=tangent.cross(front)
        if u.length<.05:u=tangent.cross(Vector((0,1,0)))
        u.normalize();v=u.cross(tangent).normalized()
        for i in range(segments):
            a=i/segments*math.tau;scale=1+bulge*math.sin(i*2.3+j*.57)
            p=Vector(r[:3])+u*(math.cos(a)*max(.003,r[3])*scale)+v*(math.sin(a)*max(.003,r[4])*scale)
            verts.append(tuple(p));uvs.append((i/segments*2,j/(len(dense)-1)*2))
    for j in range(len(dense)-1):
        for i in range(segments):a=j*segments+i;b=j*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
    faces.extend([tuple(reversed(range(segments))),tuple(range((len(dense)-1)*segments,len(dense)*segments))])
    return mesh(name,verts,faces,uvs,material,joint,wrap=2)

def plate(name,outline,z,depth,material,joint,sign=1):
    # Beveled curved scute with real thickness, a sloping central ridge and
    # overlapping skirt. Shape is authored from an outline, not an ellipsoid.
    cx=sum(p[0] for p in outline)/len(outline);cy=sum(p[1] for p in outline)/len(outline)
    verts=[];uv=[];faces=[];n=len(outline)
    rings=[(1,z),(1,z+depth*.12),(.89,z+depth*.72),(.44,z+depth*.80),(0.06,z+depth*.81)]
    for k,(scale,zz) in enumerate(rings):
        for i,(x,y) in enumerate(outline):
            px=cx+(x-cx)*scale;py=cy+(y-cy)*scale
            verts.append((px,py,sign*(zz+depth*.035*math.sin(i*2.1))));uv.append((px*1.2,py*1.2))
    for k in range(len(rings)-1):
        for i in range(n):a=k*n+i;b=k*n+(i+1)%n;faces.append((a,b,b+n,a+n))
    faces.append(tuple(reversed(range(n))));faces.append(tuple(range((len(rings)-1)*n,len(rings)*n)))
    o=mesh(name,verts,faces,uv,material,joint)
    return o

loft('Continuous living mantle',[(0,.72,-.09,.35,.28),(0,1,-.10,.55,.36),(0,1.45,-.09,.72,.45),(0,1.92,-.08,.85,.49),(0,2.24,-.08,.75,.42),(0,2.45,-.12,.42,.27)],skin,'Torso',32)
loft('Pelvic hinge',[(0,.62,-.05,.38,.25),(0,.9,-.05,.55,.33),(0,1.25,-.07,.49,.3)],skin,'Root')
for side in [-1,1]:
    s='L' if side<0 else 'R'; sx=lambda x:side*x
    loft('Load bearing leg '+s,[(sx(.48),.95,-.09,.29,.29),(sx(.6),.69,-.12,.32,.3),(sx(.62),.36,.01,.27,.29),(sx(.62),.13,.16,.3,.36)],skin,'Leg'+s)
    for toe in range(3):
        x=sx(.43+toe*.19)
        loft('Planted toe '+s+str(toe),[(x,.21,.08,.12,.16),(x,.16,.38,.13,.18),(x,.09,.65,.10,.13),(x,.04,.77,.012,.015)],lip,'Leg'+s,14)
    knee=[(sx(.35),.86),(sx(.62),1.01),(sx(.88),.76),(sx(.85),.34),(sx(.61),.18),(sx(.34),.44)]
    plate('Knee articulated scute '+s,knee,.15,.22,shell,'Leg'+s)
    loft('Shoulder and upper arm '+s,[(sx(.69),2.18,-.12,.37,.35),(sx(.98),1.96,-.04,.39,.37),(sx(1.12),1.61,.12,.27,.26),(sx(1.18),1.34,.22,.23,.22)],skin,'Arm'+s,24)
    loft('Forearm flexor '+s,[(sx(1.14),1.51,.17,.23,.24),(sx(1.28),1.14,.26,.26,.28),(sx(1.33),.75,.34,.22,.23),(sx(1.26),.43,.47,.16,.15)],skin,'Claw'+s)
    for row in range(3):
        y=2.30-row*.20;outline=[(sx(.61+row*.08),y+.17),(sx(.93+row*.09),y+.21),(sx(1.28+row*.07),y-.02),(sx(1.40+row*.04),y-.25),(sx(1.17),y-.36),(sx(.77),y-.25)]
        plate('Overlapping shoulder lamina '+s+str(row),outline,-.04+row*.09,.25,shell,'Arm'+s)
    # Broad integrated forearm blade, tapered hook, with protected inner hand.
    blade=[(sx(1.20),1.65),(sx(1.48),1.54),(sx(1.68),1.17),(sx(1.71),.72),(sx(1.52),.30),(sx(1.31),.13),(sx(1.39),.57),(sx(1.18),1.02)]
    plate('Curved primary claw '+s,blade,.25,.23,lip,'Claw'+s)
    for row in range(3):
        y=1.45-row*.27;outline=[(sx(1.12),y+.1),(sx(1.37),y+.17),(sx(1.61),y-.08),(sx(1.48),y-.24),(sx(1.22),y-.19)]
        plate('Claw sheath '+s+str(row),outline,.48,.15,shell,'Claw'+s)
    for n in range(2):
        x=sx(1.05+n*.17)
        loft('Inner talon '+s+str(n),[(x,.58,.48,.085,.09),(x,.33,.61,.08,.09),(x,.18,.73,.045,.055),(x,.18,.82,.005,.005)],lip,'Claw'+s,12)
    for row in range(3):
        y=2.23-row*.22
        outline=[(sx(.09),y+.10),(sx(.42),y+.23),(sx(.75),y+.05),(sx(.63),y-.19),(sx(.25),y-.23),(sx(.13),y-.08)]
        plate('Interlocked thoracic plate '+s+str(row),outline,.34,.17,shell,'Torso')
    for row in range(3):
        y=1.55-row*.18;xx=.44-row*.045
        plate('Abdominal mineral lamina '+s+str(row),[(sx(.035),y+.08),(sx(xx),y+.17),(sx(xx+.13),y-.04),(sx(xx*.62),y-.14),(sx(.025),y-.09)],.29,.12,shell,'Torso')
    for row in range(2):
        x=sx(.85+row*.22)
        loft('Shoulder crest '+s+str(row),[(x,2.32-row*.12,-.10,.13,.12),(x+sx(.15),2.60-row*.06,-.14,.095,.07),(x+sx(.27),2.79-row*.06,-.18,.003,.003)],lip,'Arm'+s,12)
    for i in range(3):
        x=sx(1.32);y=1.35-i*.23
        plate('Amber claw vein '+s+str(i),[(x-.055,y+.055),(x+.03,y+.08),(x+.08,y-.025),(x-.03,y-.07)],.64,.026,amber,'Claw'+s)
    plate('Rear scapula '+s,[(sx(.04),2.35),(sx(.65),2.32),(sx(.8),1.85),(sx(.54),1.4),(sx(.15),1.57)],.36,.22,shell,'Torso',-1)

# Annular crown: a continuous irregular opening with a recessed dark chamber.
verts=[];uvs=[];faces=[];M=64
for ring,(rx,ry,z) in enumerate([(.57,.54,-.04),(.65,.59,.20),(.58,.55,.40),(.36,.34,.43),(.29,.28,.19),(.27,.25,-.17)]):
    for i in range(M):
        a=i/M*math.tau;f=1+.07*math.sin(5*a)+.035*math.sin(11*a)
        verts.append((math.cos(a)*rx*f,2.66+math.sin(a)*ry*f,z+.045*math.sin(a)))
        uvs.append((i/M*3,ring*.22))
for ring in range(5):
    for i in range(M):a=ring*M+i;b=ring*M+(i+1)%M;faces.append((a,b,b+M,a+M))
for i in range(M):faces.append((i,(i+1)%M,5*M+(i+1)%M,5*M+i))
mesh('Hollow annular crown',verts,faces,uvs,shell,'Crown',wrap=3)
for i in range(9):
    a=i/9*math.tau;outline=[]
    for angle,rx,ry in [(a-.28,.59,.55),(a+.28,.59,.55),(a+.24,.36,.33),(a-.24,.36,.33)]:outline.append((math.cos(angle)*rx,2.66+math.sin(angle)*ry))
    plate('Fractured crown lip '+str(i),outline,.395,.035,lip if i%3==0 else shell,'Crown')
plate('Crown recessed chamber',[(-.27,2.44),(-.29,2.73),(-.06,2.94),(.22,2.84),(.29,2.58),(.12,2.4)],-.215,.025,cavity,'Crown')
for i,(x,y) in enumerate([(-.43,3.02),(-.19,3.17),(.16,3.17),(.43,3.01)]):
    loft('Broken crown crest '+str(i),[(x,y-.12,.12,.13,.13),(x*1.12,y+.12,.08,.11,.08),(x*1.2,y+.29,.04,.004,.004)],lip,'Crown',12)
for i in range(3):
    y=1.48+i*.27
    plate('Dorsal keel '+str(i),[(-.16,y-.16),(.15,y-.16),(.23,y+.13),(0,y+.31),(-.23,y+.13)],.52,.16,lip,'Torso',-1)
plate('Heart socket',[(-.19,2.18),(.05,2.24),(.22,2.07),(.16,1.82),(-.10,1.77),(-.24,1.95)],.42,.08,cavity,'Torso')
plate('Violet crystal core',[(-.10,2.13),(.04,2.18),(.14,2.05),(.09,1.87),(-.04,1.84),(-.14,1.99)],.51,.055,core,'Torso')

# Join one weighted actor mesh; material groups remain shared, skeleton independent.
bpy.ops.object.select_all(action='DESELECT')
for o in pieces:o.select_set(True)
bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join();actor=bpy.context.object;actor.name='Warden197 complete mineral guardian'
bm=bmesh.new();bm.from_mesh(actor.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(actor.data);bm.free();actor.data.update()
mod=actor.modifiers.new('Independent Warden armature','ARMATURE');mod.object=rig
# Blend lower torso into pelvis to keep the death/lean hinge continuous.
torso=actor.vertex_groups.get('Torso');root=actor.vertex_groups.get('Root')
if not root:root=actor.vertex_groups.new(name='Root')
for v in actor.data.vertices:
    if any(g.group==torso.index for g in v.groups) and v.co.z<1.20:
        w=max(0,min(1,(v.co.z-.72)/.48));torso.add([v.index],w,'REPLACE');root.add([v.index],1-w,'REPLACE')
rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(TMP/'Dante-Warden197.blend'))
file=OUT/'warden-197.glb';bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_extras=False,export_tangents=True)
def material_factors(file,colors):
    # The Blender exporter drops arbitrary multiply-node tints. Make the standard
    # glTF baseColorFactor explicit; leave texture maps and their colour spaces intact.
    data=file.read_bytes();length=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+length]);tail=data[20+length:]
    for m in doc.get('materials',[]):
        color=colors.get(m['name'])
        if color:m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=[linear(int(color[i:i+2],16)/255) for i in [1,3,5]]+[1]
        if 'normalTexture' in m:m['normalTexture']['scale']=.3
    body=json.dumps(doc,separators=(',',':')).encode();body+=b' '*((-len(body))%4)
    file.write_bytes(struct.pack('<III',0x46546c67,2,20+len(body)+len(tail))+struct.pack('<II',len(body),0x4e4f534a)+body+tail)
material_factors(file,{shell.name:'#a6a99f',lip.name:'#c4c2b1',skin.name:'#554b5c',cavity.name:'#3c3941'})
actor.data.calc_loop_triangles()
meta={'file':file.name,'author':'Echoes of Dante','license':'CC0-1.0','source':'scripts/asset-tools/author-warden197.py','bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'triangles':len(actor.data.loop_triangles),'bones':len(rig.data.bones),'materials':len(actor.data.materials),'textureResolution':[512,512],'rootMotion':False,'animations':'Nine-bone poses driven by the existing encounter events; no imported animation clips.','reviewOnly':True}
(OUT/'warden-197.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8');print('WARDEN197',json.dumps(meta))

# The arena is an original, shallow cutaway; its walking plane and the native
# footprint circles are unchanged. Local origin is (27, 0, 18.75) in the game.
import re
text=(ROOT/'src/config/wardenArena.ts').read_text(encoding='utf-8')
part=text.split('WARDEN_ARENA_FOOTPRINTS:')[1].split('= [',1)[1].split('];',1)[0]
footprints=[tuple(map(float,m)) for m in re.findall(r'x:\s*([\d.]+), y:\s*([\d.]+), radius:\s*([\d.]+)',part)]
verts=[];uv=[];faces=[];nx=40;nz=26
for j in range(nz+1):
    for i in range(nx+1):
        x=-15+30*i/nx;z=-9.25+18.5*j/nz
        verts.append((x,-.018,z));uv.append((x/3.4,z/3.4))
for j in range(nz):
    for i in range(nx):a=j*(nx+1)+i;faces.append((a+nx+1,a+nx+2,a+1,a))
ground=mesh('Undisturbed fighting floor',verts,faces,uv,floorMat)
groove=mat('Worn ancestral incisions','#444c4c',.94,False)
def incision(points,width):
    vv=[];ff=[];uu=[]
    for i,(x,z) in enumerate(points):
        a=points[max(0,i-1)];b=points[min(len(points)-1,i+1)];dx=b[0]-a[0];dz=b[1]-a[1];length=max(.01,math.hypot(dx,dz))
        for side in [-1,1]:vv.append((x+dz/length*width*side,-.014,z-dx/length*width*side));uu.append((x,z))
    for i in range(len(points)-1):a=i*2;ff.append((a+2,a+3,a+1,a))
    mesh('Eroded floor incision',vv,ff,uu,groove)
for row in range(3):
    points=[]
    for i in range(33):
        a=-1.9+i/32*3.5;r=3.0+row*2.7+.10*math.sin(a*9+row)
        points.append((2.25+math.cos(a)*r,-.375+math.sin(a)*r*.83))
    incision(points,.018)
for i in range(12):
    x=-11+i*1.6;z=-.7+.11*math.sin(i*3)
    incision([(x,z-.48),(x+.35,z-.11),(x+.42,z+.5)],.025)

bpy.ops.object.select_all(action='DESELECT')
for o in arena:o.select_set(True)
bpy.context.view_layer.objects.active=arena[0];bpy.ops.object.join();stage=bpy.context.object;stage.name='Warden197 cutaway arena';stage.data.calc_loop_triangles()
bpy.ops.wm.save_as_mainfile(filepath=str(TMP/'Dante-Warden197.blend'))
file=OUT/'warden-arena-197.glb';bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',use_selection=True,export_animations=False,export_extras=False)
material_factors(file,{floorMat.name:'#68716f',rockMat.name:'#838680'})
meta={'file':file.name,'author':'Echoes of Dante','license':'CC0-1.0','source':'scripts/asset-tools/author-warden197.py','bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'triangles':len(stage.data.loop_triangles),'materials':len(stage.data.materials),'textures':0,'sharedRuntimeTextures':'Existing cave material and Poly Haven rock maps, shared without a new download','placement':[27,0,18.75],'nativeFootprints':len(footprints),'collisionChanges':False,'reviewOnly':True}
(OUT/'warden-arena-197.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8');print('ARENA197',json.dumps(meta))
