"""Historical format QA for REJECTED 0.1.105; NOT validation of the new film."""
from pathlib import Path
import importlib.util
import json
import math
import subprocess
import sys

import cv2
import numpy as np
import imageio_ffmpeg

sys.dont_write_bytecode = True

root = Path(__file__).resolve().parents[1]
cap = cv2.VideoCapture(str(root / 'public/assets/cinematic-pilot/bridge-pilot.mp4'))
assert cap.isOpened()
report = {'width': cap.get(cv2.CAP_PROP_FRAME_WIDTH), 'height': cap.get(cv2.CAP_PROP_FRAME_HEIGHT),
          'fps': cap.get(cv2.CAP_PROP_FPS), 'frames': cap.get(cv2.CAP_PROP_FRAME_COUNT)}
assert (report['width'], report['height'], report['fps'], report['frames']) == (1280, 720, 24, 288)
frames = []
for i in range(288):
    ok, frame = cap.read()
    assert ok, i
    if i in (24, 60, 120, 225):
        frames.append(frame.astype(float))
cap.release()
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i',
    str(root / 'public/assets/cinematic-pilot/bridge-pilot.mp4'), '-map', '0:a:0', '-f', 'null', '-'],
    check=True, capture_output=True)
report['audioDecode'] = 'AAC track decoded successfully'
# Encoding can change very slightly near inter-frame blocks. A fixed viewport
# region should not slide or zoom; actors must actually change inside theirs.
report['fixedWindowMeanDifference'] = float(np.abs(frames[0][40:150, 500:800] - frames[-1][40:150, 500:800]).mean())
report['naraMotionMeanDifference'] = float(np.abs(frames[0][300:605, 650:1020] - frames[2][300:605, 650:1020]).mean())
report['ivoMotionMeanDifference'] = float(np.abs(frames[0][240:540, 250:470] - frames[-1][240:540, 250:470]).mean())
assert report['fixedWindowMeanDifference'] < 1.5
assert report['naraMotionMeanDifference'] > 2
assert report['ivoMotionMeanDifference'] > 1

# Exercise the authoring rig numerically without re-rendering 288 frames.
spec = importlib.util.spec_from_file_location('film', root / 'scripts/render-bridge-pilot.py')
film = importlib.util.module_from_spec(spec); spec.loader.exec_module(film)
max_leg = 0
for t in np.arange(0, 12, 1/24):
    x = film.nara_x(t)
    walk = film.gesture(.45, .85, 3.8, 4.35, t)
    lean = -.035 * walk + .018 * film.gesture(4.1, 4.6, 7.1, 7.7, t)
    rot = np.array([[math.cos(lean), -math.sin(lean)], [math.sin(lean), math.cos(lean)]])
    origin_y = 585 + math.sin(t * 2.1) * .6
    for side in [-1, 1]:
        ankle = film.nara_foot(t, side)
        hip = rot @ np.array([side * 12, -126])
        dx = ankle[0] - (x + hip[0])
        origin_y = max(origin_y, ankle[1] - math.sqrt(max(1, 113.4**2 - dx**2)) - hip[1])
    for side in [-1, 1]:
        max_leg = max(max_leg, float(np.linalg.norm(film.nara_foot(t, side) - (np.array([x, origin_y]) + rot @ np.array([side * 12, -126])))))
assert max_leg < 114, max_leg
report['maximumLegTargetDistance'] = max_leg
report['passed'] = True
report['visualStatus'] = '0.1.105 rejected by user; this is historical technical QA only'
report['limitation'] = 'Checks encoding, independent character motion and reachable leg targets. Does not approve acting, anatomical naturalness or cinematic quality.'
(root / 'docs/cinematic-pilot/qa/media-report.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, indent=2))
