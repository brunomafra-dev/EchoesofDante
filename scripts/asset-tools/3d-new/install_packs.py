import bpy, os, glob, sys, addon_utils
mod = 'bl_ext.blender_org.mpfb'
try:
    __import__(mod)
except Exception as e:
    print('import failed', e)
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.locationservice import LocationService
packs_dir = LocationService.get_user_data('packs')
data_dir = LocationService.get_user_data('')
print('USER_DATA', data_dir, 'PACKS', packs_dir)
for z in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), 'packs', '*.zip'))) if False else sorted(glob.glob(os.environ['PACKS_GLOB'])):
    problem = AssetService.check_asset_pack_zip(z)
    if problem:
        print('PROBLEM', os.path.basename(z), problem); continue
    res = AssetService.fix_and_extract_asset_pack_zip(z, data_dir)
    print('INSTALLED' if not res else 'ERR %s' % res, os.path.basename(z))
print('PACK_NAMES', AssetService.get_pack_names())
