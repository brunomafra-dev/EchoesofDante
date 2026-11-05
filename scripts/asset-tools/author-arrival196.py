"""Original Warden sculpt and armature; CPU authoring only, no render."""
import bpy,math,random,json,hashlib,bmesh
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.local/warden196';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);random.seed(196)
def cv(p):return(p[0],-p[2],p[1])
def linear(x):return x/12.92 if x<=.04045 else((x+.055)/1.055)**2.4
def mat(name,color,metal=0,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.use_backface_culling=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(linear(int(color[i:i+2],16)/255)for i in(1,3,5))+(1,);p.inputs['Base Color'].default_value=c;p.inputs['Roughness'].default_value=.86;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=c;p.inputs['Emission Strength'].default_value=emission
 return m
shell=mat('Weathered mineral carapace','#8c876c');joint=mat('Dark living mineral seams','#3c3945');edge=mat('Fresh fractured shell edges','#b8a789');core=mat('Ancestral violet core','#b095dc',.15,.65);amber=mat('Amber mineral inclusions','#ad7d35',.1,.15)
# Original 128px mineral grain, stored in the GLB; shared by all opaque shell pieces.
img=bpy.data.images.new('Dante original mineral grain',width=128,height=128);pixels=[]
for y in range(128):
 for x in range(128):
  v=.68+random.random()*.28+.04*math.sin(x*.35+math.sin(y*.13)*3);pixels.extend((v,v,v,1))
img.pixels=pixels;img.pack()
for m in(shell,edge,joint):
 n=m.node_tree.nodes;p=n.get('Principled BSDF');tex=n.new('ShaderNodeTexImage');tex.image=img;mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[1].default_value=p.inputs['Base Color'].default_value;m.node_tree.links.new(tex.outputs['Color'],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],p.inputs['Base Color'])
 # glTF supports the baked texture directly; tint remains a material factor.
 m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);m['danteColor']=list(m.diffuse_color)
 # Encode material tint into separate image pixels to preserve export fidelity.
 tint=tuple(p.inputs['Base Color'].default_value);copy=img.copy();copy.name=m.name+' grain';copy.pixels=[pixels[i]*tint[i%4] if i%4!=3 else 1 for i in range(len(pixels))];copy.pack();tex.image=copy
bpy.ops.object.armature_add();rig=bpy.context.object;rig.name='Warden';bpy.ops.object.mode_set(mode='EDIT');rig.data.edit_bones.remove(rig.data.edit_bones[0]);bones={}
def bone(name,head,tail,parent=None):
 b=rig.data.edit_bones.new(name);b.head=cv(head);b.tail=cv(tail)
 if parent:b.parent=bones[parent]
 bones[name]=b
bone('Root',(0,0,0),(0,.4,0));bone('Torso',(0,1,0),(0,2.3,0),'Root');bone('Crown',(0,2.2,0),(0,3.1,.1),'Torso')
for side in(-1,1):
 s='L'if side<0 else'R';bone('Arm'+s,(side*.72,2.0,0),(side*1.12,1.35,.15),'Torso');bone('Claw'+s,(side*1.12,1.35,.15),(side*1.3,.55,.55),'Arm'+s);bone('Leg'+s,(side*.48,1.0,0),(side*.62,.28,.05),'Root')
bpy.ops.object.mode_set(mode='OBJECT');pieces=[]
def form(name,p,scale,m,bone,detail=1,rot=(0,0,0)):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail+1,radius=1,location=cv(p));o=bpy.context.object;o.name=name;o.scale=(scale[0],scale[2],scale[1]);o.rotation_euler=rot
 # Stable broken planes, rather than overlapping polished spheres.
 for v in o.data.vertices:v.co*=.91+random.random()*.16
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);vg=o.vertex_groups.new(name=bone);vg.add(list(range(len(o.data.vertices))),1,'REPLACE');pieces.append(o);return o
def spur(name,points,radii,m,bone):
 verts=[];faces=[];n=7
 for (x,y,z),r in zip(points,radii):
  for i in range(n):a=i/n*math.tau;verts.append(cv((x+math.cos(a)*r,y,z+math.sin(a)*r)))
 for j in range(len(points)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 faces.extend([tuple(reversed(range(n))),tuple(range((len(points)-1)*n,len(points)*n))]);g=bpy.data.meshes.new(name);g.from_pydata(verts,[],faces);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);g.materials.append(m);o.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE');pieces.append(o)
form('Continuous dark torso',(0,1.68,-.03),(.79,.94,.52),joint,'Torso',2)
for side in(-1,1):
 s='L'if side<0 else'R'
 form('Grounded hind foot',(side*.6,.17,.16),(.42,.2,.5),shell,'Leg'+s)
 form('Bent supporting leg',(side*.56,.64,-.07),(.36,.55,.34),joint,'Leg'+s)
 form('Knee shell',(side*.66,.58,.28),(.35,.41,.22),edge,'Leg'+s)
 form('Shoulder mantle',(side*.83,2.08,-.03),(.62,.57,.61),shell,'Arm'+s,2)
 form('Elbow tendon',(side*1.15,1.4,.1),(.29,.62,.27),joint,'Claw'+s)
 form('Massive blade claw',(side*1.33,.88,.48),(.36,.79,.4),shell,'Claw'+s,2)
 form('Outer claw cutting edge',(side*1.46,.51,.69),(.16,.48,.19),edge,'Claw'+s)
 spur('Hooked mineral claw',[(side*1.43,1.27,.45),(side*1.62,.88,.62),(side*1.59,.40,.84),(side*1.32,.17,.95)],[.25,.22,.15,.008],edge,'Claw'+s)
 for row in range(3):
  form('Overlapping shoulder scute',(side*(.68+row*.18),2.36-row*.12,-.02),(.29,.14,.41),edge if row==0 else shell,'Arm'+s)
  spur('Shoulder horn',[(side*(.72+row*.2),2.32-row*.08,-.15),(side*(.88+row*.25),2.68-row*.1,-.21),(side*(.99+row*.25),2.81-row*.1,-.24)],[.13,.08,.004],edge,'Arm'+s)
 for n in range(3):form('Claw talon',(side*(1.08+n*.19),.24,.72),(.09,.25,.12),edge,'Claw'+s)
 form('Chest flanking plate',(side*.42,1.95,.39),(.43,.48,.23),shell,'Torso')
 for n in range(3):form('Shoulder amber seam',(side*(.58+n*.18),2.36-n*.04,.2),(.085,.065,.09),amber,'Arm'+s)
form('Visible recessed core',(0,1.9,.49),(.18,.27,.16),core,'Torso',2)
for n in range(9):
 a=n/9*math.tau;form('Radial crown shell',(.46*math.cos(a),2.61+.40*math.sin(a),.08),(.26,.24,.34),shell,'Crown')
form('Crown dark recess',(0,2.61,-.02),(.33,.3,.08),joint,'Crown')
for n in range(5):form('Dorsal ridge',(0,1.45+n*.29,-.45),(.23,.31,.25),edge,'Torso')
for n in range(4):spur('Dorsal blade',[(0,1.7+n*.32,-.43),(0,1.94+n*.32,-.7),(0,2.10+n*.32,-.82)],[.18,.11,.005],edge,'Torso')
bpy.ops.object.select_all(action='DESELECT')
for o in pieces:o.select_set(True)
bpy.context.view_layer.objects.active=pieces[0];bpy.ops.object.join();body=bpy.context.object;body.name='Warden complete weighted shell';body.parent=rig;mod=body.modifiers.new('Warden armature','ARMATURE');mod.object=rig
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')
for p in body.data.polygons:p.use_smooth=False
# Skeleton is posed by the encounter's committed animation timeline. No root motion.
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Dante-Warden.blend'))
file=ROOT/'public/assets/arrival-3d/warden-196.glb';bpy.ops.export_scene.gltf(filepath=str(file),export_format='GLB',export_animations=False,export_yup=True,export_skins=True,export_extras=False)
body.data.calc_loop_triangles();meta={'version':'0.1.196','file':file.name,'author':'Echoes of Dante','license':'CC0-1.0','source':'scripts/asset-tools/author-arrival196.py','bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'triangles':len(body.data.loop_triangles),'bones':len(rig.data.bones),'materials':len(body.data.materials),'textures':3,'textureResolution':[128,128],'animation':'Independent skeletal poses driven by canonical Warden encounter events; no imported clips or root motion.'}
(file.with_suffix('.json')).write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta),flush=True)
