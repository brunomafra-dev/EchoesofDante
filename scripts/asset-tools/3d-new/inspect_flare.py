"""Print objects, rigs, actions (frame ranges, markers) and materials of Flare creature .blend files.
Run: blender --background --python inspect_flare.py -- <file.blend> [...]"""
import bpy, sys
for path in sys.argv[sys.argv.index('--') + 1:]:
    bpy.ops.wm.open_mainfile(filepath=path)
    print('=====', path)
    for o in bpy.data.objects:
        extra = ''
        if o.type == 'MESH':
            extra = 'verts=%d faces=%d mats=%s mods=%s' % (len(o.data.vertices), len(o.data.polygons), [m.name if m else None for m in o.data.materials], [m.type for m in o.modifiers])
        if o.type == 'ARMATURE':
            extra = 'bones=%d action=%s nla=%s' % (len(o.data.bones), o.animation_data.action.name if o.animation_data and o.animation_data.action else None,
                                                 [t.name for t in o.animation_data.nla_tracks] if o.animation_data else None)
        print(' OBJ', o.type, o.name, 'parent=', o.parent.name if o.parent else None, 'dims=', [round(x, 2) for x in o.dimensions], extra)
    for a in bpy.data.actions:
        print(' ACTION', a.name, 'range', tuple(a.frame_range), 'markers', [(m.name, m.frame) for m in a.pose_markers])
    sc = bpy.context.scene
    print(' SCENE frames', sc.frame_start, sc.frame_end, 'fps', sc.render.fps, 'markers', [(m.name, m.frame) for m in sc.timeline_markers][:40])
    for m in bpy.data.materials:
        if m.use_nodes:
            print(' MAT', m.name, [(n.type, getattr(getattr(n, 'image', None), 'filepath', None)) for n in m.node_tree.nodes if n.type in ('TEX_IMAGE', 'BSDF_PRINCIPLED', 'TEX_NOISE', 'VALTORGB')])
        else:
            print(' MAT', m.name, 'no nodes', tuple(m.diffuse_color))
    for t in bpy.data.texts:
        print(' TEXT', t.name, len(t.as_string()))
