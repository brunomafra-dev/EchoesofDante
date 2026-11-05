"""Fitted camp garments and grip-origin tools. Blender 4.5 CPU authoring.
Garments follow the shipped CC0 outfit surface, not a displaced enclosing tube.
No replacement human, animation, hair or gameplay asset is exported.
"""
import bpy,bmesh,math,random,json
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.local/crew195';OUT.mkdir(parents=True,exist_ok=True)
def cv(p):return(p[0],-p[2],p[1])
def gc(p):return(p[0],p[2],-p[1])
def linear(v):return v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
roots=[];current=None
def asset(name):
 global current
 current=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(current);roots.append(current)
def texture(kind):
 n=256;rng=random.Random(195+len(kind));im=bpy.data.images.new('Dante195-'+kind,width=n,height=n);pixels=[]
 for y in range(n):
  for x in range(n):
   noise=rng.random()
   if kind=='canvas':v=.92+.035*noise+.008*math.sin(x*math.pi/2)*math.sin(y*math.pi/2)
   elif kind=='leather':v=.72+.14*noise+.06*math.sin(x*.19+math.sin(y*.13)*3)*math.sin(y*.25)
   elif kind=='steel':v=.80+.055*noise+.06*math.sin(y*.93)+(.035 if x%67==0 else 0)
   else:v=.80+.08*noise+.07*math.sin(x*.08+math.sin(y*.025)*2)
   pixels.extend((v,v,v,1))
 im.pixels=pixels;im.filepath_raw=str(OUT/(kind+'.png'));im.file_format='PNG';im.save();im.pack();return im
maps={k:texture(k)for k in ['canvas','leather','steel','wood']}
def mat(name,color,kind,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');tint=tuple(linear(int(color[i:i+2],16)/255)for i in(1,3,5))+(1,)
 m['danteTint']=list(tint);m.diffuse_color=tint;p.inputs['Base Color'].default_value=tint;p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=maps[kind];m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);return m
leather=mat('195 worn smith leather','#66503a','leather');ivory=mat('195 medical canvas','#cccdbd','canvas');olive=mat('195 field canvas','#626a52','canvas');brown=mat('195 brown work canvas','#6a5541','canvas');orange=mat('195 amber neckcloth','#ab602d','canvas');steel=mat('195 brushed steel','#849591','steel',.42,.72);grip=mat('195 textured rubber','#353c37','leather');wood=mat('195 oiled ash','#766046','wood');glass=mat('195 instrument enamel','#39585a','steel',.35,.35);white=mat('195 medical marking','#eeeadb','canvas');seam=mat('195 saddle stitching','#ae9773','canvas')
def mesh(name,verts,faces,m,thickness=0,smooth=True):
 g=bpy.data.meshes.new(name);g.from_pydata([cv(v)for v in verts],[],faces);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.parent=current;g.materials.append(m)
 bm=bmesh.new();bm.from_mesh(g);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(g);bm.free()
 for p in g.polygons:p.use_smooth=smooth
 if thickness:mod=o.modifiers.new('Outward cloth thickness','SOLIDIFY');mod.thickness=thickness;mod.offset=1
 return o
def rod(name,a,b,r,m,r2=None):
 a,b=Vector(cv(a)),Vector(cv(b));d=b-a;bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=d.to_track_quat('Z','Y');o.name=name;o.parent=current;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def box(name,p,size,m,bevel=.005):
 bpy.ops.mesh.primitive_cube_add(size=1,location=cv(p));o=bpy.context.object;o.name=name;o.parent=current;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 mod=o.modifiers.new('Rounded manufactured edges','BEVEL');mod.width=min(bevel,min(size)/4);mod.segments=2;return o
def path(name,points,r,m):
 for i in range(len(points)-1):rod(name,points[i],points[i+1],r,m)
def marker(name,p):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=current;o.location=cv(p)

imports=set();surfaces={};outfits={};heads={}
for gender in ['male','female']:
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/assets/arrival-3d/crew-{gender}-193.glb'));added=set(bpy.data.objects)-before;imports.update(added)
 o=next(o for o in added if o.type=='MESH'and 'Peasant_Arms'in o.name);outfits[gender]=o
 # Ray fitting uses the body of the outfit, never the sleeves/hands in T-pose.
 faces=[list(p.vertices)for p in o.data.polygons if all(abs(o.data.vertices[i].co.x)<.255 for i in p.vertices)]
 surfaces[gender]=BVHTree.FromPolygons([v.co.copy()for v in o.data.vertices],faces)
 head=next(o for o in added if o.type=='MESH'and o.name.lower().startswith('superhero_'))
 heads[gender]=BVHTree.FromPolygons([v.co.copy()for v in head.data.vertices],[list(p.vertices)for p in head.data.polygons])
def front(x,y,gender,offset=.008):
 hit=surfaces[gender].ray_cast(Vector(cv((x,y,.65))),Vector((0,1,0)),1.3)
 if hit[0] is not None:return gc(hit[0])[2]+offset
 near=surfaces[gender].find_nearest(Vector(cv((x,y,.14))))
 return gc(near[0])[2]+offset if near[0] is not None else .14
def panel(name,gender,m,x0,x1,y0,y1,offset=.008,nx=12,ny=20):
 verts=[]
 for j in range(ny+1):
  y=y0+(y1-y0)*j/ny
  for i in range(nx+1):
   x=x0+(x1-x0)*i/nx;verts.append((x,y,front(x,y,gender,offset)))
 faces=[]
 for j in range(ny):
  for i in range(nx):a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
 return mesh(name,verts,faces,m,.003)

# A single short, smooth apron hem below the integrated bib. Its upper edge
# overlaps the bib at the belt; the rest is a natural hanging cloth surface.
asset('apron-hem');verts=[];nx=16;ny=12
for j in range(ny+1):
 y=.81+j/ny*.32
 for i in range(nx+1):
  x=(i/nx*2-1)*.175;t=j/ny;z=(.15+.008*math.cos(x/.175*math.pi/2))*(1-t)+front(x,1.13,'male',.009)*t
  verts.append((x,y,z))
mesh('Smooth hanging apron hem',verts,[(j*(nx+1)+i,j*(nx+1)+i+1,(j+1)*(nx+1)+i+1,(j+1)*(nx+1)+i)for j in range(ny)for i in range(nx)],leather,.004)
for o in imports:bpy.data.objects.remove(o,do_unlink=True)
asset('head-ivo')
for side in [-1,1]:
 points=[(side*.036+math.cos(a)*.027,1.773+math.sin(a)*.023,.093)for a in[i/24*math.tau for i in range(25)]]
 path('Protective goggle frame',points,.004,steel)
 mesh('Smoked goggle lens',[(side*.036,1.773,.092)]+[(side*.036+math.cos(a)*.023,1.773+math.sin(a)*.019,.092)for a in[i/20*math.tau for i in range(20)]],[(0,i+1,(i+1)%20+1)for i in range(20)],glass,.002)
path('Goggle bridge',[(-.010,1.773,.094),(0,1.776,.098),(.010,1.773,.094)],.004,steel)
verts=[]
for i in range(37):
 a=.65+i/36*(math.tau-1.3)
 for y in [1.763,1.779]:
  start=Vector(cv((math.sin(a)*.3,y,math.cos(a)*.3)));direction=Vector(cv((-math.sin(a),0,-math.cos(a))))
  hit=heads['male'].ray_cast(start,direction,.6)
  if hit[0] is None:raise RuntimeError('Head strap must fit the actual head')
  verts.append(gc(hit[0]-direction*.003))
mesh('Fitted flat goggle band',verts,[(i*2,i*2+1,i*2+3,i*2+2)for i in range(36)],grip,.002)
asset('material-swatches');mesh('Woven material swatch',[(0,0,0),(.01,0,0),(.01,.01,0),(0,.01,0)],[(0,1,2,3)],ivory)
for role in ['ivo','gui','lia','nara','elisa']:
 asset('tool-'+role);marker('grip',(0,0,0))
 if role in ['ivo','gui']:
  rod('Oiled ash hammer handle',(0,0,-.12),(0,0,.15),.017,wood,.022)
  for z in [-.07,-.048,-.026,-.004,.018]:rod('Leather grip binding',(0,0,z),(0,0,z+.009),.021,grip)
  box('Forged hammer head',(0,0,.155),(.19,.065,.065),steel,.012)
  box('Flat striking face',(-.10,0,.155),(.022,.072,.072),steel,.004)
  marker('working-tip',(-.11,0,.155));marker('shaft-end',(0,0,-.12))
 elif role=='lia':
  rod('Injector barrel',(0,0,-.075),(0,0,.07),.014,glass);rod('Injector front collar',(0,0,.06),(0,0,.085),.018,steel);rod('Fine medical needle',(0,0,.085),(0,0,.14),.002,steel)
  box('Thumb plunger',(0,0,-.105),(.045,.015,.012),steel);rod('Plunger',(0,0,-.105),(0,0,-.075),.007,steel)
  for z in [-.04,-.01,.02]:box('Dose marking',(.014,.003,z),(.002,.006,.011),white,.0005)
  marker('working-tip',(0,0,.14));marker('shaft-end',(0,0,-.105))
 elif role=='nara':
  # A short underside handle is the origin; the tablet rests above the hand.
  rod('Slate underside grip',(0,0,-.025),(0,0,.025),.018,grip)
  box('Survey tablet housing',(-.065,.045,.035),(.23,.028,.29),grip,.012);box('Matte inset display',(-.065,.061,.035),(.195,.004,.248),glass,.002)
  for i in range(4):box('Survey contour mark',(-.065,.064,-.045+i*.045),(.14-i*.014,.001,.003),steel,.0002)
  marker('working-tip',(-.065,.064,.035));marker('shaft-end',(0,0,-.025))
 else:
  # The handle is above the vessel, so a held can hangs below the palm.
  rod('Watering handle grip',(0,0,-.045),(0,0,.045),.018,grip)
  for z in [-.045,.045]:rod('Handle bracket',(0,0,z),(0,-.07,z),.009,steel)
  rod('Brushed watering vessel',(0,-.19,0),(0,-.065,0),.075,steel,.085)
  path('Watering spout',[(.055,-.16,.025),(.13,-.12,.09),(.17,-.08,.16)],.015,steel)
  rod('Watering rose',(.16,-.085,.15),(.18,-.075,.17),.025,steel)
  marker('working-tip',(.18,-.075,.17));marker('shaft-end',(0,0,-.045))

# Apply geometry, unwrap in repeatable physical units, merge by material per
# root. All surface images are exported, not runtime noise or flat fallback.
for root in roots:
 groups={}
 for o in list(root.children):
  if o.type!='MESH':continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
  uv=o.data.uv_layers.new(name='WorkSurfaceUV')
  for poly in o.data.polygons:
   axis=max(range(3),key=lambda i:abs(poly.normal[i]));a,b=[i for i in range(3)if i!=axis]
   for li in poly.loop_indices:
    p=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(p[a]*3,p[b]*3)
  groups.setdefault(o.data.materials[0].name,[]).append(o)
 for name,items in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0]
  if len(items)>1:bpy.ops.object.join()
  bpy.context.object.name=root.name+'__'+name
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Dante-fitted-crew.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'work-raw.glb'),export_format='GLB',export_animations=False,export_apply=True,export_yup=True,export_extras=True)
print('CREW195',len(roots),'roots',flush=True)
