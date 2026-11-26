"""The Warden (O Warden) for the new 3D, after the 2D art (public/assets/visual/creature-finish/warden-v1.webp):
a hulking guardian of chiselled sandstone plates over purple scaled flesh, a violet core in the chest,
a vent tube on top, amber crystal clusters and scythe claws. Built from metaballs + displaced rocks,
coloured with vertex colours, split in animatable parts with pivots at the joints.
Run: blender --background --python make_warden.py -- <out.glb>
"""
import bpy, bmesh, math, random, sys
from mathutils import Vector, noise, Matrix

OUT = sys.argv[sys.argv.index('--') + 1]
random.seed(7)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
for mb in list(bpy.data.metaballs): bpy.data.metaballs.remove(mb)


def mat(name, color=None, rough=.8, emit=None, strength=0., vcol=False, metal=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if vcol:
        a = m.node_tree.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
        m.node_tree.links.new(a.outputs['Color'], b.inputs['Base Color'])
    elif color:
        b.inputs['Base Color'].default_value = (*color, 1)
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    return m


STONE = mat('warden_stone', rough=.85, vcol=True)
FLESH = mat('warden_flesh', rough=.5, vcol=True)
CORE = mat('warden_core', (0.5, 0.2, 0.9), .2, (0.6, 0.25, 1.0), 2.5)
AMBER = mat('warden_amber', (1.0, 0.55, 0.1), .3, (1.0, 0.5, 0.08), 2.2)
DARK = mat('warden_dark', (0.06, 0.04, 0.05), .9)


def active(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o


def apply_all(o):
    active(o)
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)


def paint(o, f):
    """vertex colour from a function of the world position"""
    me = o.data
    if 'Col' not in me.color_attributes: me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    ca = me.color_attributes['Col']
    mw = o.matrix_world
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index].co
            c = f(mw @ v, me.vertices[me.loops[li].vertex_index].normal)
            ca.data[li].color = (*c, 1)


def sand(p, n):
    k = noise.noise(p * 2.3) * .5 + .5; d = noise.noise(p * 7.1) * .5 + .5
    base = Vector((.5, .42, .28)).lerp(Vector((.72, .62, .42)), k)
    shade = .55 + .45 * max(0., n.z * .5 + .5)          # darker on the underside
    return tuple(base * (.7 + .45 * d) * shade)


def purple(p, n):
    k = noise.noise(p * 3.1) * .5 + .5; cell = abs(noise.noise(p * 11.0))
    base = Vector((.22, .1, .3)).lerp(Vector((.4, .2, .5)), k)
    return tuple(base * (.6 + .8 * cell))


def rock(name, loc, scale, rot=(0, 0, 0), detail=.16, point=.4):
    """chiselled stone shard: jittered low-poly sphere tapering to a point along +y, flat shaded"""
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1)
    for v in bm.verts:
        t = (v.co.y + 1) / 2
        v.co.x *= 1 - point * t * t; v.co.z *= 1 - point * .6 * t * t; v.co.y *= 1 + .35 * t
        v.co += Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))) * detail
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.location = loc; o.rotation_euler = rot; o.scale = scale
    active(o); bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for p in o.data.polygons: p.use_smooth = False
    o.data.materials.append(STONE); paint(o, sand); return o


def spike(name, base, tip, r, bend=0.):
    """curved horn/claw: rings along the axis, swept sideways by bend*t^2"""
    base, tip = Vector(base), Vector(tip); ax = tip - base; l = ax.length; d = ax.normalized()
    side = d.cross(Vector((0, 0, 1)) if abs(d.z) < .9 else Vector((1, 0, 0))).normalized(); up = side.cross(d)
    bm = bmesh.new(); rings = []
    N, S = 7, 6
    for i in range(N + 1):
        t = i / N; c = base + d * l * t + up * bend * l * .35 * t * t
        rr = r * (1 - t) ** .85
        rings.append([bm.verts.new(c + (side * math.cos(k / S * 6.283) + up * math.sin(k / S * 6.283)) * rr) for k in range(S)])
    for i in range(N):
        for k in range(S):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % S], rings[i + 1][(k + 1) % S], rings[i + 1][k]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in o.data.polygons: p.use_smooth = False
    o.data.materials.append(STONE); paint(o, sand); return o


def flesh(name, elems, res=.1):
    """elems: (kind, co, radius, (sx,sy,sz)) metaballs -> mesh"""
    mb = bpy.data.metaballs.new(name); mb.resolution = res; mb.render_resolution = res
    ob = bpy.data.objects.new(name, mb); bpy.context.collection.objects.link(ob)
    for kind, co, r, s in elems:
        e = mb.elements.new(type=kind); e.co = co; e.radius = r
        if kind == 'ELLIPSOID': e.size_x, e.size_y, e.size_z = s
        if kind == 'CAPSULE': e.size_x = s[0]
    active(ob); bpy.ops.object.convert(target='MESH'); o = bpy.context.active_object; o.name = name
    tex = bpy.data.textures.new(name + '_t', 'VORONOI'); tex.noise_scale = .09
    d = o.modifiers.new('d', 'DISPLACE'); d.texture = tex; d.strength = .035
    dec = o.modifiers.new('dec', 'DECIMATE'); dec.ratio = .35
    apply_all(o)
    for p in o.data.polygons: p.use_smooth = True
    o.data.materials.append(FLESH); paint(o, purple); return o


def capsule_between(a, b, r):
    a, b = Vector(a), Vector(b); c = (a + b) / 2; v = b - a
    # metaball capsules lie along x: rotate is not available per element, so approximate with balls
    n = max(2, int(v.length / (r * .6)))
    return [('BALL', tuple(a + v * (i / n)), r * (1 - .1 * i / n), None) for i in range(n + 1)]


def join(name, objs, pivot):
    active(objs[0])
    for o in objs: o.select_set(True)
    bpy.ops.object.join(); o = bpy.context.active_object; o.name = name
    bpy.context.scene.cursor.location = pivot; bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    return o


def amber(name, center, n, spread):
    out = []
    for i in range(n):
        p = Vector(center) + Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))) * spread
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(.05, .11), location=p)
        o = bpy.context.active_object; o.name = '%s%d' % (name, i)
        for f in o.data.polygons: f.use_smooth = False
        o.data.materials.append(AMBER); paint(o, lambda p, n: (1, .6, .2)); out.append(o)
    return out



def shard(name, loc, size, direction, roll=0.):
    """stone shard whose point follows `direction`"""
    d = Vector(direction).normalized(); q = Vector((0, 1, 0)).rotation_difference(d)
    q = q @ Matrix.Rotation(roll, 4, 'Y').to_quaternion()
    o = rock(name, (0, 0, 0), size); o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = q; o.location = loc
    active(o); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); return o


def plates(prefix, center, out, n, size, spread):
    """overlapping shards over a surface patch, points sweeping outward and up"""
    res = []
    for i in range(n):
        c = Vector(center) + Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))) * spread
        d = (Vector(out) + Vector((random.uniform(-.4, .4), random.uniform(-.4, .4), random.uniform(.1, .6)))).normalized()
        s = size * random.uniform(.75, 1.25)
        res.append(shard('%s%d' % (prefix, i), c, (s * .95, s * 1.0, s * .75), d, random.uniform(-.6, .6)))
    return res

# ---------- torso: flesh core, chest core, plates, back spikes, vent tube ----------
parts = []
parts.append(flesh('torso_flesh', [('ELLIPSOID', (0, 0, 2.7), 1.15, (1.3, 1.0, 1.0)), ('ELLIPSOID', (0, -.1, 2.05), .85, (1.05, .9, .8)), ('BALL', (0, 0, 1.65), .78, None),
                                   ('BALL', (1.0, 0, 3.05), .55, None), ('BALL', (-1.0, 0, 3.05), .55, None)]))
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=.26, location=(0, -1.02, 2.65)); core = bpy.context.active_object; core.name = 'core'; core.scale = (1, .55, 1.2)
bpy.ops.object.transform_apply(scale=True); core.data.materials.append(CORE); paint(core, lambda p, n: (1, 1, 1)); parts.append(core)
# chest plates framing the core, layered shards over shoulders, back and flanks
for sx in (-1, 1):
    parts += plates('chest%d' % sx, (sx * .55, -.9, 2.7), (sx * .5, -1, .2), 3, .32, .18)
    parts += plates('belly%d' % sx, (sx * .4, -.8, 2.05), (sx * .3, -1, -.2), 2, .28, .12)
    parts += plates('shoulder%d' % sx, (sx * 1.3, -.05, 3.4), (sx * 1, -.2, .9), 8, .52, .36)
    parts += plates('flank%d' % sx, (sx * 1.1, .25, 2.4), (sx * 1, .3, 0), 4, .42, .3)
    for k in range(3):
        parts.append(spike('sh_spike%d_%d' % (sx, k), (sx * (1.05 + k * .2), -.15 + k * .2, 3.6), (sx * (1.45 + k * .3), .1 + k * .3, 4.4 - k * .2), .15, bend=.8))
    parts += amber('sh_amber%d' % sx, (sx * 1.42, -.42, 3.3), 9, .16)
parts += plates('back', (0, .65, 3.0), (0, 1, .6), 10, .55, .55)
for k in range(5):
    x = (k - 2) * .34
    parts.append(spike('back_spike%d' % k, (x, .6 + abs(x) * .1, 3.45 - abs(x) * .2), (x * 1.3, 1.0 + random.uniform(0, .2), 4.05 - abs(x) * .4), .17, bend=.9))
# vent tube on top, tilted forward
bpy.ops.mesh.primitive_torus_add(major_radius=.5, minor_radius=.2, major_segments=20, minor_segments=8, location=(0, -.35, 3.75), rotation=(math.radians(25), 0, 0))
tube = bpy.context.active_object; tube.name = 'vent'
tex = bpy.data.textures.new('vent_t', 'VORONOI'); tex.noise_scale = .3; d = tube.modifiers.new('d', 'DISPLACE'); d.texture = tex; d.strength = .06; apply_all(tube)
for p in tube.data.polygons: p.use_smooth = False
tube.data.materials.append(STONE); paint(tube, sand); parts.append(tube)
bpy.ops.mesh.primitive_cylinder_add(radius=.4, depth=.5, location=(0, -.3, 3.6), rotation=(math.radians(25), 0, 0)); inner = bpy.context.active_object; inner.data.materials.append(DARK); paint(inner, lambda p, n: (.1, .1, .1)); parts.append(inner)
torso = join('torso', parts, (0, 0, 1.6))

# ---------- arms: upper flesh + plates (pivot shoulder), forearm gauntlet with scythes (pivot elbow) ----------
def arm(sx):
    sh, el = Vector((sx * 1.4, 0, 3.0)), Vector((sx * 1.75, -.05, 2.15))
    up = [flesh('upper%d' % sx, capsule_between(sh, el, .56))]
    up += plates('upper_plate%d' % sx, (sx * 1.6, .0, 2.6), (sx * 1, -.2, .3), 3, .3, .15)
    upper = join('arm_%s' % ('l' if sx > 0 else 'r'), up, sh)
    fp = [flesh('fore_flesh%d' % sx, capsule_between(el, (sx * 1.75, -.15, 1.25), .52))]
    fp += plates('gauntlet%d' % sx, (sx * 1.85, -.2, 1.6), (sx * .45, -.35, -.8), 11, .5, .3)
    fp += plates('gauntlet_b%d' % sx, (sx * 1.8, .15, 1.95), (sx * .5, .4, .6), 4, .4, .15)
    fp += amber('g_amber%d' % sx, (sx * 1.98, -.35, 1.55), 9, .22)
    for k in range(3):
        b = Vector((sx * (1.55 + k * .14), -.35 - k * .05, 1.0))
        fp.append(spike('claw%d_%d' % (sx, k), b, b + Vector((sx * .2, -.55 - k * .1, -1.25 + k * .15)), .16 - k * .03, bend=-1.6))
    for k in range(3):
        b = Vector((sx * (1.95), .0 - k * .25, 1.9 - k * .25))
        fp.append(spike('g_spike%d_%d' % (sx, k), b, b + Vector((sx * .55, .2, .25)), .12, bend=.2))
    fore = join('fore_%s' % ('l' if sx > 0 else 'r'), fp, el)
    fore.parent = upper; fore.matrix_parent_inverse = upper.matrix_world.inverted()
    return upper


def leg(sx):
    hip = Vector((sx * .6, 0, 1.6))
    p = [flesh('leg%d' % sx, capsule_between(hip, (sx * .75, -.05, .75), .58) + capsule_between((sx * .75, -.05, .75), (sx * .8, -.15, .22), .48) + [('ELLIPSOID', (sx * .8, -.3, .16), .4, (1, 1.3, .55))])]
    p += plates('knee%d' % sx, (sx * .78, -.35, .95), (sx * .3, -1, .3), 2, .3, .1)
    p += plates('thigh_plate%d' % sx, (sx * .85, -.05, 1.35), (sx * 1, -.3, .2), 3, .32, .18)
    for k in range(3):
        b = Vector((sx * (.62 + k * .16), -.6, .14))
        p.append(spike('toe%d_%d' % (sx, k), b, b + Vector((sx * .05 * (k - 1), -.45, -.14)), .11, bend=-1.2))
    return join('leg_%s' % ('l' if sx > 0 else 'r'), p, hip)


limbs = [arm(1), arm(-1), leg(1), leg(-1)]
root = bpy.data.objects.new('warden', None); bpy.context.collection.objects.link(root)
for o in [torso, limbs[2], limbs[3]]: o.parent = root
for o in limbs[:2]:
    o.parent = torso; o.matrix_parent_inverse = torso.matrix_world.inverted()
bpy.ops.object.select_all(action='SELECT')
tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_vertex_color='MATERIAL')
print('WARDEN', OUT, 'faces', tris)
