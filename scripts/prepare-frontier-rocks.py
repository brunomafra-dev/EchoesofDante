"""Fetch the creator's CC0 1K glTF; embed original bytes in a self-hosted GLB.

No runtime API dependency, image editing, geometry generation or external decoder.
Downloads are verified against the creator API's MD5 and recorded with SHA256.
"""
import hashlib,json,struct,urllib.request
from pathlib import Path

asset='rock_moss_set_02'
headers={'User-Agent':'EchoesOfDante/visual-evaluation (+https://echosofdante.vercel.app)'}
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=40) as response:return response.read()
api='https://api.polyhaven.com/files/'+asset
record=json.loads(get(api))['gltf']['1k']['gltf']
sources=[]
def fetch(meta):
 data=get(meta['url'])
 assert len(data)==meta['size'] and hashlib.md5(data).hexdigest()==meta['md5'],meta['url']
 sources.append({'url':meta['url'],'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 return data
gltf=json.loads(fetch(record))
binary=bytearray(fetch(record['include'][gltf['buffers'][0]['uri']]))
for image in gltf['images']:
 data=fetch(record['include'][image.pop('uri')])
 binary.extend(b'\0'*((-len(binary))%4))
 image['bufferView']=len(gltf['bufferViews'])
 gltf['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(data)})
 binary.extend(data)
gltf['buffers']=[{'byteLength':len(binary)}]
binary.extend(b'\0'*((-len(binary))%4))
encoded=json.dumps(gltf,separators=(',',':')).encode()
encoded+=b' '*((-len(encoded))%4)
glb=struct.pack('<III',0x46546c67,2,28+len(encoded)+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary
out=Path('public/assets/frontier-3d/rock-moss.glb');out.write_bytes(glb)
manifest={'asset':asset,'creator':'Kless Gyzen / Poly Haven','license':'CC0-1.0','licenseUrl':'https://polyhaven.com/license','source':'https://polyhaven.com/a/'+asset,'repository':'https://github.com/Poly-Haven/Public-API','api':api,'processing':'Original 1K JPEGs and geometry unchanged; external glTF buffer/images embedded in GLB. Runtime centers four variants and fits each to the existing horizontal collider.','downloads':sources,'files':[{'file':out.name,'sha256':hashlib.sha256(glb).hexdigest(),'bytes':len(glb)}]}
Path('public/assets/frontier-3d/scenery.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(out,len(glb),'bytes; all creator downloads verified')
