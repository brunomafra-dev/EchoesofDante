"""Original rifle revision and articulated Astral gauntlet, without rendering.
Reuses the established geometry helpers, not the 33-asset authoring pass.
"""
from pathlib import Path
helpers=Path('scripts/asset-tools/author-arrival186.py').read_text(encoding='utf-8').split('# Four distinct hand instruments.')[0]
helpers=helpers.replace("STAGE=ROOT/'.local/arrival186'","STAGE=ROOT/'.local/grips189'")
helpers=helpers.replace("curve.dimensions='3D';","curve.dimensions='3D';curve.use_fill_caps=True;")
exec(compile(helpers,'scripts/asset-tools/author-arrival186.py','exec'))

def anchor(name,p):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=current;o.location=cv(p)
def hull(name,sections,m,n=12):
 verts=[]
 for z,x,y,rx,ry in sections:
  for i in range(n):
   a=i/n*math.pi*2;verts.append((x+math.cos(a)*rx,y+math.sin(a)*ry,z))
 faces=[tuple(reversed(range(n))),tuple(range((len(sections)-1)*n,len(sections)*n))]
 for j in range(len(sections)-1):
  for i in range(n):a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 return mesh(name,verts,faces,m,.008,True)

asset('weapon-hunter')
hull('Integrated precision receiver',[(-.25,0,.14,.055,.085),(-.12,0,.15,.10,.11),(.16,0,.15,.10,.10),(.42,0,.15,.055,.065)],edge)
hull('Ceramic upper shell',[(-.21,0,.20,.05,.035),(-.06,0,.23,.09,.035),(.25,0,.22,.075,.035),(.35,0,.19,.045,.025)],paint)
box('Contoured palm grip',(0,0,0),(.06,.23,.09),dark,.025)
path('Closed trigger loop',[(0,.095,.05),(0,.005,.065),(0,.005,.18),(0,.11,.20)],.012,edge)
path('Recessed trigger',[(.03,.088,.055),(.03,.035,.073)],.007,dark)
hull('Finned shoulder extension',[(-.36,0,.16,.055,.08),(-.32,0,.16,.07,.09),(-.23,0,.15,.045,.06)],dark)
box('Stock shoulder pad',(0,.16,-.36),(.14,.19,.03),leather,.008)
rod('Barrel jacket',(0,.15,.36),(0,.15,.80),.052,dark,vertices=12)
for s in [-1,1]:path('Receiver side rail',[(s*.088,.15,-.12),(s*.10,.15,.12),(s*.059,.15,.44)],.012,copper)
for z in [.43,.52,.61]:ring('Radiator collar',(0,.15,z),.06,.008,edge,(0,0,1))
hull('Recessed muzzle crown',[(.73,0,.15,.065,.06),(.83,0,.15,.065,.06),(.855,0,.15,.045,.045)],edge)
rod('Muzzle aperture',(0,.15,.847),(0,.15,.861),.034,dark,vertices=12)
rod('Muzzle charge core',(0,.15,.861),(0,.15,.866),.012,copper,vertices=10)
rod('Flush optic',(0,.285,-.035),(0,.285,.17),.034,dark)
rod('Optic glass',(0,.285,.17),(0,.285,.174),.027,cyan)
rod('Contoured support grip',(0,.015,.08),(0,.015,.25),.032,dark,vertices=12)
anchor('emitter',(0,.15,.875));anchor('support',(0,.015,.14))


# Coordinates are the actual hand_r bind space: +Y fingers, +X dorsum,
# +Z thumb side. Palm is -X. Open-finger gauntlet, not a handheld focus.
def cuff(name,y,rx,rz,thickness,m):
 verts=[];n=24
 for yy in [y-.012,y+.012]:
  for a,b in [(rx,rz),(rx-thickness,rz-thickness)]:
   for i in range(n):
    angle=i/n*math.tau;verts.append((math.cos(angle)*a,yy,math.sin(angle)*b))
 faces=[]
 for i in range(n):
  j=(i+1)%n
  faces.extend([(i,j,48+j,48+i),(24+j,24+i,72+i,72+j),(j,i,24+i,24+j),(48+i,48+j,72+j,72+i)])
 return mesh(name,verts,faces,m,.0015,True)
asset('astral-bracer')
cuff('Open wrist cuff',-.012,.037,.048,.007,dark)
cuff('Brushed cuff rim',-.024,.039,.050,.005,edge)
cuff('Forearm seal',-.105,.039,.053,.007,dark)
def shell_plate(name,sections):
 verts=[];n=12
 for y,r,z in sections:
  for i in range(n+1):
   a=-1.32+2.64*i/n;verts.append((r*math.cos(a),y,z*math.sin(a)))
 faces=[(j*(n+1)+i,j*(n+1)+i+1,(j+1)*(n+1)+i+1,(j+1)*(n+1)+i)for j in range(len(sections)-1)for i in range(n)]
 o=mesh(name,verts,faces,paint,.002,True)
 mod=o.modifiers.new('Armor thickness','SOLIDIFY');mod.thickness=.006
shell_plate('Articulated forearm shell',[(-.12,.044,.058),(-.035,.041,.053),(-.005,.038,.050)])
for z in [-.034,.034]:path('Forearm conduit',[(.035,-.103,z),(.041,-.06,z),(.035,-.02,z)],.003,cyan)
asset('weapon-astral')
shell_plate('Separate dorsal hand plate',[(.008,.038,.050),(.048,.036,.050),(.104,.027,.045)])
for z in [-.033,.033]:path('Dorsal wrist conduit',[(.036,.014,z),(.037,.045,z),(.028,.085,z*.85)],.003,cyan)
# Low profile back-of-hand reactor with protected bezel.
rod('Dorsal emitter housing',(.029,.058,0),(.043,.058,0),.025,edge,vertices=16)
rod('Dorsal energy lens',(.043,.058,0),(.046,.058,0),.018,cyan,vertices=16)
# Thin palm pad hugs the skin; fingers and knuckles remain exposed.
ellipsoid('Flexible palm pad',(-.025,.065,.004),(.007,.028,.026),dark,16,8)
rod('Palm aperture rim',(-.030,.068,.004),(-.037,.068,.004),.017,edge,vertices=16)
rod('Palm channel lens',(-.037,.068,.004),(-.039,.068,.004),.012,cyan,vertices=16)
for z in [-.044,.044]:path('Side fastening',[(.019,-.017,z),(-.012,-.014,z),(-.024,.015,z*.9)],.004,copper)
anchor('emitter',(-.045,.068,.004))
anchor('wrist',(0,0,0))
anchor('palm',(-.025,.065,.004))

for root in assets:
 for o in list(root.children_recursive):
  if o.type!='MESH':continue
  bpy.context.view_layer.objects.active=o
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
  for modifier in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.ops.wm.save_as_mainfile(filepath=str(STAGE/'Dante-gauntlet-189.blend'))
bpy.ops.export_scene.gltf(filepath=str(STAGE/'weapons-raw.glb'),export_format='GLB',export_animations=False,export_apply=True,export_extras=True,export_yup=True)
print('AUTHORED open-finger astral gauntlet; no render pass')
