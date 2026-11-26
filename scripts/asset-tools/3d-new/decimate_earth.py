import bpy, bmesh, sys, os, random
from mathutils import Vector
# Earth-like Poly Haven nature reduced for a top-down web game.
# Foliage is thinned by removing whole leaves (loose parts) at random and enlarging the survivors, so canopies keep
# their silhouette; bark, rocks and cliffs use collapse decimation.
argv = sys.argv[sys.argv.index('--') + 1:]
src, out = argv[0], argv[1]
only = argv[2].split(',') if len(argv) > 2 and argv[2] else None
os.makedirs(out, exist_ok=True)
TARGET = {'jacaranda_tree': 9000, 'fir_sapling': 6000, 'pine_sapling_small': 6000, 'searsia_lucida': 7000, 'island_tree_02': 9000, 'othonna_cerarioides': 4000,
          'shrub_02': 1500, 'shrub_03': 1500, 'shrub_04': 1500, 'fern_02': 1500, 'weed_plant_02': 1200, 'nettle_plant': 1500, 'grass_bermuda_01': 900,
          'grass_medium_02': 1100, 'dandelion_01': 900, 'root_cluster_01': 2500, 'wild_rooibos_bush': 2000, 'cheiridopsis_succulent': 1500,
          'mountainside': 5000, 'rock_face_01': 2500, 'rock_face_02': 2500, 'namaqualand_cliff_01': 3000, 'namaqualand_boulder_02': 2000}
FOLIAGE = ('tree', 'leaf', 'leaves', 'twig', 'needle', 'branches', 'grass', 'fern', 'shrub', 'plant', 'weed', 'nettle', 'dandelion', 'flower', 'bush', 'rooibos', 'succulent', 'sapling', 'othonna', 'searsia')
BARK = ('bark', 'trunk', 'stem', 'root')
def islands(bm):
    parent = list(range(len(bm.verts)))
    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]; a = parent[a]
        return a
    for f in bm.faces:
        vs = [v.index for v in f.verts]; r = find(vs[0])
        for v in vs[1:]:
            q = find(v)
            if q != r: parent[q] = r
    groups = {}
    for f in bm.faces: groups.setdefault(find(f.verts[0].index), []).append(f)
    return list(groups.values())
def thin(o, keep):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table(); bm.verts.index_update()
    groups = islands(bm)
    if len(groups) < 40: bm.free(); return False
    random.seed(len(groups)); scale = min(1.9, (1 / max(keep, 1e-3)) ** .5)
    dead = []; nf = len(bm.faces); big = max(64, nf * .01)
    small = [g for g in groups if len(g) <= big]; bigf = nf - sum(len(g) for g in small)
    # trunk and branches (large parts) stay; leaves share what is left of the budget
    keep = min(1.0, max(.004, (keep * nf - bigf * .35) / max(1, nf - bigf)))
    for g in groups:
        if len(g) > big: continue
        if random.random() < keep:
            vs = {v for f in g for v in f.verts}; c = sum((v.co for v in vs), Vector()) / len(vs)
            for v in vs: v.co = c + (v.co - c) * scale
        else: dead.extend(g)
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    bm.to_mesh(o.data); bm.free(); return True
def collapse(o, ratio):
    if ratio >= 1: return
    md = o.modifiers.new('dec', 'DECIMATE'); md.ratio = ratio
    bpy.context.view_layer.objects.active = o; bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    bpy.ops.object.modifier_apply(modifier='dec')
for name in sorted(os.listdir(src)):
    if name not in TARGET or (only and name not in only): continue
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, name, name + '.gltf'))
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    total = sum(len(o.data.polygons) for o in meshes); target = TARGET[name]; ratio = min(1.0, target / max(1, total))
    report = []
    for o in meshes:
        mats = ' '.join((s.material.name if s.material else '') for s in o.material_slots).lower() + ' ' + o.name.lower()
        n0 = len(o.data.polygons)
        foliage = any(k in mats for k in FOLIAGE) and not any(k in mats for k in BARK)
        done = False
        if ratio < 1 and foliage: done = thin(o, ratio)
        if ratio < 1 and not done: collapse(o, ratio)
        elif done and len(o.data.polygons) > target * 1.6: collapse(o, target / len(o.data.polygons))
        report.append((o.name, n0, len(o.data.polygons), 'thin' if done else 'collapse'))
    for img in bpy.data.images:
        if img.size[0] > 512: img.scale(512, 512)
    bpy.ops.object.select_all(action='SELECT')
    path = os.path.join(out, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_image_format='JPEG', export_jpeg_quality=80)
    print('DONE', name, total, '->', sum(len(o.data.polygons) for o in meshes), round(os.path.getsize(path) / 1e6, 2), 'MB', report[:5], flush=True)
