"""Offline authored arrival assets. Blender 4.5 LTS, no external add-ons/assets.
Run blender --background --factory-startup --python scripts/asset-tools/author-arrival186.py
Coordinates in helpers use the game's X/right, Y/up, Z/forward convention.
"""
import bpy, bmesh, math, random, json, hashlib
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/assets/arrival-3d'
STAGE=ROOT/'.local/arrival186'; STAGE.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(186)
def cv(p): return (p[0],-p[2],p[1])
def linear(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def color(hex): return tuple(linear(int(hex[i:i+2],16)/255) for i in (1,3,5))+(1,)
def mat(name,hex,metal=0,rough=.7,emit=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color(hex)
    p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    if emit:p.inputs['Emission Color'].default_value=color(hex);p.inputs['Emission Strength'].default_value=emit
    return m
paint=mat('Ceramic painted alloy','#a7b2ad',.45,.5)
edge=mat('Exposed brushed steel','#707e7c',.8,.36)
dark=mat('Graphite rubber and understructure','#283536',.22,.78)
copper=mat('Worn orange safety enamel','#b97a3c',.5,.48)
blade=mat('Ground blade bevel','#bdcfca',.88,.27)
leather=mat('Wrapped grip and belts','#51483a',0,.9)
glass=mat('Smoked cockpit glass','#1d3942',.62,.18)
cyan=mat('Contained ion conduit','#65c6cd',.45,.32,1.1)
green=mat('Living amber bioelectric tissue','#a2bb73',.12,.45,.6)
amber=mat('Hollow sensory amber','#c48d36',.2,.38,.5)
cloth=mat('Weathered field canvas','#797560',0,.94)
cream=mat('Medical ivory fabric','#d1d6c2',0,.95)
medical=mat('Medical muted red','#994f40',0,.7)
shell=mat('Hollow layered basal carapace','#696d61',.05,.9)
ridge=mat('Carapace exposed ridges','#8c8c75',.08,.81)
skin=mat('Hollow flexible connective tissue','#343e34',0,.92)
petHide=mat('Companion mottled hide','#69755b',0,.95)
petArmor=mat('Companion horn and scutes','#a19772',0,.84)
soil=mat('Plant substrate','#393d29',0,1)
leaf=mat('Cultivated leaf','#6e884a',0,.95)
MATERIALS=[paint,edge,dark,copper,blade,leather,glass,cyan,green,amber,cloth,cream,medical,shell,ridge,skin,petHide,petArmor,soil,leaf]

# Small, shared baked maps: seeded pores and anisotropic abrasion, no shader
# noise generation or online authoring at runtime. UV remains deterministic.
def texture(name,kind):
    n=256;image=bpy.data.images.new(name,width=n,height=n,alpha=True)
    pixels=[]; rng=random.Random(186 if kind=='surface' else 187)
    for y in range(n):
        for x in range(n):
            noise=rng.random();scratch=(x%61<1 and 35<y%117<90)
            if kind=='surface':v=.86+noise*.12-(.16 if scratch else 0)
            else:v=.65+noise*.25+(.1 if scratch else 0)
            pixels.extend((v,v,v,1))
    image.pixels=pixels;image.filepath_raw=str(STAGE/(name+'.png'));image.file_format='PNG';image.save();image.pack()
    return image
surface=texture('Dante186-surface','surface');roughMap=texture('Dante186-roughness','rough')
for m in MATERIALS:
    if m in [cyan,green,amber,glass]:continue
    nodes=m.node_tree.nodes;links=m.node_tree.links;p=nodes.get('Principled BSDF')
    tex=nodes.new('ShaderNodeTexImage');tex.image=surface
    multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1
    multiply.inputs[1].default_value=p.inputs['Base Color'].default_value
    # glTF exports image base-color directly; tint is set on the material after
    # export by the optimizer, avoiding nonportable procedural material nodes.
    links.new(tex.outputs['Color'],p.inputs['Base Color'])
    rough=nodes.new('ShaderNodeTexImage');rough.image=roughMap
    links.new(rough.outputs['Color'],p.inputs['Roughness'])
    m['danteTint']=list(multiply.inputs[1].default_value)
    nodes.remove(multiply)

current=None;assets=[]
def asset(name):
    global current
    current=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(current);assets.append(current);return current
def finish(o,name,m,bevel=0,smooth=False):
    o.name=name;o.parent=current;o.data.materials.append(m)
    if bevel:
        modifier=o.modifiers.new('Manufactured edge radius','BEVEL');modifier.width=bevel;modifier.segments=2
    if smooth:
        for f in o.data.polygons:f.use_smooth=True
    return o
def mesh(name,vertices,faces,m,bevel=0,smooth=False):
    data=bpy.data.meshes.new(name);data.from_pydata([cv(p) for p in vertices],[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);finish(o,name,m,bevel,smooth)
    # Box projection with repeatable surface scale; seam detail lives in mesh.
    uv=data.uv_layers.new(name='SurfaceUV')
    for poly in data.polygons:
        axis=max(range(3),key=lambda i:abs(poly.normal[i]))
        a,b=[i for i in range(3) if i!=axis]
        for li in poly.loop_indices:
            p=data.vertices[data.loops[li].vertex_index].co;uv.data[li].uv=(p[a]*.8,p[b]*.8)
    return o
def box(name,p,size,m,bevel=.035):
    bpy.ops.mesh.primitive_cube_add(size=1,location=cv(p));o=bpy.context.object
    o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,m,min(bevel,min(size)*.25))
def ellipsoid(name,p,size,m,segments=16,rings=10):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=cv(p));o=bpy.context.object
    o.scale=(size[0],size[2],size[1]);return finish(o,name,m,smooth=True)
def rod(name,a,b,r,m,r2=None,vertices=12):
    a,b=Vector(cv(a)),Vector(cv(b));delta=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r,radius2=r if r2 is None else r2,depth=delta.length,location=(a+b)*.5)
    o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=delta.to_track_quat('Z','Y');return finish(o,name,m,smooth=True)
def path(name,points,r,m):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=6;curve.bevel_depth=r;curve.bevel_resolution=2 if r>=.06 else 1
    s=curve.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):p.co=cv(co);p.handle_left_type=p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.parent=current;curve.materials.append(m)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False);return o
def ring(name,p,r,minor,m,axis=(0,1,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=24,minor_segments=6,location=cv(p),major_radius=r,minor_radius=minor)
    o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=Vector(cv(axis)).to_track_quat('Z','Y');return finish(o,name,m,smooth=True)
def profile(name,points,depth,m,bevel=.01):
    # Profile X/Z with thickness along Y; good for forged blades and receivers.
    n=len(points);verts=[(x,y,z) for y in [-depth/2,depth/2] for x,z in points]
    return mesh(name,verts,[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],m,bevel)
def bolt(p,r=.035):rod('Flush fastener',(p[0],p[1]-.015,p[2]),(p[0],p[1]+.015,p[2]),r,edge,vertices=8)

# Four distinct hand instruments. Grip origin is shared, positive Z is forward.
asset('weapon-warrior')
profile('Forged tapered double bevel',[(-.075,.08),(-.11,.25),(-.09,.77),(0,1.01),(.09,.77),(.11,.25),(.075,.08)],.045,blade,.008)
profile('Recessed spine',[(-.025,.12),(-.035,.72),(0,.93),(.035,.72),(.025,.12)],.058,edge,.004)
profile('Curved impact guard',[(-.21,.03),(-.23,.10),(-.13,.15),(-.08,.10),(.08,.10),(.13,.15),(.23,.1),(.21,.03)],.075,copper,.012)
rod('Grip core',(0,0,-.24),(0,0,.04),.045,dark)
for z in [-.215,-.17,-.125,-.08,-.035]:ring('Leather grip binding',(0,0,z),.043,.009,leather,(0,0,1))
ellipsoid('Counterweight',(0,0,-.29),(.07,.05,.055),copper)
path('Ion channel',[(-.031,.031,.19),(-.031,.031,.66),(0,.031,.81)],.008,cyan)
for x in [-.16,.16]:bolt((x,.043,.085),.018)

asset('weapon-hunter')
profile('Sculpted rifle receiver',[(-.065,-.18),(-.11,-.04),(-.09,.28),(-.055,.37),(.055,.37),(.09,.28),(.11,-.04),(.065,-.18)],.12,edge,.025)
rod('Coaxial barrel',(0,0,.22),(0,0,.69),.035,blade)
rod('Muzzle shroud',(0,0,.62),(0,0,.77),.07,dark)
ring('Muzzle crown',(0,0,.77),.055,.012,copper,(0,0,1))
profile('Open shoulder stock',[(-.055,-.13),(-.08,-.45),(-.035,-.52),(.07,-.51),(.09,-.39),(.025,-.34),(.03,-.16)],.08,dark,.018)
box('Recoil pad',(0,0,-.51),(.15,.12,.04),leather)
path('Trigger guard',[(-.045,-.1,-.18),(-.045,-.21,-.1),(.035,-.21,-.02),(.05,-.09,.02)],.012,edge)
box('Pistol grip',(0,-.16,-.16),(.075,.19,.09),leather,.025)
rod('Optic',(0,.13,-.05),(0,.13,.18),.055,dark)
rod('Objective lens',(0,.13,.175),(0,.13,.19),.043,cyan)
for z in [.25,.31,.37,.43,.49]:ring('Vented barrel collar',(0,0,z),.057,.009,copper,(0,0,1))
for x in [-.086,.086]:path('Receiver cooling conduit',[(x,.035,-.07),(x,.035,.06),(x*.7,.035,.18)],.008,cyan)

asset('weapon-astral')
rod('Focus grip',(0,0,-.21),(0,0,.025),.035,dark)
for z in [-.18,-.12,-.06]:ring('Insulated grip',(0,0,z),.037,.008,leather,(0,0,1))
ring('Gimbal outer',(0,0,.22),.19,.025,edge,(1,0,0));ring('Gimbal brass inner',(0,0,.22),.14,.018,copper,(0,1,0))
ellipsoid('Contained astral seed',(0,0,.22),(.065,.065,.10),cyan)
for side in [-1,1]:path('Curved containment fork',[(side*.025,0,0),(side*.16,0,.10),(side*.20,0,.25),(side*.11,0,.39)],.023,blade)

asset('weapon-xenobinder')
rod('Baton wrapped grip',(0,0,-.24),(0,0,.05),.04,leather)
for z in [-.21,-.15,-.09]:ring('Grip binding',(0,0,z),.041,.008,dark,(0,0,1))
path('Hooked field instrument',[(0,0,.01),(.025,0,.27),(.12,0,.41),(.21,0,.43),(.24,0,.34)],.037,edge)
ellipsoid('Living emitter',(0,0,.22),(.07,.065,.12),green)
for z in [.13,.22,.31]:ring('Protective emitter cage',(0,0,z),.078,.012,copper,(0,0,1))
path('Wrist retention strap',[(0,0,-.23),(-.1,-.02,-.31),(-.09,-.01,-.12),(0,0,-.12)],.012,leather)

# Role clothing is fitted in standing avatar metres; runtime attaches at spine.
for role in ['lia','ivo','nara','gui','elisa']:
    asset('uniform-'+role)
    if role in ['lia','ivo','elisa']:
        m=cream if role=='lia' else leather if role=='ivo' else cloth
        vertices=[(-.19,1.44,.17),(.19,1.44,.17),(.20,.84,.15),(-.20,.84,.15),(-.18,1.43,.13),(.18,1.43,.13),(.19,.84,.11),(-.19,.84,.11)]
        mesh('Tailored work apron',vertices,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(3,2,6,7),(0,3,7,4),(1,5,6,2)],m,.014)
        for x in [-.13,.13]:box('Apron stitched pocket',(x,1.06,.18),(.16,.16,.025),m,.016)
        for side in [-1,1]:path('Shoulder strap',[(side*.14,1.38,.18),(side*.17,1.56,.08),(side*.16,1.48,-.12)],.018,m)
    belt=ring('Continuous waist belt',(0,1.10,0),.18,.023,leather);belt.scale.y=.74
    for side in [-1,1]:box('Belt utility pouch',(side*.17,1.04,-.04),(.12,.17,.13),leather,.025)
    if role=='lia':
        box('Medical vertical badge',(-.12,1.33,.198),(.035,.12,.015),medical,.001);box('Medical horizontal badge',(-.12,1.33,.20),(.10,.035,.015),medical,.001)
        for x in [.08,.12,.16]:rod('Sterile instruments',(x,1.05,.205),(x,1.22,.205),.009,blade)
    if role in ['ivo','gui']:
        for x in [-.11,0,.11]:rod('Belt repair tools',(x,1.00,.20),(x,1.20,.20),.012,edge)
        path('Utility sling',[(-.19,1.5,.13),(0,1.30,.21),(.20,1.08,.15)],.025,leather)
    if role=='nara':
        path('Survey harness',[(-.2,1.5,.14),(-.05,1.18,.2),(.2,1.00,.12)],.027,leather)
        for x in [-.055,.055]:rod('Binocular survey lenses',(x,1.27,.20),(x,1.27,.32),.045,dark)
        rod('Rolled field map',(-.28,.94,-.02),(-.28,1.28,-.02),.05,cream)
    if role=='elisa':
        for x in [-.12,.10]:ellipsoid('Seed sachets',(x,1.01,.21),(.06,.07,.025),copper)
    if role=='gui':
        box('Reinforced shoulder pad',(.23,1.48,-.01),(.17,.10,.23),leather)
    asset('tool-'+role)
    if role in ['ivo','gui']:
        rod('Hammer ash handle',(0,0,-.17),(0,0,.19),.025,leather)
        rod('Hammer striking head',(-.10,0,.18),(.09,0,.18),.05,edge)
        box('Hammer squared face',(-.105,0,.18),(.035,.095,.095),blade,.008)
        if role=='gui':path('Curved claw',[(.09,0,.18),(.15,0,.16),(.17,0,.09)],.018,edge)
    elif role=='lia':
        rod('Medical injector barrel',(0,0,-.10),(0,0,.11),.018,glass)
        rod('Fine steel needle',(0,0,.11),(0,0,.18),.003,blade)
        rod('Injector plunger',(0,0,-.16),(0,0,-.1),.01,blade)
    elif role=='nara':
        profile('Survey slate',[(-.10,-.12),(-.12,.13),(.10,.14),(.11,-.12)],.02,dark,.008)
        box('Slate reading surface',(0,.015,.01),(.17,.005,.20),glass,.001)
    else:
        rod('Watering vessel',(0,0,-.05),(0,.18,-.05),.105,edge)
        path('Watering spout',[(.06,.04,-.03),(.19,.05,.08),(.24,.16,.14)],.018,edge)
        ring('Watering handle',(-.08,.14,-.05),.09,.012,leather,(0,0,1))

# Aerodynamic pressure hull built from lofted sections, not a scaled box.
def loft(name,sections,m,n=20):
    verts=[]
    for x,cy,ry,rz in sections:
        for i in range(n):
            a=i/n*math.tau;verts.append((x,cy+math.sin(a)*ry,math.cos(a)*rz))
    faces=[tuple(reversed(range(n))),tuple(range((len(sections)-1)*n,len(sections)*n))]
    faces.extend((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(sections)-1) for i in range(n))
    return mesh(name,verts,faces,m,smooth=True)
asset('shuttle')
sections=[(-5.6,2.1,.55,1.25),(-5.25,2.1,.80,1.55),(-4.5,2.1,1.08,1.83),(-2.5,2.1,1.15,1.85),(-.2,2.1,1.15,1.85),(1.85,2.1,1.12,1.8),(3.5,2.0,.92,1.42),(5.15,1.95,.5,.70),(5.85,1.95,.19,.30)]
loft('DANTE pressure hull',sections,paint,24)
loft('Reinforced keel',[(-5.2,1.65,.40,.9),(-4.2,1.35,.46,1.35),(1.8,1.34,.44,1.45),(4.8,1.65,.33,.65)],dark,12)
# Curved glass follows the actual loft, clear of its upper surface.
def section_at(x):
    for a,b in zip(sections,sections[1:]):
        if a[0]<=x<=b[0]:
            t=(x-a[0])/(b[0]-a[0]);return tuple(a[i]+(b[i]-a[i])*t for i in (1,2,3))
for side in [-1,1]:
    xs=[2.1,2.5,2.9,3.3,3.7,4.1,4.5,4.9];fs=[.055,.17,.29,.41,.53,.65,.72];verts=[]
    for x in xs:
        cy,ry,rz=section_at(x)
        for f in fs:verts.append((x,cy+ry*math.sqrt(1-f*f)+.035,side*rz*f))
    faces=[]
    for r in range(len(xs)-1):
        for c in range(len(fs)-1):
            q=(r*len(fs)+c,r*len(fs)+c+1,(r+1)*len(fs)+c+1,(r+1)*len(fs)+c)
            faces.append(q if side>0 else tuple(reversed(q)))
    mesh('Curved laminated windshield',verts,faces,glass,smooth=True)
    for indices in [[r*len(fs) for r in range(len(xs))],[r*len(fs)+len(fs)-1 for r in range(len(xs))],list(range(len(fs))),list(range((len(xs)-1)*len(fs),len(xs)*len(fs)))]:
        path('Cockpit structural rim',[verts[i] for i in indices],.025,edge)
    path('Cockpit window mullion',[verts[3*len(fs)+i] for i in range(len(fs))],.018,edge)
for side in [-1,1]:
    path('Recessed side rail',[(-4.9,1.7,side*1.40),(-4.1,1.6,side*1.77),(.2,1.6,side*1.79),(2.7,1.55,side*1.44)],.065,edge)
    # Following hull curves: panel seams with narrow safety strip beside them.
    for x in ([-4.3,-2.6,-.4,1.7] if side>0 else []):
        pts=[(x,2.1+math.sin(a)*1.155,math.cos(a)*1.87) for a in [i*math.pi/12 for i in range(25)]]
        path('Pressure section seam',pts,.017,dark)
    # Engines retain exactly the previous solid envelope.
    z=side*2.85
    rod('Engine pressure barrel',(-3.7,2.1,z),(1.3,2.1,z),.76,paint,vertices=24)
    for x in [-3.7,1.3]:
        ring('Nacelle collar',(x,2.1,z),.78,.055,copper,(1,0,0))
        rod('Recessed engine aperture',(x-.035,2.1,z),(x+.035,2.1,z),.64,dark,vertices=24)
        for i in range(9):
            a=i/9*math.tau
            rod('Intake stator',(x+.05,2.1+math.sin(a)*.18,z+math.cos(a)*.18),(x+.05,2.1+math.sin(a+.22)*.57,z+math.cos(a+.22)*.57),.022,edge)
        rod('Engine hub',(x-.08,2.1,z),(x+.08,2.1,z),.17,edge)
    for x in [-2.9,-2.55,-2.2,-1.85]:box('Engine heat shield vent',(x,2.86,z),(.18,.05,.64),dark,.025)
    path('Protected engine umbilical',[(-3.3,2.5,side*1.7),(-3.0,2.55,side*2.1),(-2.8,2.4,z)],.10,dark)
    box('Engine mount',(-1.2,2.15,side*2.1),(4,.27,.9),edge,.09)
    for x in [-3.7,4.4]:
        rod('Landing hydraulic piston',(x,1.3,side*(.8 if x>0 else 1.6)),(x-.3,.3,side*2.05),.13,edge)
        rod('Piston sleeve',(x,1.3,side*(.8 if x>0 else 1.6)),(x-.15,.8,side*(1.4 if x>0 else 1.82)),.19,dark)
        box('Landing pad',(x-.3,.16,side*2.05),(1.1,.22,.85),dark,.09)
        for dx in [-.27,.27]:bolt((x-.3+dx,.28,side*2.05),.06)
    # Orange spine strips are fitted, short and directional.
    path('DANTE safety enamel',[(-4.7,2.68,side*1.53),(-3.8,2.84,side*1.41),(1.3,2.84,side*1.38)],.08,copper)
box('Side hatch recess',(2.8,1.75,1.65),(1.35,1.8,.11),dark,.14)
box('Hatch threshold bridge',(2.8,.93,1.98),(1.4,.12,.70),dark,.025)
for dx in [-.68,.68]:path('Hatch frame',[(2.8+dx,.92,1.70),(2.8+dx,2.45,1.70),(2.8+dx*.8,2.55,1.70)],.055,edge)
box('Hatch status bar',(3.35,1.9,1.73),(.035,.45,.025),cyan,.008)
# Same slope and footprint as World.floorHeight, treads land on that plane.
mesh('Boarding ramp',[(-.7,.99,2.25),(.7,.99,2.25),(.7,.095,5.05),(-.7,.095,5.05),(-.7,.85,2.25),(.7,.85,2.25),(.7,0,5.05),(-.7,0,5.05)],[(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)],dark,.02).location.x=2.8
for i in range(8):
    z=2.3+i*.34;box('Anti slip ramp tread',(2.8,.99-i*.108,z),(1.25,.035,.08),edge,.008)
for side in [-1,1]:path('Ramp edge rail',[(2.8+side*.67,1.03,2.27),(2.8+side*.67,.16,4.98)],.028,copper)
for x in [-2.9,-1.9,-.9]:box('Dorsal service access',(x,3.27,0),(.67,.07,.7),dark,.035)

# Shelters keep the exact footprint and opaque solidity of the existing bases.
for role in ['lia','ivo','nara']:
    asset('station-'+role)
    box('Anchored floor',(0,.15,0),(4.5,.3,2.8),dark,.09)
    # Rounded shoulder panels, seams and vents break the old rectangular slab.
    loft('Rounded habitat shell',[(-2.15,1.40,1.22,1.08),(-1.95,1.40,1.30,1.12),(1.95,1.40,1.30,1.12),(2.15,1.40,1.22,1.08)],paint,16)
    box('Front door recess',(0,1.24,1.11),(1.55,2.12,.06),dark,.15)
    for side in [-1,1]:
        path('Habitat protective frame',[(side*2.03,.27,.9),(side*2.03,1.45,1.18),(side*2.03,2.50,.7),(side*2.03,2.68,-.2)],.065,copper)
        for y in [.65,.80,.95]:box('Recessed ventilation',(side*1.48,y,1.07),(.55,.05,.045),dark,.012)
        box('Ground anchor',(side*2.0,.25,1.2),(.34,.12,.34),edge,.025)
    # A tensioned fabric roof with a visible ridge, seams, sewn border and poles.
    roof=[(-2.30,2.50,-.2),(-2.30,2.45,2.4),(0,2.65,-.2),(0,2.60,2.4),(2.30,2.50,-.2),(2.30,2.45,2.4)]
    awning=mesh('Tensioned field awning',roof,[(0,1,3,2),(2,3,5,4)],cloth)
    awning.modifiers.new('Sewn fabric thickness','SOLIDIFY').thickness=.012
    for side in [-1,1]:
        rod('Awning telescoping pole',(side*2.05,0,2.25),(side*2.05,2.45,2.25),.035,edge)
        path('Stitched awning edge',[(side*2.3,2.50,-.2),(side*2.3,2.45,2.4)],.018,leather)
    box('Task light',(0,2.18,1.14),(1.2,.035,.04),cyan,.005)
    if role=='lia':
        box('Medical sign vertical',(-1.3,1.65,1.09),(.09,.42,.025),medical,.001);box('Medical sign horizontal',(-1.3,1.65,1.10),(.33,.09,.025),medical,.001)
    if role=='nara':ring('Expedition direction emblem',(-1.3,1.7,1.1),.20,.02,copper,(0,0,1))
    if role=='ivo':
        rod('Workshop wrench emblem',(-1.35,1.5,1.11),(-1.15,1.9,1.11),.035,edge)
        ring('Workshop emblem jaw',(-1.14,1.92,1.11),.09,.025,edge,(0,0,1))

for role in ['lia','ivo','nara','repair']:
    asset('bench-'+role)
    box('Rolled worktop',(0,.86,0),(1.8,.12,.75),edge,.04)
    for x in [-.7,.7]:
        for z in [-.24,.24]:rod('Tubular bench leg',(x,.04,z),(x,.84,z),.035,dark)
        rod('Bench foot',(x-.12,.04,0),(x+.12,.04,0),.045,dark)
    box('Lower shelf',(0,.24,0),(1.45,.045,.55),dark,.02)
    if role=='lia':
        box('Sterile instrument tray',(.35,.96,0),(.55,.025,.36),blade,.04)
        for i in range(3):
            x=-.58+i*.19;rod('Sample vial',(x,.94,0),(x,1.14,0),.045,glass);rod('Vial cap',(x,1.14,0),(x,1.17,0),.052,cream)
        ellipsoid('Treatment cushion',(.35,.99,0),(.21,.035,.11),cream)
        for i in range(3):rod('Tray instruments',(.15+i*.12,.99,-.12),(.15+i*.12,.99,.06),.007,blade)
    elif role=='ivo':
        profile('Anvil horn',[(-.42,-.07),(-.30,-.17),(.18,-.17),(.4,-.02),(.2,.10),(-.2,.10)],.17,edge,.02).location=Vector(cv((0,1,0)))
        profile('Blade under repair',[(-.035,-.3),(-.06,.23),(0,.4),(.06,.23),(.035,-.3)],.025,blade,.004).location=Vector(cv((0,1.10,0)))
        box('Tool vise base',(-.58,.98,0),(.28,.10,.36),dark,.02)
        rod('Vise handle',(-.75,.99,0),(-.40,.99,0),.02,edge)
    elif role=='nara':
        box('Opened terrain chart',(0,.94,0),(1.35,.018,.57),cream,.004)
        for i in range(5):path('Chart contour line',[(-.55,.954,-.18+i*.075),(-.15,.954,-.12+i*.075),(.15,.954,-.18+i*.075),(.52,.954,-.10+i*.075)],.006,cloth)
        ring('Field compass',(.45,.99,.05),.11,.018,copper)
        rod('Map roll',(-.65,.97,-.26),(.65,.97,-.26),.035,leather)
    else:
        rod('Coupling body',(-.32,1.03,0),(.25,1.03,0),.12,edge)
        for x in [-.30,.22]:ring('Repair coupling flange',(x,1.03,0),.15,.025,copper,(1,0,0))
        path('Repair umbilical',[(.22,1.03,0),(.48,1.0,.04),(.56,.9,.22)],.025,dark)

asset('planter')
box('Cultivation tray',(0,.12,0),(1.45,.20,.70),dark,.06)
for x in [-.70,.70]:box('Planter end wall',(x,.36,0),(.07,.50,.70),paint,.025)
for z in [-.32,.32]:box('Planter sidewall',(0,.36,z),(1.42,.50,.07),paint,.025)
box('Living substrate',(0,.54,0),(1.30,.07,.54),soil,.015)
for i in range(7):
    x=-.55+i*.18
    rod('Young crop stem',(x,.58,0),(x,.86,0),.012,leaf)
    for side in [-1,1]:
        leaflet=mesh('Cultivated oval leaf',[(x,.71,0),(x+side*.11,.76,-.05),(x+side*.17,.78,.01),(x+side*.07,.75,.07)],[(0,1,2,3)],leaf)
        leaflet.modifiers.new('Leaf thickness','SOLIDIFY').thickness=.004
asset('supply-case')
box('Sealed supply case',(0,.35,0),(1.30,.70,.80),dark,.10)
box('Raised case lid',(0,.71,0),(1.28,.09,.78),paint,.045)
for x in [-.53,.53]:
    for z in [-.31,.31]:box('Impact corner',(x,.38,z),(.18,.68,.18),copper,.035)
    box('Case latches',(x,.57,.41),(.10,.19,.05),edge,.01)
path('Recessed carrying handle',[(-.15,.39,.41),(-.15,.48,.46),(.15,.48,.46),(.15,.39,.41)],.018,edge)
asset('mechanism')
loft('Weathered pedestal',[(-.44,.35,.35,.30),(-.30,.55,.50,.30),(.30,.55,.50,.30),(.44,.35,.35,.30)],shell,10)
ring('Ancient radial dial',(0,.89,.32),.27,.055,ridge,(0,0,1))
for i in range(8):
    a=i/8*math.tau;rod('Dial radial marking',(math.cos(a)*.19,.89+math.sin(a)*.19,.35),(math.cos(a)*.24,.89+math.sin(a)*.24,.35),.012,cyan)
ellipsoid('Resonant mineral seat',(0,.89,.34),(.10,.10,.04),cyan)

# Hollow: flattened, layered armoured six-legged animal with recessed eye.
# Parts are authored separately for instanced, articulated runtime locomotion.
asset('hollow-body')
ellipsoid('Continuous connective body',(0,.54,-.05),(.46,.31,.67),skin,20,12)
for i in range(5):
    z=-.54+i*.23
    # Asymmetric overlapping curved shields instead of five flat cubes.
    for side in [-1,1]:
        verts=[(0,.88,z-.11),(side*.28,.84,z-.19),(side*.51,.59,z-.09),(side*.47,.46,z+.11),(side*.24,.76,z+.15),(0,.83,z+.16)]
        scute=mesh('Overlapping basalt scute',verts,[(0,1,2,3,4,5)],shell,smooth=True)
        scute.modifiers.new('Scute thickness','SOLIDIFY').thickness=.035
        path('Scute weathered raised rim',[(0,.89,z-.11),(side*.26,.85,z-.18),(side*.49,.61,z-.08)],.025,ridge)
        rod('Lateral defensive spur',(side*.42,.65,z),(side*.64,.70,z-.18),.07,ridge,.005)
ellipsoid('Recessed sensory head',(0,.46,.62),(.29,.25,.26),shell)
ellipsoid('Dark eye socket',(0,.49,.83),(.18,.14,.055),skin)
for side in [-1,1]:
    path('Sensory brow',[(side*.22,.54,.74),(side*.14,.67,.78),(0,.68,.82)],.032,ridge)
    path('Hooked mandible',[(side*.16,.30,.75),(side*.19,.25,.9),(side*.08,.26,1.01)],.038,ridge)
    path('Sensory feeler',[(side*.15,.61,.78),(side*.22,.75,.95),(side*.30,.73,1.03)],.013,skin)
asset('hollow-upper');rod('Shouldered leg', (0,-.5,0),(0,.5,0),.11,shell,.07);ellipsoid('Hip hinge',(0,-.43,0),(.14,.13,.12),skin)
asset('hollow-lower');rod('Tapered shin',(0,-.5,0),(0,.5,0),.025,ridge,.065);path('Shin ridge',[(0,-.48,.025),(.04,0,.065),(0,.45,.065)],.012,shell)
asset('hollow-foot');path('Ground gripping claw',[(0,.1,0),(0,.035,.09),(0,.015,.20)],.025,ridge)

# Companion is a low four-legged native runner: long muzzle and tail, no eye orb.
asset('pet-body')
ellipsoid('Runner torso',(0,.56,-.08),(.33,.28,.69),petHide,20,12)
ellipsoid('Shoulder withers',(0,.66,.34),(.36,.33,.33),petHide)
ellipsoid('Neck',(0,.72,.55),(.22,.25,.3),petHide)
ellipsoid('Long muzzle',(0,.66,.79),(.19,.14,.32),petHide)
ellipsoid('Nose',(0,.66,1.04),(.12,.07,.045),skin)
for i in range(4):ellipsoid('Flexible dorsal scute',(0,.82-i*.018,.22-i*.24),(.24,.085,.17),petArmor)
for side in [-1,1]:
    rod('Alert ear',(side*.16,.78,.59),(side*.22,1.03,.55),.09,petHide,.006)
    ellipsoid('Paired eye',(side*.17,.76,.77),(.025,.028,.018),amber)
path('Tapered balancing tail',[(0,.52,-.67),(0,.49,-.93),(.12,.58,-1.19),(.22,.71,-1.32)],.065,petHide)
asset('pet-upper');rod('Muscular thigh',(0,-.5,0),(0,.5,0),.08,petHide,.12)
asset('pet-lower');rod('Runner hock',(0,-.5,0),(0,.5,0),.04,petHide,.06)
asset('pet-foot');ellipsoid('Weight bearing paw',(0,.05,.065),(.10,.06,.14),petHide)
for x in [-.06,0,.06]:rod('Short claw',(x,.04,.15),(x,.025,.23),.012,petArmor,.003)

# Apply modifiers and merge objects by material inside each authored asset.
# This keeps scene roots meaningful and runtime meshes shared/mergeable.
for root in assets:
    bpy.ops.object.select_all(action='DESELECT')
    objects=[o for o in root.children_recursive if o.type=='MESH']
    for o in objects:
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
        o.select_set(True);bpy.context.view_layer.objects.active=o
        for modifier in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
        o.select_set(False)
    groups={}
    for o in objects:groups.setdefault(o.data.materials[0].name,[]).append(o)
    for objects in groups.values():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        bpy.context.object.name=root.name+'__'+bpy.context.object.data.materials[0].name

bpy.ops.wm.save_as_mainfile(filepath=str(STAGE/'Dante-arrival-identity.blend'))
bpy.ops.export_scene.gltf(filepath=str(STAGE/'identity-raw.glb'),export_format='GLB',export_animations=False,export_apply=True,export_extras=True,export_yup=True)
manifest={'author':'Echoes of Dante project, authored offline via Blender Python','blender':bpy.app.version_string,'generator':'scripts/asset-tools/author-arrival186.py','assets':[o.name for o in assets], 'textures':'Two deterministic 256px surface maps; GLB optimizer preserves material tint.', 'thirdPartyArtwork':False}
(STAGE/'authoring.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('AUTHORED',len(assets),'asset roots',flush=True)
