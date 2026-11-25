import json, os, sys, urllib.request
UA = {'User-Agent': 'asset-prep/1.0'}
def get(url, path):
    if os.path.exists(path): return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(path, 'wb') as f: f.write(r.read())
def files(i): return json.load(urllib.request.urlopen(urllib.request.Request('https://api.polyhaven.com/files/' + i, headers=UA)))
root = sys.argv[1]
models = ['dead_tree_trunk_02','dead_quiver_trunk','tree_stump_01','tree_stump_02','dead_tree_trunk','dry_branches_medium_01','dead_quiver_branch_01',
          'rock_moss_set_01','rock_moss_set_02','rock_07','rock_09','stone_01','boulder_01','namaqualand_boulder_04']
for m in models:
    g = files(m)['gltf']['1k']['gltf']; d = os.path.join(root, 'models', m)
    get(g['url'], os.path.join(d, m + '.gltf'))
    for rel, info in g['include'].items(): get(info['url'], os.path.join(d, rel))
    print('model', m)
for t in ['burned_ground_01', 'forest_ground_04', 'dry_decay_leaves']:
    f = files(t); d = os.path.join(root, 'textures', t)
    for key, name in (('Diffuse', 'diff'), ('nor_gl', 'nor'), ('Rough', 'rough')):
        get(f[key]['1k']['jpg']['url'], os.path.join(d, name + '.jpg'))
    print('texture', t)
