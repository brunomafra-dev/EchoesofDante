"""Quaternius CC0 hair adaptations, original NPC dress and age details in Blender 4.5.
Rest-space geometry is converted to actual Head/spine bind coordinates by the
optimizer. Whole human rigs remain untouched. CPU export, no rendering.
"""
import bpy,bmesh,math,json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'.local/crew194';OUT.mkdir(parents=True,exist_ok=True)
def cv(p):return(p[0],-p[2],p[1])
def gc(p):return[p[0],p[2],-p[1]]
def linear(v):return v/12.92 if v<=.04045 else((v+.055)/1.055)**2.4
def mat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*[linear(int(color[i:i+2],16)/255)for i in(1,3,5)],1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=.86;return m
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
hair=mat('Dante Hair fibers','#ffffff');tie=mat('Woven hair tie','#574f42');leather=mat('Worn leather apron','#5d4936');ivory=mat('Medical canvas','#d4d4c7');olive=mat('Field olive canvas','#696c4c');brown=mat('Gui worn brown coat','#766049');orange=mat('Nara amber neckcloth','#b9652d');metal=mat('Goggle dark frame','#3d413b');lens=mat('Goggle smoked lenses','#56605b');crease=mat('Subtle age crease','#7e614d')
roots=[];current=None
def asset(name):
 global current
 current=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(current);roots.append(current)
def mesh(name,verts,faces,m,smooth=True,thickness=0):
 g=bpy.data.meshes.new(name);g.from_pydata([cv(v)for v in verts],[],faces);g.update();o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.parent=current;g.materials.append(m)
 bm=bmesh.new();bm.from_mesh(g);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(g);bm.free()
 for p in g.polygons:p.use_smooth=smooth
 if thickness:mod=o.modifiers.new('Fabric edge thickness','SOLIDIFY');mod.thickness=thickness
 return o
def strand(name,points,width,depth,m=hair,sides=6):
 # Closed elliptical sections following the path; taper avoids blunt tube ends.
 verts=[]
 for i,p in enumerate(points):
  t=i/(len(points)-1);tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
  tangent.normalize();axis=tangent.cross(Vector((0,0,1)))
  if axis.length<.01:axis=tangent.cross(Vector((1,0,0)))
  axis.normalize();normal=tangent.cross(axis).normalized();taper=max(.07,math.sin(math.pi*(.09+t*.91))**.45)
  for j in range(sides):a=j/sides*math.tau;verts.append(Vector(p)+axis*math.cos(a)*width*taper+normal*math.sin(a)*depth*taper)
 faces=[tuple(reversed(range(sides))),tuple(range((len(points)-1)*sides,len(points)*sides))]
 for i in range(len(points)-1):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
 return mesh(name,verts,faces,m)
# Derive the new cuts from the licensed, authored Quaternius hair surfaces.
# This retains sculpted locks, UVs and fiber textures rather than a plain cap.
sources={};imports=set();body_surfaces={}
for g in ['male','female']:
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/assets/arrival-3d/crew-{g}-193.glb'));added=set(bpy.data.objects)-before;imports.update(added)
 body=next(o for o in added if o.type=='MESH'and 'Peasant_Arms'in o.name);body_surfaces[g]=BVHTree.FromPolygons([v.co.copy()for v in body.data.vertices],[list(p.vertices)for p in body.data.polygons])
 for o in added:
  tag=o.get('arrivalHair')
  if o.type=='MESH'and tag:sources[(g,tag)]=o
def part(kind,gender,mode='all'):
 sourcegender='male'if kind=='Hair_SimpleParted'else'female'if kind=='Hair_Buns'else gender
 original=sources[(sourcegender,kind)];o=original.copy();o.data=original.data.copy();bpy.context.collection.objects.link(o);o.parent=current
 for mod in list(o.modifiers):o.modifiers.remove(mod)
 o.vertex_groups.clear();o.matrix_world.identity()
 delta=(1.813513 if gender=='male'else 1.770924)-(1.813513 if sourcegender=='male'else 1.770924)
 if mode in ['cap','bun','crest','sweep']:
  bm=bmesh.new();bm.from_mesh(o.data)
  def keep(v):
   x,y,z=gc(v.co)
   if mode=='cap':return not(abs(x)>.081 and y>1.662)
   if mode=='bun':return x<-.081 and y>1.662
   if mode=='sweep':return y>1.744 or abs(x)<.032
   return abs(x)<.065 and y>1.755
  bmesh.ops.delete(bm,geom=[f for f in bm.faces if not all(keep(v)for v in f.verts)],context='FACES');bm.to_mesh(o.data);bm.free()
 if mode=='curl':
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=2,use_grid_fill=True);bm.normal_update()
  for v in bm.verts:
   wave=.0045*(1+math.sin(v.co.x*142+v.co.y*55)*math.cos(v.co.z*151-v.co.y*81));v.co+=v.normal*wave
  bm.to_mesh(o.data);bm.free()
 for v in o.data.vertices:
  x,y,z=gc(v.co);y+=delta;top=1.813513 if gender=='male'else 1.770924
  if mode=='wave':
   t=max(0,min(1,(top-y)/.27));x=x*(1+t*.10)+math.sin(t*7+z*12)*.009*t;z+=math.sin(t*8+x*13)*.010*t
  if mode=='curl':x*=1.08;z*=1.08;y=top-.09+(y-(top-.09))*1.10+.004
  if mode=='sweep':x*=1.02
  if mode=='recede'and z>.025 and y<top-.07:y+=min(.032,(top-.07-y)*.36);z-=.007
  if mode=='crest':x*=.48;y=top-.06+(y-(top-.06))*.86
  if mode=='bun':x=(x+.113)*.72;y=top+.012+(y-(1.73+delta))*.72;z=(z+.012)*.72-.04
  v.co=cv((x,y,z))
 for m in o.data.materials:
  if not m.name.startswith('Dante Hair'):m.name='Dante Hair textured '+m.name
 return o
for gender in ['male','female']:
 top=1.813513 if gender=='male'else 1.770924
 for style in range(4,12):
  asset(f'hair-{gender}-{style}')
  if style==4:
   part('Hair_Buzzed'if gender=='male'else'Hair_BuzzedFemale',gender);part('Hair_SimpleParted',gender,'sweep')
  if style in [5,8,10]:part('Hair_Buns',gender,'cap')
  if style==6:part('Hair_Buzzed'if gender=='male'else'Hair_BuzzedFemale',gender,'curl')
  if style==7:part('Hair_Long',gender,'wave')
  if style==9:
   part('Hair_Buzzed'if gender=='male'else'Hair_BuzzedFemale',gender);part('Hair_SimpleParted',gender,'crest')
  if style==10:part('Hair_Buns',gender,'bun')
  if style==11:part('Hair_SimpleParted',gender,'recede')
  if style==5:
   for j in range(4):
    a=j/4*math.tau;strand('Low tied ponytail',[(math.sin(a)*.018*(1-t)+math.sin(t*4)*.008,top-.08-t*.29,-.10-t*.10-math.sin(t*math.pi)*.045+math.cos(a)*.014*(1-t))for t in[i/17 for i in range(18)]],.018,.011)
  if style==8:
   for j in range(3):strand('Interwoven braid',[(math.sin(t*math.tau*4+j*math.tau/3)*.016,top-.12-t*.31,-.12-t*.11+math.cos(t*math.tau*4+j*math.tau/3)*.014)for t in[i/32 for i in range(33)]],.012,.010)
for o in imports:bpy.data.objects.remove(o,do_unlink=True)

def garment(name,m,levels,front=.52):
 verts=[];faces=[];steps=24
 for y,rx,rz in levels:
  for i in range(steps+1):a=front+i/steps*(math.tau-2*front);verts.append((math.sin(a)*rx,y,math.cos(a)*rz))
 for row in range(len(levels)-1):
  for i in range(steps):a=row*(steps+1)+i;faces.append((a,a+1,a+steps+2,a+steps+1))
 return mesh(name,verts,faces,m,thickness=.006)
for role in ['ivo','lia','nara','gui','elisa']:
 asset('dress-'+role)
 if role in ['lia','gui','nara','elisa']:
  m={'lia':ivory,'gui':brown,'nara':olive,'elisa':olive}[role];bottom=.80 if role in ['lia','gui']else 1.02
  garment('Open tailored coat'if role in ['lia','gui']else'Field vest',m,[(bottom,.205,.155),(1.08,.184,.166),(1.30,.215,.18),(1.43,.20,.145),(1.53,.084,.082)])
  for side in [-1,1]:
   mesh('Turned lapel',[(side*.055,1.50,.09),(side*.05,1.38,.18),(side*.09,1.20,.184),(side*.125,1.36,.174)],[(0,1,2,3)],m,thickness=.007)
   mesh('Stitched pocket',[(side*.10,1.19,.174),(side*.19,1.19,.155),(side*.19,1.04,.155),(side*.10,1.04,.174)],[(0,1,2,3)],m,thickness=.008)
 if role=='ivo':
  verts=[(-.13,1.49,.16),(.13,1.49,.16),(.20,1.22,.21),(.22,.79,.17),(-.22,.79,.17),(-.20,1.22,.21)]
  mesh('Full leather smith apron',verts,[(0,1,2,5),(5,2,3,4)],leather,thickness=.008)
  for side in [-1,1]:strand('Apron shoulder strap',[(side*.12,1.44,.17),(side*.16,1.50,.11),(side*.17,1.52,.02),(side*.16,1.48,-.085),(side*.15,1.40,-.13)],.012,.004,leather)
 if role=='nara':
  garment('Wrapped orange neckcloth',orange,[(1.51,.079,.078),(1.54,.071,.073)],front=0)
  mesh('Draped neckerchief',[(-.068,1.52,.09),(.068,1.52,.09),(.018,1.35,.18),(0,1.43,.17)],[(0,1,3),(0,3,2),(1,2,3)],orange,thickness=.006)
 if role=='lia':
  mesh('Medical orange patch',[(-.19,1.38,.17),(-.105,1.38,.192),(-.105,1.30,.192),(-.19,1.30,.17)],[(0,1,2,3)],orange,thickness=.003)
  for center,w,h in[((-.148,1.34,.198),.049,.012),((-.148,1.34,.199),.012,.049)]:
   x,y,z=center;mesh('Medical white cross',[(x-w/2,y-h/2,z),(x+w/2,y-h/2,z),(x+w/2,y+h/2,z),(x-w/2,y+h/2,z)],[(0,1,2,3)],ivory,thickness=.002)

asset('head-ivo')
for side in [-1,1]:
 points=[(side*.038+math.cos(a)*.029,1.774+math.sin(a)*.025,.094)for a in[i/26*math.tau for i in range(27)]]
 strand('Protective goggle frame',points,.005,.004,metal)
 mesh('Smoked protective lens',[(side*.038,1.774,.093)]+[(side*.038+math.cos(a)*.025,1.774+math.sin(a)*.021,.093)for a in[i/24*math.tau for i in range(24)]],[(0,i+1,(i+1)%24+1)for i in range(24)],lens,thickness=.002)
strand('Goggle bridge',[(-.012,1.774,.092),(0,1.777,.10),(.012,1.774,.092)],.005,.004,metal)
strand('Head strap',[(math.sin(a)*.083,1.77,math.cos(a)*.10)for a in[.65+i/25*(math.tau-1.3)for i in range(26)]],.009,.004,leather)

# Fit the fabric to the actual outfit, retaining a small clearance. Additional
# vertices follow the rounded chest instead of bridging it with a flat quad.
for root in roots:
 if not root.name.startswith('dress-'):continue
 gender='female'if root.name in ['dress-lia','dress-nara','dress-elisa']else'male';surface=body_surfaces[gender]
 for o in root.children:
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=2,use_grid_fill=True);bm.to_mesh(o.data);bm.free()
  offset=.022 if 'lapel'in o.name.lower()or'pocket'in o.name.lower()else .013
  for v in o.data.vertices:
   x,y,z=gc(v.co)
   if abs(x)<.30 and abs(z)>.018:
    sign=1 if z>0 else -1;hit=surface.ray_cast(Vector(cv((x,y,sign*.6))),Vector((0,sign,0)),1.2)
    if hit[0]is not None:
     edge=gc(hit[0])[2]+sign*offset;z=max(z,edge)if sign>0 else min(z,edge);v.co=cv((x,y,z))

# Conservative age rest-shapes; graying supplies the main age cue.

sculpt={}
for role,gender in [('gui','male'),('ivo','male'),('lia','female')]:
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/assets/arrival-3d/crew-{gender}-193.glb'));imported=set(bpy.data.objects)-before
 skin=next(o for o in imported if o.type=='MESH'and o.name.lower().startswith('superhero_'))
 bvh=BVHTree.FromPolygons([v.co.copy()for v in skin.data.vertices],[list(p.vertices)for p in skin.data.polygons]);top=1.810 if gender=='male'else 1.766
 changes=[]
 for v in skin.data.vertices:
  old=v.co.copy();x,y,z=old;gate=max(0,min(1,(z-(1.56 if gender=='male'else 1.52))/.04))
  cheek=math.exp(-((z-(top-.155))/.035)**2)*gate
  if role=='gui':x*=1-cheek*.035;z-=cheek*.003;y-=cheek*.003
  if role=='ivo':x*=1+cheek*.045;y-=cheek*.002
  if role=='lia':x*=1+cheek*.015
  if (Vector((x,y,z))-old).length>1e-7:changes.append({'old':gc(old),'next':[x,z,-y]})
 sculpt[role]=changes
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
(OUT/'age-shapes.json').write_text(json.dumps(sculpt),encoding='utf-8')

for root in roots:
 groups={}
 for o in list(root.children):
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
  groups.setdefault(o.data.materials[0].name,[]).append(o)
 for name,items in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0]
  if len(items)>1:bpy.ops.object.join()
  bpy.context.object.name=root.name+'__'+name
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Dante-hair-and-crew.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'looks-raw.glb'),export_format='GLB',export_animations=False,export_apply=True,export_yup=True)
print('LOOKS194',len(roots),'roots', {r:len(v)for r,v in sculpt.items()},flush=True)
