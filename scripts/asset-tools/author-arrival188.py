"""Original four-class equipment. Offline mesh export, no rendering/baking.
Reuses the established geometry helpers, not the 33-asset authoring pass.
"""
from pathlib import Path
helpers=Path('scripts/asset-tools/author-arrival186.py').read_text(encoding='utf-8').split('# Four distinct hand instruments.')[0]
helpers=helpers.replace("STAGE=ROOT/'.local/arrival186'","STAGE=ROOT/'.local/combat188'")
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

asset('weapon-warrior')
rod('Insulated palm grip',(0,0,-.125),(0,0,.11),.042,dark,vertices=12)
for z in [-.1,-.055,-.01,.035,.08]:ring('Inset grip rib',(0,0,z),.042,.004,leather,(0,0,1))
hull('Ion emitter housing',[(.09,0,0,.057,.05),(.14,0,0,.09,.065),(.21,0,0,.078,.047)],edge)
for s in [-1,1]:profile('Compact swept emitter lip',[(s*.04,.12),(s*.13,.16),(s*.115,.26),(s*.06,.24)],.07,dark,.01)
profile('Closed energy blade envelope',[(-.063,.21),(-.068,.32),(-.043,1.02),(0,1.17),(.043,1.02),(.068,.32),(.063,.21)],.043,cyan,.007)
profile('Contained bright core',[(-.016,.22),(-.019,.33),(-.012,1.04),(0,1.12),(.012,1.04),(.019,.33),(.016,.22)],.048,blade,.004)
for s in [-1,1]:path('Conductive edge rail',[(s*.069,0,.22),(s*.069,0,.37),(s*.043,0,.95)],.009,edge)
anchor('emitter',(0,0,.24));anchor('blade-base',(0,0,.25));anchor('blade-tip',(0,0,1.15))

asset('weapon-hunter')
hull('Integrated precision receiver',[(-.25,0,.14,.055,.085),(-.12,0,.15,.10,.11),(.16,0,.15,.10,.10),(.42,0,.15,.055,.065)],edge)
hull('Ceramic upper shell',[(-.21,0,.20,.05,.035),(-.06,0,.23,.09,.035),(.25,0,.22,.075,.035),(.35,0,.19,.045,.025)],paint)
box('Contoured palm grip',(0,0,0),(.075,.23,.09),dark,.025)
path('Closed trigger loop',[(-.03,.07,.045),(-.03,-.10,.08),(-.03,-.11,.18),(-.03,.09,.20)],.012,edge)
hull('Finned shoulder extension',[(-.56,0,.16,.055,.08),(-.50,0,.16,.07,.09),(-.28,0,.15,.045,.06)],dark)
box('Stock shoulder pad',(0,.16,-.56),(.14,.19,.03),leather,.008)
rod('Barrel jacket',(0,.15,.36),(0,.15,.80),.052,dark,vertices=12)
for s in [-1,1]:path('Receiver side rail',[(s*.088,.15,-.12),(s*.10,.15,.12),(s*.059,.15,.44)],.012,copper)
for z in [.43,.52,.61]:ring('Radiator collar',(0,.15,z),.06,.008,edge,(0,0,1))
hull('Recessed muzzle crown',[(.73,0,.15,.065,.06),(.83,0,.15,.065,.06),(.855,0,.15,.045,.045)],edge)
rod('Muzzle aperture',(0,.15,.847),(0,.15,.861),.034,dark,vertices=12)
rod('Muzzle charge core',(0,.15,.861),(0,.15,.866),.012,copper,vertices=10)
rod('Flush optic',(0,.285,-.035),(0,.285,.17),.034,dark)
rod('Optic glass',(0,.285,.17),(0,.285,.174),.027,cyan)
anchor('emitter',(0,.15,.875));anchor('support',(0,.10,.34))

asset('weapon-astral')
hull('Contoured focus palm',[( -.12,0,0,.035,.045),(.06,0,0,.05,.045),(.16,0,0,.045,.035)],dark)
for z in [-.075,-.02,.035]:ring('Focus insulation',(0,0,z),.041,.006,leather,(0,0,1))
for s in [-1,1]:path('Swept containment arm',[(s*.03,0,.07),(s*.14,0,.20),(s*.16,0,.37),(s*.075,0,.49)],.023,paint)
ring('Orbital stabilizer',(0,0,.32),.12,.013,edge,(0,1,0))
ellipsoid('Astral containment core',(0,0,.32),(.073,.072,.105),cyan,20,12)
for s in [-1,1]:path('Gimbal energy contact',[(s*.035,.02,.12),(s*.095,.02,.22),(s*.088,.02,.39)],.008,cyan)
anchor('emitter',(0,0,.48))

asset('weapon-xenobinder')
hull('Resonator field grip',[(-.13,0,0,.04,.035),(.07,0,0,.045,.04),(.13,0,0,.065,.05)],leather)
for z in [-.09,-.03,.03]:ring('Grip seam',(0,0,z),.042,.005,dark,(0,0,1))
hull('Seed cradle',[(.11,0,0,.06,.045),(.20,0,0,.09,.07),(.33,0,0,.07,.065),(.39,0,0,.04,.035)],edge)
ellipsoid('Bioelectric bond seed',(0,.018,.29),(.061,.067,.12),green,18,10)
for s in [-1,1]:path('Arched protective fork',[(s*.04,0,.09),(s*.11,0,.22),(s*.095,0,.43),(s*.038,0,.51)],.021,copper)
path('Field hook spine',[(0,-.048,.06),(0,-.095,.24),(0,-.07,.47),(0,0,.54)],.024,paint)
path('Wrist loop',[(0,0,-.12),(-.08,-.03,-.20),(-.10,0,-.065),(-.02,.02,-.06)],.008,dark)
anchor('emitter',(0,.02,.44))

for root in assets:
 for o in list(root.children_recursive):
  if o.type!='MESH':continue
  bpy.context.view_layer.objects.active=o
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
  for modifier in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.ops.wm.save_as_mainfile(filepath=str(STAGE/'Dante-equipment-188.blend'))
bpy.ops.export_scene.gltf(filepath=str(STAGE/'weapons-raw.glb'),export_format='GLB',export_animations=False,export_apply=True,export_extras=True,export_yup=True)
print('AUTHORED four instruments; no render pass')
