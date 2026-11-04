"""Stage the officially downloaded archive outside public/Git. No login/payment.
Place giant-monster-spiders-free-sample-sample.zip in .local/combat188/.
"""
from pathlib import Path
import hashlib,zipfile
root=Path('.local/combat188');archive=root/'giant-monster-spiders-free-sample-sample.zip'
assert archive.is_file(),f'Download from https://easyforge.itch.io/giant-monster-spiders-free-sample and place at {archive.resolve()}'
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='f4d9b914683561a0423a60425e881f1c58e55a062d85808ad4d78271017f3628','Different archive revision: inspect its contents and licence before updating this pin.'
with zipfile.ZipFile(archive)as z:
 for name in ['LICENSE.txt','README.txt','squinty/squinty_LOD1.glb','squinty/squinty_info.json']:
  data=z.read('Giant-Monster-Spiders-Free-Sample/'+name);(root/Path(name).name).write_bytes(data)
print('Verified official ZIP and staged LOD1/metadata/licence in ignored .local/combat188')
