"""Convert the explicitly licensed Flare creatures; run with Blender 4.5 LTS.

Inputs are pinned/downloaded by fetch-arrival187.py. Only offline baking/export;
models, weights and authored poses are imported intact rather than rebuilt.
"""
import bpy,math,json,re
from pathlib import Path
ROOT=Path.cwd();SRC=ROOT/'.local/creature187/art_src_hd/characters';OUT=ROOT/'.local/creature187/export'
OUT.mkdir(parents=True,exist_ok=True)
for name,mesh_name,rig_name in [('antlion','Antlion','AntArm'),('wyvern','Wyvern','WyvernArmature')]:
 bpy.ops.wm.open_mainfile(filepath=str(SRC/name/(name+'.blend')))
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=16
 body=bpy.data.objects[mesh_name];rig=bpy.data.objects[rig_name]
 for o in list(bpy.data.objects):
  if o not in [body,rig]:bpy.data.objects.remove(o,do_unlink=True)
 for o in [body,rig]:o.hide_set(False);o.hide_render=False
 # Older sources contain curves for removed ankle bones. Remove only targets
 # absent from the current imported skeleton; preserve every usable pose curve.
 for ac in bpy.data.actions:
  for layer in ac.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for curve in list(bag.fcurves):
      match=re.match(r'pose\.bones\["([^"]+)"\]',curve.data_path)
      if match and match[1] not in rig.data.bones:bag.fcurves.remove(curve)
 # Explicit armature parent, retaining world transform, avoids ambiguous skin
 # association in the legacy .blend without changing bind pose or weights.
 matrix=body.matrix_world.copy();body.parent=rig;body.matrix_world=matrix
 bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
 if name=='antlion':
  # Original HD shader uses a missing external stone normal. Omit that input;
  # retain and bake the model's own procedural colors and sculpted topology.
  for mat in body.data.materials:
   if not mat:continue
   for node in list(mat.node_tree.nodes):
    if node.type=='TEX_IMAGE':mat.node_tree.nodes.remove(node)
  rig.animation_data_create();rig.animation_data.action=bpy.data.actions['Action'];rig.animation_data.action_slot=rig.animation_data.action.slots[0]
  if rig.animation_data.nla_tracks:
   for track in rig.animation_data.nla_tracks:track.mute=True
  scene.frame_set(1)
  # One atlas, avoiding multiple material/shadow passes per creature.
  image=bpy.data.images.new('Flare antlion baked color',width=512,height=512,alpha=False)
  for mat in body.data.materials:
   node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.nodes.active=node
  scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True;scene.render.bake.margin=12
  bpy.ops.object.bake(type='DIFFUSE')
  image.filepath_raw=str(OUT/'antlion-color.png');image.file_format='PNG';image.save()
  mat=bpy.data.materials.new('Flare chitin');mat.use_nodes=True
  bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.72
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;mat.node_tree.links.new(node.outputs['Color'],bsdf.inputs['Base Color'])
  body.data.materials.clear();body.data.materials.append(mat)
  for p in body.data.polygons:p.material_index=0
  # Keep the imported silhouette; smooth broad chitin plates without rounding
  # the pointed mandibles and leg spines into toy-like shapes.
  for p in body.data.polygons:p.use_smooth=True
  scene.frame_start=1;scene.frame_end=39;scene.render.fps=8
  # A single rig action contains the Flare stance/run/swing/death sequences.
  export_mode='ACTIVE_ACTIONS'
 else:
  tex=bpy.data.images.load(str(SRC/'wyvern/textures/wyvern_diffuse_earth.png'),check_existing=True)
  mat=bpy.data.materials.new('Flare earth wyvern painted skin');mat.use_nodes=True
  bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.83
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=tex;mat.node_tree.links.new(node.outputs['Color'],bsdf.inputs['Base Color'])
  body.data.materials.clear();body.data.materials.append(mat)
  for p in body.data.polygons:p.material_index=0
  for ac in list(bpy.data.actions):
   if ac.name=='BreatheLighting':bpy.data.actions.remove(ac)
   else:ac.use_fake_user=True
  scene.render.fps=10;export_mode='ACTIONS'
 # Both source species face Blender -Y, which glTF maps to +Z.
 # No render platforms, lights, shadows or blood planes are imported.
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'-raw.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode=export_mode,export_force_sampling=True,export_frame_range=False,export_skins=True,export_all_influences=False,export_def_bones=True,export_morph=False)
 print('EXPORTED',name,len(body.data.vertices),'vertices')
print('IMPORT COMPLETE')
