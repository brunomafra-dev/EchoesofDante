import bpy, sys, os
argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
os.makedirs(out, exist_ok=True)
TARGET = {'dead_tree_trunk_02': 9000, 'dead_quiver_trunk': 7000, 'tree_stump_01': 3000, 'tree_stump_02': 3000, 'dead_tree_trunk': 5000,
          'dry_branches_medium_01': 3000, 'dead_quiver_branch_01': 2500}
for name in sorted(os.listdir(src)):
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, name, name + '.gltf'))
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    total = sum(len(o.data.polygons) for o in meshes)
    target = TARGET.get(name, 2500 * max(1, len(meshes)))
    ratio = min(1.0, target / max(1, total))
    for o in meshes:
        if ratio < 1:
            md = o.modifiers.new('dec', 'DECIMATE'); md.ratio = ratio
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
            bpy.ops.object.modifier_apply(modifier='dec')
    for img in bpy.data.images:
        cap = 1024 if name in ('dead_tree_trunk_02', 'dead_quiver_trunk') else 512
        if img.size[0] > cap: img.scale(cap, cap)
    bpy.ops.object.select_all(action='SELECT')
    path = os.path.join(out, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_image_format='JPEG', export_jpeg_quality=82)
    print('DONE', name, len(meshes), 'meshes', total, '->', sum(len(o.data.polygons) for o in meshes), round(os.path.getsize(path) / 1e6, 2), 'MB', [o.name for o in meshes][:6])
