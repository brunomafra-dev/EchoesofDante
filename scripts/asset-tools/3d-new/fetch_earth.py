import json, os, sys, urllib.request
# Earth-like nature for the 3D regions (Poly Haven, CC0): trees, shrubs, ground cover, cliffs and ground textures.
UA = {'User-Agent': 'asset-prep/1.0'}
def get(url, path):
    if os.path.exists(path): return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(path, 'wb') as f: f.write(r.read())
def files(i): return json.load(urllib.request.urlopen(urllib.request.Request('https://api.polyhaven.com/files/' + i, headers=UA)))
root = sys.argv[1]
models = ['jacaranda_tree', 'fir_sapling', 'pine_sapling_small', 'searsia_lucida', 'island_tree_02', 'othonna_cerarioides',
          'shrub_02', 'shrub_03', 'shrub_04', 'fern_02', 'weed_plant_02', 'nettle_plant', 'grass_bermuda_01', 'grass_medium_02',
          'dandelion_01', 'root_cluster_01', 'wild_rooibos_bush', 'cheiridopsis_succulent',
          'mountainside', 'rock_face_01', 'rock_face_02', 'namaqualand_cliff_01', 'namaqualand_boulder_02']
only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
for m in models:
    if only and m not in only: continue
    g = files(m)['gltf']['1k']['gltf']; d = os.path.join(root, 'models', m)
    get(g['url'], os.path.join(d, m + '.gltf'))
    for rel, info in g['include'].items(): get(info['url'], os.path.join(d, rel))
    print('model', m, flush=True)
for t in ['sparse_grass', 'leafy_grass', 'aerial_grass_rock', 'mud_forest']:
    if only and t not in only: continue
    f = files(t); d = os.path.join(root, 'textures', t)
    for key, name in (('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough')):
        get(f[key]['1k']['jpg']['url'], os.path.join(d, name + '.jpg'))
    print('texture', t, flush=True)
