"""Conservative rest-shape sculpt in Blender. Export deltas, not a new rig.
The optimizer applies these positions to the original GLB, preserving every
joint, inverse bind, weight, animation channel and socket coordinate verbatim.
CC0 Quaternius derivatives; no offline rendering or proprietary artwork.
"""
import bpy, math, json
from mathutils import Vector,Matrix
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.local/crew193';OUT.mkdir(parents=True,exist_ok=True)
report={}
def deform(point,brow,gender):
 x,y,z=point
 if brow:
  center=1.668 if gender=='female' else 1.77
  z=center+(z-center)*(.82 if gender=='female' else .88);y*=.99
 else:
  center=1.59 if gender=='female' else 1.70
  # Leave eyelids and their relationship with the eyes completely unchanged.
  limit=1.645 if gender=='female' else 1.755
  blend=max(0,min(1,(limit-z)/.025));blend=blend*blend*(3-2*blend)
  jaw=math.exp(-((z-center)/.047)**2)*blend
  if z>(1.53 if gender=='female' else 1.64):
   x*=1-jaw*(.12 if gender=='female' else .045)
   if y<-.062:y+=(-.062-y)*jaw*(.24 if gender=='female' else .10)
 return Vector((x,y,z))
for gender in ['male','female']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/f'public/assets/arrival-3d/crew-{gender}.glb'))
 changes=[]
 for o in bpy.data.objects:
  if o.type!='MESH':continue
  if not any('Superhero' in m.name or 'Regular' in m.name for m in o.data.materials) and 'Eyebrows' not in o.name:continue
  for v in o.data.vertices:
   old=v.co.copy();brow='Eyebrows' in o.name;v.co=deform(old,brow,gender);x,y,z=v.co
   if (v.co-old).length>1e-7:
    # Transform original split normals by the local sculpt Jacobian rather
    # than replacing their smooth/crease authoring with per-triangle normals.
    basis=Matrix(((1,0,0),(0,0,1),(0,-1,0)));columns=[]
    for axis in range(3):
     delta=Vector((0,0,0));delta[axis]=.0001
     columns.append((deform(old+delta,brow,gender)-deform(old-delta,brow,gender))/.0002)
    jacobian=Matrix(columns).transposed();normal=basis@jacobian.inverted_safe().transposed()@basis.transposed()
    changes.append({'old':[old.x,old.z,-old.y],'next':[x,z,-y],'normal':[list(r)for r in normal]})
 report[gender]=changes
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'Dante-{gender}-rest-shape.blend'))
(OUT/'sculpt.json').write_text(json.dumps(report),encoding='utf-8')
print('CREW193', {g:len(c)for g,c in report.items()},flush=True)
