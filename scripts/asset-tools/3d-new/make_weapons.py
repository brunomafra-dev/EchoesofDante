"""Procedural weapon kit for the new Echoes of Dante 3D (look-dev).
Run: blender --background --python make_weapons.py -- <out_dir>
Grip origin at (0,0,0); blade/barrel along +Y; up is +Z. Units are metres.
"""
import bpy, math, sys, os

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '.'
os.makedirs(OUT, exist_ok=True)
MATS = {}


def mat(name, color, metal=0.0, rough=0.5, emit=None, strength=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    MATS[name] = m
    return m


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)


def finish(ob, m, bevel=0.0, smooth=True):
    ob.data.materials.append(m)
    if smooth:
        for p in ob.data.polygons:
            p.use_smooth = True
    if bevel > 0:
        md = ob.modifiers.new('bevel', 'BEVEL')
        md.width = bevel
        md.segments = 3
        md.limit_method = 'ANGLE'
    return ob


def apply_scale(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def box(name, size, loc, m, rot=(0, 0, 0), bevel=0.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    apply_scale(ob)
    return finish(ob, m, bevel)


def cyl(name, r, depth, loc, m, axis='Y', verts=28, r2=None, bevel=0.0):
    rot = {'Y': (math.pi / 2, 0, 0), 'X': (0, math.pi / 2, 0), 'Z': (0, 0, 0)}[axis]
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    return finish(ob, m, bevel)


def sphere(name, r, loc, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=r, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    apply_scale(ob)
    return finish(ob, m)


def torus(name, R, r, loc, m, axis='Y'):
    rot = {'Y': (math.pi / 2, 0, 0), 'X': (0, math.pi / 2, 0), 'Z': (0, 0, 0)}[axis]
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=36, minor_segments=12, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    return finish(ob, m)


def export(name):
    for o in bpy.context.scene.objects:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', export_apply=True, use_selection=True,
                              export_yup=True, export_materials='EXPORT')


# palette
GUN = mat('gunmetal', (0.05, 0.055, 0.065), 0.9, 0.38)
GUN2 = mat('gunmetal_light', (0.16, 0.17, 0.19), 0.85, 0.32)
BRASS = mat('brass', (0.62, 0.42, 0.14), 1.0, 0.28)
LEATHER = mat('leather', (0.07, 0.045, 0.03), 0.0, 0.85)
CYAN = mat('cyan_energy', (0.1, 0.6, 0.9), 0.0, 0.2, (0.15, 0.75, 1.0), 2.2)
CORE = mat('blade_core', (1, 1, 1), 0.0, 0.2, (0.85, 0.97, 1.0), 3.5)
GREEN = mat('green_filament', (0.1, 0.5, 0.2), 0.0, 0.3, (0.2, 1.0, 0.45), 1.6)
OLIVE = mat('olive_chitin', (0.09, 0.12, 0.05), 0.35, 0.5)
OLIVE2 = mat('olive_dark', (0.05, 0.065, 0.03), 0.25, 0.6)
LENS = mat('lens', (0.02, 0.1, 0.12), 0.0, 0.1, (0.2, 0.9, 1.0), 1.5)


def saber():
    # grip with grooves, pommel cap, brass emitter, thick blade with white core
    cyl('grip', .0185, .21, (0, .0, 0), LEATHER, bevel=.002)
    for i in range(9):
        torus('groove%d' % i, .0192, .0016, (0, -.085 + i * .021, 0), GUN2)
    cyl('pommel', .027, .03, (0, -.125, 0), GUN, bevel=.006)
    sphere('pommel_cap', .022, (0, -.147, 0), BRASS)
    torus('pommel_ring', .028, .004, (0, -.108, 0), BRASS)
    cyl('body_collar', .026, .045, (0, .125, 0), GUN2, bevel=.004)
    torus('collar_ring', .0285, .0045, (0, .105, 0), BRASS)
    cyl('emitter', .031, .05, (0, .17, 0), GUN, r2=.02, bevel=.003)
    torus('emitter_lip', .0225, .004, (0, .197, 0), BRASS)
    for s in (-1, 1):      # swept guard wings
        box('wing%d' % s, (.05, .012, .008), (s * .043, .118, 0), BRASS, rot=(0, 0, s * -.35), bevel=.003)
    cyl('blade_outer', .0125, .88, (0, .64, 0), CYAN, verts=20)
    sphere('blade_tip', .0125, (0, 1.08, 0), CYAN)
    cyl('blade_core', .0058, .88, (0, .64, 0), CORE, verts=14)
    sphere('core_tip', .0058, (0, 1.08, 0), CORE)


def carbine():
    # receiver, shroud with vents, long barrel, scope, grips, energy cell, stock
    box('receiver', (.075, .34, .09), (0, .08, 0), GUN, bevel=.007)
    box('upper_cover', (.062, .26, .03), (0, .09, .057), GUN2, bevel=.006)
    box('rail', (.032, .30, .012), (0, .1, .078), GUN, bevel=.002)
    for i in range(6):
        box('rail_notch%d' % i, (.036, .008, .006), (0, -.02 + i * .045, .085), GUN2, bevel=.001)
    cyl('shroud', .034, .24, (0, .39, 0), GUN2, bevel=.004)
    for i in range(5):
        torus('vent%d' % i, .0345, .003, (0, .3 + i * .045, 0), GUN)
    cyl('barrel', .014, .30, (0, .62, 0), GUN, bevel=.002)
    cyl('muzzle', .022, .06, (0, .78, 0), GUN2, bevel=.004)
    torus('muzzle_glow', .0185, .0042, (0, .812, 0), CYAN)
    box('fore_grip', (.03, .075, .1), (0, .34, -.08), GUN, rot=(.3, 0, 0), bevel=.006)
    box('pistol_grip', (.04, .062, .13), (0, -.02, -.105), LEATHER, rot=(.28, 0, 0), bevel=.007)
    box('trigger_guard', (.012, .08, .012), (0, .035, -.07), GUN, bevel=.002)
    box('stock', (.05, .24, .09), (0, -.25, -.01), GUN2, rot=(-.08, 0, 0), bevel=.01)
    box('butt_pad', (.056, .03, .115), (0, -.385, -.02), LEATHER, bevel=.008)
    cyl('cell', .02, .13, (0, .12, -.075), CYAN, axis='Y', verts=18)
    box('cell_housing', (.052, .15, .04), (0, .12, -.062), GUN, bevel=.005)
    cyl('scope_tube', .021, .18, (0, .1, .105), GUN, bevel=.003)
    cyl('scope_front', .028, .03, (0, .19, .105), GUN2, bevel=.004)
    cyl('scope_lens', .02, .006, (0, .207, .105), LENS)
    cyl('scope_rear', .024, .028, (0, .005, .105), GUN2, bevel=.003)
    for s in (-1, 1):
        box('side_plate%d' % s, (.008, .2, .05), (s * .04, .07, .0), BRASS, bevel=.002)
    box('front_sight', (.012, .01, .03), (0, .76, .028), GUN2, bevel=.002)


ASTRAL = mat('astral_glow', (0.2, 0.8, 0.85), 0.0, 0.2, (0.37, 0.9, 0.85), 0.9)
VEIN = mat('vein_glow', (0.1, 0.5, 0.2), 0.0, 0.3, (0.2, 1.0, 0.45), 0.7)
STEEL = mat('astral_steel', (0.12, 0.13, 0.15), 0.9, 0.3)


def gauntlet():
    # slim astral bracer hugging the forearm, thin plate on the back of the hand, knuckle guard,
    # palm crystal and three rings floating round the wrist (animated + tinted by element in game)
    cyl('bracer', .047, .2, (0, -.12, 0), STEEL, r2=.041, verts=28, bevel=.002)
    for i, y in enumerate((-.205, -.115, -.03)):
        torus('trim%d' % i, .046 - i * .003, .0028, (0, y, 0), BRASS)
    box('ridge', (.022, .17, .01), (0, -.12, .045), GUN2, bevel=.003)
    box('ridge_glow', (.006, .15, .004), (0, -.12, .051), ASTRAL)
    for s in (-1, 1):
        box('side_fin%d' % s, (.006, .1, .022), (s * .046, -.14, .006), GUN2, rot=(0, 0, s * .15), bevel=.002)
    for i in range(3):
        torus('astral_ring%d' % i, .058 + i * .006, .0025, (0, -.035 - i * .035, 0), ASTRAL)
    # hand part (moves with the hand bone in game)
    box('hand_plate', (.066, .07, .007), (0, .062, .029), STEEL, rot=(-.12, 0, 0), bevel=.003)
    box('hand_plate_glow', (.004, .05, .003), (0, .062, .034), ASTRAL)
    for k in range(4):
        box('knuckle%d' % k, (.016, .016, .01), (-.027 + k * .018, .108, .022), GUN2, bevel=.004)
    sphere('palm_emitter', .012, (0, .055, -.022), ASTRAL)


def conductor():
    # symbiotic conductor rod: wrapped grip, olive chitin shaft, living green core caged at the tip
    cyl('grip', .016, .16, (0, 0, 0), LEATHER, bevel=.002)
    for i in range(6):
        torus('wrap%d' % i, .0168, .0016, (0, -.065 + i * .026, 0), OLIVE2)
    sphere('pommel', .021, (0, -.095, 0), OLIVE, scale=(1, 1.2, 1))
    cyl('collar', .022, .03, (0, .095, 0), OLIVE2, r2=.017, bevel=.003)
    cyl('shaft', .012, .36, (0, .29, 0), OLIVE, r2=.009, verts=16)
    for i in range(5):
        y = .14 + i * .07
        sphere('node%d' % i, .016 - i * .0015, (0, y, 0), OLIVE2, scale=(1, .6, 1))
    for i in range(3):
        cyl('vein%d' % i, .0018, .3, (math.cos(i * 2.09) * .0115, .28, math.sin(i * 2.09) * .0115), VEIN, verts=6)
    cyl('head_base', .02, .035, (0, .48, 0), OLIVE2, r2=.026, bevel=.003)
    for i in range(4):
        a = i * math.pi / 2
        p = bpy.ops.mesh.primitive_cone_add
        p(vertices=8, radius1=.007, radius2=.002, depth=.11, location=(math.cos(a) * .028, .54, math.sin(a) * .028), rotation=(math.pi / 2 - .0, 0, 0))
        ob = bpy.context.active_object
        ob.name = 'prong%d' % i
        ob.rotation_euler = (math.pi / 2 + math.sin(a) * .35, 0, -math.cos(a) * .35)
        finish(ob, OLIVE)
    sphere('core', .022, (0, .55, 0), GREEN)
    sphere('core_shell', .03, (0, .55, 0), mat('core_glass', (0.3, 0.9, 0.5), 0.0, 0.05, (0.2, 1.0, 0.45), 0.6))
    torus('tip_ring', .03, .003, (0, .6, 0), GREEN)


for name, fn in (('saber', saber), ('carbine', carbine), ('gauntlet', gauntlet), ('conductor', conductor)):
    clear()
    fn()
    export(name)
    print('exported', name, len(bpy.context.scene.objects), 'objects')
