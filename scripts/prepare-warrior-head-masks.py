"""Identify the intact female Warrior head; export masks, never repaint artwork."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
result = {}
registration=json.loads((root/'src/visual/actorRegistration.json').read_text(encoding='utf-8'))
for style in ['none', 'basic', 'reinforced']:
    image = np.array(Image.open(root / f'public/assets/visual/complete-actors/warrior-female-{style}.png'))
    result[style] = []
    for row in range(8):
        # The old idle E/N paintings contain gutter strokes on the skull.
        # Their already authored complete contact poses have intact heads.
        col = 1 if row in [2, 4] else 0
        frame=image[row*192:(row+1)*192,col*192:(col+1)*192]
        cx,neck=registration['warrior-female'][style][row*4+col]
        scale=128/(183-neck)
        frame=cv2.warpAffine(frame,np.float32([[scale,0,96-cx*scale],[0,scale,183*(1-scale)]]),(192,192))
        alpha = frame[:55,60:140,3]
        solid = cv2.morphologyEx((alpha > 64).astype('uint8'), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        _, labels, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
        keep = 1 + int(stats[1:, cv2.CC_STAT_AREA].argmax())
        # One pixel retains the painted antialias edge; isolated neighboring
        # weapons/gutter fragments are not part of the head component.
        mask = cv2.dilate((labels == keep).astype('uint8'), np.ones((3, 3), np.uint8))
        spans = []
        for y in range(55):
            xs = np.flatnonzero(mask[y])
            if len(xs):
                spans.append([y, 60+int(xs.min()), int(xs.max()-xs.min()+1)])
        assert len(spans) > 25, (style, row)
        result[style].append(spans)
(root / 'src/visual/warriorFemaleHeads.json').write_text(json.dumps(result, separators=(',', ':'))+'\n', encoding='utf-8')
print('24 female Warrior head masks prepared; source PNGs unchanged.')
