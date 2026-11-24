"""Build customised humans with MPFB2 (CC0 assets) and export them as GLB.
Run: blender --background --python make_human.py -- <spec.json> <out_dir>
Spec list entries: {id, gender(0 female..1 male), age, weight, muscle, height, hair, eyebrows, eyelashes, skin, clothes:[...]}
Names are matched by substring against the installed asset files.
"""
import bpy, json, os, sys, traceback
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

argv = sys.argv[sys.argv.index('--') + 1:]
SPECS = json.load(open(argv[0], encoding='utf8'))
OUT = argv[1]
os.makedirs(OUT, exist_ok=True)


def find(asset_type, key, ext='mhclo'):
    key = key.lower()
    paths = AssetService.list_mhclo_assets(asset_type) if ext == 'mhclo' else AssetService.list_mhmat_assets(asset_type)
    for p in paths:
        if key in os.path.basename(p).lower():
            return p
    print('NOT FOUND', asset_type, key)
    return None


def clear():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)


def build(spec):
    clear()
    macro = TargetService.get_default_macro_info_dict()
    for k in ('gender', 'age', 'weight', 'muscle', 'height', 'proportions'):
        if k in spec:
            macro[k] = spec[k]
    if spec.get('race'):
        macro['race'] = spec['race']
    base = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
    TargetService.bake_targets(base)   # shape keys are dropped on export, so bake the body shape into the mesh first
    skin = find('skins', spec['skin'], 'mhmat') if spec.get('skin') else None
    if skin:
        HumanService.set_character_skin(skin, base, skin_type='GAMEENGINE')
    eyes = AssetService.list_mhclo_assets('eyes')
    print('EYES', [os.path.basename(e) for e in eyes])
    if eyes:
        pick = [e for e in eyes if 'low' in os.path.basename(e).lower()] or eyes
        HumanService.add_mhclo_asset(pick[0], base, asset_type='Eyes', material_type='GAMEENGINE', set_up_rigging=False)
    for key, kind in ((spec.get('hair'), 'hair'), (spec.get('eyebrows'), 'eyebrows'), (spec.get('eyelashes'), 'eyelashes')):
        if key:
            p = find(kind, key)
            if p:
                HumanService.add_mhclo_asset(p, base, asset_type=kind.capitalize(), material_type='GAMEENGINE', set_up_rigging=False)
    for key in spec.get('clothes', []):
        p = find('clothes', key)
        if p:
            HumanService.add_mhclo_asset(p, base, asset_type='Clothes', material_type='GAMEENGINE', set_up_rigging=False)
    return base


for spec in SPECS:
    try:
        base = build(spec)
        bpy.ops.object.select_all(action='DESELECT')
        n = 0
        for o in bpy.data.objects:
            if o.type == 'MESH':
                o.select_set(True)
                n += 1
        path = os.path.join(OUT, spec['id'] + '.glb')
        bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                                  export_image_format='JPEG', export_jpeg_quality=85)
        print('BUILT', spec['id'], n, 'meshes', round(os.path.getsize(path) / 1048576, 1), 'MB')
    except Exception:
        print('FAILED', spec.get('id'))
        traceback.print_exc()
