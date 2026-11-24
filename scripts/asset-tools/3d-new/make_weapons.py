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


def gauntlet():
    # segmented forearm bracer, back-of-hand plate, knuckle guard, palm emitter
    cyl('forearm_core', .047, .30, (0, -.1, 0), GUN, verts=24)
    for i in range(5):
        r = .056 - i * .0035
        c = cyl('plate%d' % i, r, .052, (0, -.2 + i * .05, 0), GUN2, bevel=.004)
        c.scale = (1, 1, .9)
        torus('plate_edge%d' % i, r, .0032, (0, -.2 + i * .05 + .027, 0), BRASS)
    box('hand_plate', (.085, .11, .02), (0, .13, .035), GUN2, rot=(-.08, 0, 0), bevel=.006)
    for k in range(4):
        sphere('knuckle%d' % k, .0125, (-.03 + k * .02, .2, .035), GUN2)
    box('knuckle_bar', (.09, .02, .016), (0, .195, .042), BRASS, bevel=.004)
    cyl('wrist_core', .021, .016, (0, .06, -.034), LENS, axis='Z', verts=18)
    torus('palm_ring', .032, .0045, (0, .14, -.035), BRASS, axis='Z')
    sphere('palm_emitter', .02, (0, .14, -.037), CYAN)
    for s in (-1, 1):
        box('side_vane%d' % s, (.008, .16, .05), (s * .056, -.02, 0), BRASS, rot=(0, 0, s * .12), bevel=.003)
    box('thumb_guard', (.02, .07, .02), (.05, .14, 0), GUN2, rot=(0, 0, .4), bevel=.004)


def conductor():
    # organic-tech glove: olive chitin shell with green filament lines and a contact sensor
    cyl('cuff', .048, .12, (0, -.1, 0), OLIVE2, r2=.043, bevel=.004)
    for i in range(4):
        b = box('shell%d' % i, (.09 - i * .006, .07, .02), (0, -.04 + i * .048, .04), OLIVE, rot=(-.1 * i, 0, 0), bevel=.006)
    for s in (-1, 1):
        for i in range(3):
            box('rib%d_%d' % (s, i), (.012, .07, .02), (s * (.048 - i * .004), -.06 + i * .06, .01), OLIVE2, rot=(0, 0, s * .2), bevel=.003)
    for i in range(3):      # filament runs along the back of the hand
        x = (i - 1) * .026
        cyl('fil%d' % i, .0028, .2, (x, .02, .056), GREEN, verts=8)
        sphere('fil_node%d' % i, .006, (x, .12, .058), GREEN)
    box('knuckle_ridge', (.085, .02, .02), (0, .19, .042), OLIVE, bevel=.005)
    sphere('sensor', .017, (0, .09, .062), GREEN, scale=(1, 1, .7))
    torus('sensor_ring', .021, .003, (0, .09, .055), OLIVE2, axis='Z')


for name, fn in (('saber', saber), ('carbine', carbine), ('gauntlet', gauntlet), ('conductor', conductor)):
    clear()
    fn()
    export(name)
    print('exported', name, len(bpy.context.scene.objects), 'objects')
