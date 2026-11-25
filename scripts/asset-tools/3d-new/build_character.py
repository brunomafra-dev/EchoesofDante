"""MPFB human -> rigged T-pose character with KayKit animations retargeted, exported as one GLB.
Run: blender --background --python build_character.py -- <spec.json> <out_dir>
Spec: {id, gender, ..., hair, eyebrows, eyelashes, skin, clothes:[...], anims:[...]}
"""
import bpy, json, os, sys, math, traceback
from mathutils import Matrix, Vector, Quaternion
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

argv = sys.argv[sys.argv.index('--') + 1:]
SPEC = json.load(open(argv[0], encoding='utf8'))
OUT = argv[1]
KAYKIT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ual', 'ual.glb'))
os.makedirs(OUT, exist_ok=True)

# target (MPFB game_engine) <- source (KayKit)
BONE_MAP = [
    ('pelvis', 'DEF-hips'), ('spine_01', 'DEF-spine.001'), ('spine_02', 'DEF-spine.002'), ('spine_03', 'DEF-spine.003'),
    ('neck_01', 'DEF-neck'), ('head', 'DEF-head'),
    ('clavicle_l', 'DEF-shoulder.L'), ('clavicle_r', 'DEF-shoulder.R'),
    ('upperarm_l', 'DEF-upper_arm.L'), ('lowerarm_l', 'DEF-forearm.L'), ('hand_l', 'DEF-hand.L'),
    ('upperarm_r', 'DEF-upper_arm.R'), ('lowerarm_r', 'DEF-forearm.R'), ('hand_r', 'DEF-hand.R'),
    ('thigh_l', 'DEF-thigh.L'), ('calf_l', 'DEF-shin.L'), ('foot_l', 'DEF-foot.L'), ('ball_l', 'DEF-toe.L'),
    ('thigh_r', 'DEF-thigh.R'), ('calf_r', 'DEF-shin.R'), ('foot_r', 'DEF-foot.R'), ('ball_r', 'DEF-toe.R'),
]
AIM = {'upperarm_l', 'lowerarm_l', 'upperarm_r', 'lowerarm_r', 'thigh_l', 'calf_l', 'thigh_r', 'calf_r'}
CHILD = {'DEF-upper_arm.L': 'DEF-forearm.L', 'DEF-forearm.L': 'DEF-hand.L', 'DEF-upper_arm.R': 'DEF-forearm.R', 'DEF-forearm.R': 'DEF-hand.R',
         'DEF-thigh.L': 'DEF-shin.L', 'DEF-shin.L': 'DEF-foot.L', 'DEF-thigh.R': 'DEF-shin.R', 'DEF-shin.R': 'DEF-foot.R'}
LEG_BEND = float(os.environ.get('LEG_BEND', '1.0'))
DEFAULT_ANIMS = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop', 'Sword_Idle', 'Sword_Attack', 'Pistol_Idle_Loop', 'Pistol_Shoot',
                 'Spell_Simple_Idle_Loop', 'Spell_Simple_Shoot', 'Roll', 'Hit_Chest', 'Death01', 'Interact']


def find(asset_type, key, ext='mhclo'):
    key = key.lower()
    paths = AssetService.list_mhclo_assets(asset_type) if ext == 'mhclo' else AssetService.list_mhmat_assets(asset_type)
    for p in paths:   # exact file name first, so 'robe' doesn't pick 'robe_hood'
        if os.path.splitext(os.path.basename(p))[0].lower() == key:
            return p
    for p in paths:
        if key in os.path.basename(p).lower():
            return p
    print('NOT FOUND', asset_type, key)


def meshes_of(arm):
    return [o for o in bpy.data.objects if o.type == 'MESH' and (o.parent == arm or any(m.type == 'ARMATURE' and m.object == arm for m in o.modifiers))]


def drop_shape_keys(ob):
    if ob.data.shape_keys:
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)


def select_only(ob):
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


def build_human(spec):
    macro = TargetService.get_default_macro_info_dict()
    for k in ('gender', 'age', 'weight', 'muscle', 'height', 'proportions'):
        if k in spec:
            macro[k] = spec[k]
    if spec.get('race'):
        macro['race'] = spec['race']
    base = HumanService.create_human(mask_helpers=True, detailed_helpers=True, extra_vertex_groups=True, feet_on_ground=True, scale=0.1, macro_detail_dict=macro)
    TargetService.bake_targets(base)
    if spec.get('skin'):
        sk = find('skins', spec['skin'], 'mhmat')
        if sk:
            HumanService.set_character_skin(sk, base, skin_type='GAMEENGINE')
    arm = HumanService.add_builtin_rig(base, 'game_engine', import_weights=True)
    eyes = AssetService.list_mhclo_assets('eyes')
    pick = [e for e in eyes if 'low' in os.path.basename(e).lower()] or eyes
    HumanService.add_mhclo_asset(pick[0], base, asset_type='Eyes', material_type='GAMEENGINE', set_up_rigging=True, interpolate_weights=True, import_weights=True)
    def add_part(kind, listname, key, name):
        p = find(listname, key)
        if not p:
            return
        before = set(bpy.data.objects)
        HumanService.add_mhclo_asset(p, base, asset_type=kind, material_type='GAMEENGINE', set_up_rigging=True, interpolate_weights=True, import_weights=True)
        new = [o for o in bpy.data.objects if o not in before and o.type == 'MESH']
        for i, o in enumerate(new):
            o.name = name + (':%d' % i if len(new) > 1 else '')
    for key, kind in ((spec.get('hair'), 'hair'), (spec.get('eyebrows'), 'eyebrows'), (spec.get('eyelashes'), 'eyelashes')):
        if key:
            add_part(kind.capitalize(), kind, key, kind + ':' + key)
    for key in spec.get('clothes', []):
        add_part('Clothes', 'clothes', key, 'cloth:' + key)
    for part in spec.get('parts', []):
        add_part(*part)
    return base, arm


def bake_masks_and_pose_t(arm):
    """Apply helper masks, then pose the arms to a T-pose and make that the rest pose (mesh deformed to match)."""
    ms = meshes_of(arm)
    for ob in ms:
        drop_shape_keys(ob)
        for md in list(ob.modifiers):
            if md.type == 'MASK':
                select_only(ob)
                try:
                    bpy.ops.object.modifier_apply(modifier=md.name)
                except Exception as e:
                    print('mask apply failed', ob.name, e)
    # pose arms horizontally
    select_only(arm)
    bpy.ops.object.mode_set(mode='POSE')
    for side, sign in (('l', 1), ('r', -1)):
        for bname in ('upperarm_' + side,):
            pb = arm.pose.bones[bname]
            head = pb.head.copy()
            d = (pb.tail - pb.head).normalized()
            t = Vector((sign, 0, 0))
            q = d.rotation_difference(t)
            rot = q.to_matrix() @ pb.matrix.to_3x3()
            m = rot.to_4x4()
            m.translation = head
            pb.matrix = m
            bpy.context.view_layer.update()
    # bake deformation into the meshes, then adopt the pose as rest
    bpy.ops.object.mode_set(mode='OBJECT')
    for ob in ms:
        for md in list(ob.modifiers):
            if md.type == 'ARMATURE':
                select_only(ob)
                name = md.name
                try:
                    bpy.ops.object.modifier_apply(modifier=name)
                except Exception as e:
                    print('armature apply failed', ob.name, e)
    select_only(arm)
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    for ob in ms:
        md = ob.modifiers.new('Armature', 'ARMATURE')
        md.object = arm
        ob.parent = arm


def import_kaykit():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=KAYKIT)
    new = [o for o in bpy.data.objects if o not in before]
    src = next(o for o in new if o.type == 'ARMATURE')
    for o in new:
        if o.type == 'MESH':
            o.hide_viewport = True
            o.hide_render = True
    return src, new


def retarget(src, dst, names):
    sb, db = src.data.bones, dst.data.bones
    # head heights for hip-translation scale
    s_h = (src.matrix_world @ sb['DEF-hips'].matrix_local).translation.z
    d_h = (dst.matrix_world @ db['pelvis'].matrix_local).translation.z
    k = d_h / s_h if s_h else 1.0
    print('RETARGET hip scale', round(k, 3))
    dst.animation_data_create()
    for pb in dst.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    FEET = ['foot_l', 'foot_r', 'ball_l', 'ball_r']
    REST_FOOT = min((dst.matrix_world @ db[n].head_local).z for n in FEET)
    done = []
    for name in names:
        act = bpy.data.actions.get(name)
        if not act:
            print('MISSING ACTION', name)
            continue
        src.animation_data_create()
        src.animation_data.action = act
        f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
        new_action = bpy.data.actions.new(name)
        new_action.use_fake_user = True
        dst.animation_data.action = new_action
        for f in range(f0, f1 + 1):
            bpy.context.scene.frame_set(f)
            for tname, sname in BONE_MAP:
                if tname not in dst.pose.bones:
                    continue
                pb = dst.pose.bones[tname]
                if sname is None:
                    pb.rotation_quaternion = Quaternion((1, 0, 0, 0))
                    pb.keyframe_insert('rotation_quaternion', frame=f - f0 + 1)
                    continue
                spb = src.pose.bones[sname]
                sw = src.matrix_world @ spb.matrix
                sr = src.matrix_world @ sb[sname].matrix_local
                qd = sw.to_quaternion() @ sr.to_quaternion().inverted()
                tr = dst.matrix_world @ db[tname].matrix_local
                tq = qd @ tr.to_quaternion()
                if tname in AIM:
                    # limbs: copy the absolute direction of the bone (the human's rest arm/leg is not straight like the source's)
                    cs = CHILD[sname]
                    dir_s = (src.matrix_world @ src.pose.bones[cs].head - src.matrix_world @ spb.head).normalized()
                    dir_t0 = (dst.matrix_world.to_3x3() @ (db[tname].tail_local - db[tname].head_local)).normalized()
                    if tname.startswith(('thigh', 'calf')):
                        dir_s = (dir_s * LEG_BEND + Vector((0, 0, -1)) * (1 - LEG_BEND)).normalized()
                    tq = dir_t0.rotation_difference(dir_s) @ tr.to_quaternion()
                tq_arm = dst.matrix_world.to_quaternion().inverted() @ tq
                head = pb.matrix.translation.copy()
                if tname == 'pelvis':
                    dw = sw.translation - sr.translation
                    head = (dst.matrix_world.inverted() @ (tr.translation + dw * k))
                m = tq_arm.to_matrix().to_4x4()
                m.translation = head
                pb.matrix = m
                bpy.context.view_layer.update()
                pb.keyframe_insert('rotation_quaternion', frame=f - f0 + 1)
                if os.environ.get('DEBUG_RT') and f == f0 and name == names[0] and tname in ('pelvis','spine_01','spine_02','head','upperarm_l','lowerarm_l','thigh_l','calf_l','foot_l'):
                    def wdir(arm, pbn):
                        return ((arm.matrix_world @ pbn.tail) - (arm.matrix_world @ pbn.head)).normalized()
                    print('DBG', name, tname, '<-', sname, 'srcRestDir', [round(x,2) for x in ((src.matrix_world.to_3x3() @ (sb[sname].tail_local - sb[sname].head_local)).normalized())], 'srcPoseDir', [round(x,2) for x in wdir(src, spb)], '| dstRestDir', [round(x,2) for x in ((dst.matrix_world.to_3x3() @ (db[tname].tail_local - db[tname].head_local)).normalized())], 'dstPoseDir', [round(x,2) for x in wdir(dst, pb)])
            # keep the feet from sinking: raise the pelvis so the lowest foot/toe never goes below its rest height
            cur = min((dst.matrix_world @ dst.pose.bones[n].head).z for n in FEET)
            if cur < REST_FOOT - 0.005:
                pp = dst.pose.bones['pelvis']
                mm = pp.matrix.copy()
                mm.translation = mm.translation + dst.matrix_world.inverted().to_3x3() @ Vector((0, 0, REST_FOOT - cur))
                pp.matrix = mm
                bpy.context.view_layer.update()
            dst.pose.bones['pelvis'].keyframe_insert('location', frame=f - f0 + 1)
        tr_ = dst.animation_data.nla_tracks.new()
        tr_.name = name
        tr_.strips.new(name, 1, new_action)
        dst.animation_data.action = None
        done.append(name)
    print('RETARGETED', done)


def shrink_images():
    for img in bpy.data.images:
        if img.size[0] <= 4 or img.type == 'RENDER_RESULT':
            continue
        n = img.name.lower()
        cap = 1024 if ('skin' in n or 'young' in n or 'middleage' in n) else 512
        if max(img.size) > cap:
            k = cap / max(img.size)
            try:
                img.scale(max(4, int(img.size[0] * k)), max(4, int(img.size[1] * k)))
            except Exception as e:
                print('scale fail', img.name, e)


def export(arm, path):
    shrink_images()
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    for ob in meshes_of(arm):
        ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=False, export_yup=True,
                              export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True,
                              export_image_format='JPEG', export_jpeg_quality=85)


try:
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    base, arm = build_human(SPEC)
    print('RIGGED', arm.name, len(meshes_of(arm)), 'meshes')
    bake_masks_and_pose_t(arm)
    print('T-POSE DONE')
    src, newobjs = import_kaykit()
    print('KAYKIT bones', len(src.data.bones), 'rest upperarm.l dir', (src.matrix_world @ (src.data.bones['DEF-upper_arm.L'].tail_local - src.data.bones['DEF-upper_arm.L'].head_local)).normalized())
    retarget(src, arm, SPEC.get('anims', DEFAULT_ANIMS))
    # drop the KayKit objects before export
    for o in newobjs:
        bpy.data.objects.remove(o, do_unlink=True)
    path = os.path.join(OUT, SPEC['id'] + '.glb')
    export(arm, path)
    print('EXPORTED', path, round(os.path.getsize(path) / 1048576, 1), 'MB')
except Exception:
    traceback.print_exc()
    print('FAILED')
