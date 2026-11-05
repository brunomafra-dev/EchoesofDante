"""Original combat silhouettes, Blender 4.5, geometry export only (no render).
Game axes X/right Y/up Z/forward. Runtime shares meshes/materials.
"""
import bpy, math, json, bmesh
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.local/combat192';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def cv(p):return(p[0],-p[2],p[1])
def linear(v):return v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4
def mat(name,hex,emit=0,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');c=tuple(linear(int(hex[i:i+2],16)/255)for i in(1,3,5))+(1,)
 p.inputs['Base Color'].default_value=c;p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emit:p.inputs['Emission Color'].default_value=c;p.inputs['Emission Strength'].default_value=emit
 return m
ion=mat('Plasma cyan shell','#269fbd',.7);white=mat('Contained pale plasma core','#d0fbff',1.1);violet=mat('Astral violet energy','#b49aee',.9)
water=mat('Deep blue moving water','#358dbb',.18,.2);foam=mat('Water foam crests','#c2e5e8',.3,.35)
fire=mat('Orange flame mantle','#e76626',.8);ember=mat('Hot ember core','#ffe2a0',1.0)
stone=mat('Broken mineral shell','#8e8065',0,.95);vein=mat('Mineral light seam','#d7b779',.35)
seed=mat('Living resonator seed','#9db66e',.25,.5);bio=mat('Bioelectric strand','#dcdfa1',.7)
edge=mat('Blade sweep edge','#d5f2ed',.9)
roots=[];current=None
def asset(name):
 global current
 current=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(current);roots.append(current)
def mesh(name,verts,faces,m,smooth=True):
 g=bpy.data.meshes.new(name);g.from_pydata([cv(v)for v in verts],[],faces);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.parent=current;g.materials.append(m)
 bm=bmesh.new();bm.from_mesh(g);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(g);bm.free()
 for p in g.polygons:p.use_smooth=smooth
 return o
def hull(name,sections,m,n=12):
 verts=[]
 for z,rx,ry in sections:
  for i in range(n):a=i/n*math.tau;verts.append((math.cos(a)*rx,math.sin(a)*ry,z))
 faces=[tuple(reversed(range(n))),tuple(range((len(sections)-1)*n,len(sections)*n))]
 for j in range(len(sections)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 return mesh(name,verts,faces,m)
def tube(name,points,r,m,n=6):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=1;curve.bevel_depth=r;curve.bevel_resolution=0;curve.resolution_u=2;curve.use_fill_caps=True
 s=curve.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*cv(v),1)
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.parent=current;curve.materials.append(m);return o
def arc(name,r,y,a,b,width,m,steps=28):
 verts=[]
 for i in range(steps+1):
  t=i/steps;angle=a+(b-a)*t;w=width*max(.08,math.sin(math.pi*t)**.6)
  for rr,yy in[(r-w,y-.012),(r+w,y-.012),(r+w,y+.012),(r-w,y+.012)]:verts.append((math.sin(angle)*rr,yy,math.cos(angle)*rr))
 faces=[]
 for i in range(steps):
  for j in range(4):a=i*4+j;b=i*4+(j+1)%4;faces.append((a,b,b+4,a+4))
 faces.extend([(3,2,1,0),tuple(range(steps*4,steps*4+4))]);return mesh(name,verts,faces,m)

asset('fx-plasma')
hull('Compressed plasma mantle',[(-.43,.012,.012),(-.22,.065,.065),(.12,.085,.085),(.29,.025,.025),(.34,.002,.002)],ion)
hull('Bright axial capsule',[(-.31,.009,.009),(-.08,.031,.031),(.20,.026,.026),(.32,.002,.002)],white)
for i in range(3):
 a=i/3*math.tau;tube('Magnetic plasma filament',[(math.cos(a+z*5)*.08,math.sin(a+z*5)*.08,z)for z in[-.32,-.22,-.1,.02,.14]],.009,white)
asset('fx-energy')
hull('Faceted astral lens',[(-.21,.005,.005),(-.08,.13,.13),(.09,.13,.13),(.22,.005,.005)],violet,n=6)
for axis in range(2):
 points=[]
 for i in range(25):
  a=i/24*math.tau;points.append((math.cos(a)*.19,math.sin(a)*(.19 if axis==0 else .055),math.sin(a)*(.055 if axis==0 else .19)))
 tube('Orbiting energy contour',points,.011,white)
asset('fx-water')
hull('Tapered water droplet',[(-.26,.003,.003),(-.08,.125,.125),(.08,.14,.14),(.20,.07,.07),(.25,.002,.002)],water,n=14)
for sign in[-1,1]:tube('Trailing curved foam',[(sign*(.04+.11*t),.035*math.sin(t*4),-.15-.42*t)for t in[i/8 for i in range(9)]],.014,foam)
asset('fx-fire')
hull('Flame lance',[(-.35,.003,.003),(-.12,.09,.055),(.10,.11,.08),(.27,.002,.002)],fire,n=9)
hull('Incandescent ember',[(-.14,.008,.008),(.04,.055,.04),(.20,.002,.002)],ember,n=9)
for sign in[-1,1]:tube('Licking flame spur',[(0,0,.05),(sign*.13,.03,-.08),(sign*.1,.07,-.27)],.024,fire)
asset('fx-earth')
o=hull('Split flying mineral',[(-.24,.04,.07),(-.04,.13,.09),(.12,.10,.07),(.30,.002,.002)],stone,n=5)
for p in o.data.polygons:p.use_smooth=False
tube('Exposed mineral seam',[(-.045,.085,-.17),(.05,.10,.01),(.025,.065,.18)],.012,vein)
asset('fx-bond')
hull('Living seed',[(-.22,.01,.01),(-.06,.095,.07),(.1,.09,.065),(.24,.002,.002)],seed,n=10)
for sign in[-1,1]:tube('Organic linking tendril',[(sign*.02,0,.18),(sign*.14,0,.03),(sign*.18,.04,-.2),(sign*.11,.06,-.34)],.012,bio)
asset('fx-plasma-beam')
hull('Beam shell',[(0,.34,.34),(.05,.38,.38),(.95,.31,.31),(1,.16,.16)],ion,n=14)
hull('Beam white core',[(0,.08,.08),(.05,.13,.13),(.96,.10,.10),(1,.025,.025)],white,n=12)
for i in range(3):
 a=i/3*math.tau;tube('Confined beam rail',[(math.cos(a+z*3.5)*.30,math.sin(a+z*3.5)*.30,z)for z in[j/16 for j in range(17)]],.018,white)
asset('fx-blade-sweep')
arc('Solid saber sweep',1.36,0,-1.12,1.12,.14,ion)
arc('Tapered blade edge',1.51,.015,-1.12,1.12,.025,edge)
asset('fx-water-vortex')
# Thin flowing sheets, not round pipes. Foam breaks into short crest sections.
for j in range(3):
 verts=[];faces=[]
 for i in range(39):
  t=i/38;a=t*math.tau*.82+j*math.tau/3;r=.12+t*.82;w=.025+.075*math.sin(math.pi*t)
  for side in[-1,0,1]:verts.append((math.cos(a)*(r+side*w),.022+(.035+math.sin(t*math.pi)*.075)*(1-abs(side)),math.sin(a)*(r+side*w)))
 for i in range(38):
  for k in range(2):n=i*3+k;faces.append((n,n+1,n+4,n+3))
 sheet=mesh('Curling water sheet',verts,faces,water);mod=sheet.modifiers.new('Water sheet thickness','SOLIDIFY');mod.thickness=.008
 for start in[9,21,31]:
  points=[]
  for i in range(start,start+5):
   t=i/38;a=t*math.tau*.82+j*math.tau/3;r=.12+t*.82;points.append((math.cos(a)*r,.065+math.sin(t*math.pi)*.075,math.sin(a)*r))
  tube('Broken foam crest',points,.009,foam)
verts=[(0,.018,0)]+[(math.cos(i/40*math.tau)*.98,.018,math.sin(i/40*math.tau)*.98)for i in range(40)]
mesh('Thin water footprint',verts,[(0,i+1,(i+1)%40+1)for i in range(40)],water)
asset('fx-energy-cage')
for j in range(3):
 a=j/3*math.pi;points=[]
 for i in range(25):t=i/24*math.pi;points.append((math.cos(t)*math.cos(a)*.85,math.sin(t)*1.3,math.cos(t)*math.sin(a)*.85))
 tube('Converging astral arch',points,.018,violet)
arc('Broken energy orbit',.78,.12,-1.8,1.8,.035,white)

# Convert curves and merge by root/material, preserving just ten model roots.
for root in roots:
 groups={}
 for o in list(root.children):
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  if o.type=='CURVE':bpy.ops.object.convert(target='MESH');o=bpy.context.object
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  groups.setdefault(o.data.materials[0].name,[]).append(o)
 for name,items in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0]
  if len(items)>1:bpy.ops.object.join()
  bpy.context.object.name=root.name+'__'+name
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Dante-combat-fx.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'combat-fx-raw.glb'),export_format='GLB',export_animations=False,export_apply=True,export_extras=True,export_yup=True)
print('AUTHORED192',len(roots),'original combat effect models; no rendering.',flush=True)
