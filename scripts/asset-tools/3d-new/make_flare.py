"""Flare creatures (CC-BY / CC-BY-SA 3.0, Clint Bellanger, Justin Jacobs, Justin Nichol) for the new 3D.
Sources: flareteam/flare-game-art-src @ 8830c68 (Git LFS), downloaded to .local/creature-flare/characters.
Run: blender --background --python make_flare.py -- <src characters dir> <out dir>

- antlion, antlion_armored, antlion_hatchling: procedural shader colours baked to one 512 px atlas (the HD shaders
  reference external textures that are not in the repository); the single rig action is exported as one clip and
  split at runtime by the frame markers of the source (stance 1-4, run 5-12, swing 13-16, hit/die 17-24, critdie 25-32).
- wyvern, wyvern_boss: hand-painted skins by Justin Nichol; the earth skin is embedded and the air, fire and water
  skins are saved next to the model (1024 px JPEG) so the game swaps them per region.
"""
import bpy, sys, os, re
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = os.path.abspath(argv[0]), os.path.abspath(argv[1])
os.makedirs(OUT, exist_ok=True)


def keep_only(objs):
    for o in list(bpy.data.objects):
        if o not in objs:
            bpy.data.objects.remove(o, do_unlink=True)
    for o in objs:
        o.hide_set(False); o.hide_render = False; o.hide_viewport = False


def prune_curves(rig):
    for ac in bpy.data.actions:
        for layer in ac.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in list(bag.fcurves):
                        m = re.match(r'pose\.bones\["([^"]+)"\]', curve.data_path)
                        if m and m[1] not in rig.data.bones:
                            bag.fcurves.remove(curve)


def parent_to(body, rig):
    mw = body.matrix_world.copy(); body.parent = rig; body.matrix_world = mw


def export(name, mode):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + '.glb'), export_format='GLB', use_selection=True, export_yup=True,
                              export_animations=True, export_animation_mode=mode, export_force_sampling=True, export_frame_range=False,
                              export_skins=True, export_all_influences=False, export_def_bones=True, export_morph=False,
                              export_image_format='JPEG', export_jpeg_quality=86)
    print('EXPORTED', name, os.path.getsize(os.path.join(OUT, name + '.glb')))


for name in ('antlion', 'antlion_armored', 'antlion_hatchling'):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, name, name + '.blend'))
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 8
    body, rig = bpy.data.objects['Antlion'], bpy.data.objects['AntArm']
    keep_only([body, rig]); prune_curves(rig); parent_to(body, rig)
    bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); bpy.context.view_layer.objects.active = body
    for mat in body.data.materials:
        if mat:
            for node in list(mat.node_tree.nodes):
                if node.type == 'TEX_IMAGE':
                    mat.node_tree.nodes.remove(node)
    rig.animation_data_create(); rig.animation_data.action = bpy.data.actions['Action']
    rig.animation_data.action_slot = rig.animation_data.action.slots[0]
    for t in rig.animation_data.nla_tracks:
        t.mute = True
    sc.frame_set(1)
    img = bpy.data.images.new(name + '_color', width=512, height=512, alpha=False)
    for mat in body.data.materials:
        if mat:
            n = mat.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; mat.node_tree.nodes.active = n
    sc.render.bake.use_pass_direct = False; sc.render.bake.use_pass_indirect = False; sc.render.bake.use_pass_color = True; sc.render.bake.margin = 8
    bpy.ops.object.bake(type='DIFFUSE')
    mat = bpy.data.materials.new(name + '_chitin'); mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Roughness'].default_value = .62
    tn = mat.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img; mat.node_tree.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    body.data.materials.clear(); body.data.materials.append(mat)
    for p in body.data.polygons:
        p.material_index = 0; p.use_smooth = True
    sc.frame_start = 1; sc.frame_end = 39; sc.render.fps = 8
    export(name, 'ACTIVE_ACTIONS')

for name in ('wyvern', 'wyvern_boss'):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(SRC, 'wyvern', name + '.blend'))
    body, rig = bpy.data.objects['Wyvern'], bpy.data.objects['WyvernArmature']
    keep_only([body, rig]); prune_curves(rig); parent_to(body, rig)
    tex = bpy.data.images.load(os.path.join(SRC, 'wyvern', 'textures', 'wyvern_diffuse_earth.png'), check_existing=True)
    tex.scale(1024, 1024)
    mat = bpy.data.materials.new(name + '_skin'); mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF'); bsdf.inputs['Roughness'].default_value = .78
    tn = mat.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = tex; mat.node_tree.links.new(tn.outputs['Color'], bsdf.inputs['Base Color'])
    body.data.materials.clear(); body.data.materials.append(mat)
    for p in body.data.polygons:
        p.material_index = 0
    for ac in list(bpy.data.actions):
        if ac.name == 'BreatheLighting':
            bpy.data.actions.remove(ac)
        else:
            ac.use_fake_user = True
    bpy.context.scene.render.fps = 10
    export(name, 'ACTIONS')

for skin in ('air', 'fire', 'water'):
    im = bpy.data.images.load(os.path.join(SRC, 'wyvern', 'textures', 'wyvern_diffuse_%s.png' % skin))
    im.scale(1024, 1024); im.file_format = 'JPEG'
    bpy.context.scene.render.image_settings.file_format = 'JPEG'; bpy.context.scene.render.image_settings.quality = 86
    im.save_render(os.path.join(OUT, 'wyvern_%s.jpg' % skin))
    print('SKIN', skin)
print('FLARE DONE')
