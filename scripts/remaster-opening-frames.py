"""Offline selective whole-frame restoration for bridge/landing, never at runtime.

Official Real-ESRGAN ncnn binary/models stay in ignored .local/tools. This prepares
the 16fps frames; the assembler mixes restored/original before interpolation.
"""
import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys
import time
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('opening', ROOT / 'scripts/assemble-cinematic-opening.py')
opening = importlib.util.module_from_spec(spec)
spec.loader.exec_module(opening)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--revision', choices=['revision-02', 'revision-03'], default='revision-02')
parser.add_argument('--shots', nargs='+', choices=['bridge', 'landing'], default=['bridge', 'landing'])
args = parser.parse_args()
WORK = ROOT / f'.local/cinematic-opening/{args.revision}/restoration'
tool = ROOT / '.local/tools/upscale/realesrgan-ncnn-vulkan-v0.2.0-windows/realesrgan-ncnn-vulkan.exe'
model = ROOT / '.local/tools/upscale/models-bundle/models'
all_inputs, all_outputs = WORK / 'input', WORK / 'output'
all_inputs.mkdir(parents=True, exist_ok=True)
all_outputs.mkdir(parents=True, exist_ok=True)
manifest = {'model': 'realesr-animevideov3 x2', 'blend': .55, 'sourceSize': [832,480],
            'restoredSize': [1664,960], 'sourceFps': 16, 'nativeHD': False,
            'binarySha256': opening.digest(tool),
            'modelSha256': opening.digest(model / 'realesr-animevideov3-x2.bin'), 'shots': []}
for shot in opening.PLAN['shots']:
    if shot['id'] not in args.shots:
        continue
    used, index = [], 0
    for source, start, count in opening.sources(shot):
        used.append({'path': source.relative_to(ROOT).as_posix(), 'sha256': opening.digest(source), 'start': start, 'count': count})
        cap = cv2.VideoCapture(str(source))
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        for _ in range(count):
            ok, frame = cap.read()
            if not ok:
                raise RuntimeError(f'Incomplete source: {source}')
            file = all_inputs / f"{shot['id']}-{index:04}.png"
            assert cv2.imwrite(str(file), frame)
            index += 1
        cap.release()
    manifest['shots'].append({'id': shot['id'], 'frames': index, 'source': used})
(WORK / 'sources.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
started = time.monotonic()
with (WORK / 'upscale.log').open('w') as log:
    process = subprocess.Popen([str(tool), '-i', str(all_inputs), '-o', str(all_outputs), '-m', str(model),
                                '-n', 'realesr-animevideov3', '-s', '2', '-t', '256', '-j', '2:2:2'], stdout=log, stderr=log)
    while process.poll() is None:
        print(json.dumps({'restoredFrames': len(list(all_outputs.glob('*.png'))),
                          'total': sum(s['frames'] for s in manifest['shots']), 'seconds': round(time.monotonic()-started)}), flush=True)
        time.sleep(20)
if process.returncode:
    raise RuntimeError(f'Real-ESRGAN failed {process.returncode}; see {WORK}/upscale.log')
manifest['elapsedSeconds'] = time.monotonic()-started
for shot in manifest['shots']:
    for i in range(shot['frames']):
        p = all_outputs / f"{shot['id']}-{i:04}.png"
        frame = cv2.imread(str(p))
        assert frame is not None and frame.shape[:2] == (960, 1664), str(p)
manifest['passed'] = True
(ROOT / f'docs/cinematic-opening/{args.revision}/restoration.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print('Restoration complete; no runtime model needed.', flush=True)
