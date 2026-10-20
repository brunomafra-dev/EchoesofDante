"""Prepare whole-frame inputs/prompts, list missing footage. Never calls a provider."""
import argparse
import json
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening'
PLAN = json.loads((DOC / 'shots.json').read_text(encoding='utf-8'))
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('shot', nargs='?')
parser.add_argument('part', nargs='?', type=int, choices=[1, 2])
args = parser.parse_args()
if not args.shot:
    for shot in PLAN['shots']:
        if shot.get('approvedPilot'):
            continue
        print(json.dumps({'id': shot['id'], 'seconds': shot['seconds'], 'missing': [i for i in ([1] if shot['seconds']<=5 else [1,2]) if not (DOC / f"source/{shot.get('sourceStem', shot['id'])}-{i:02}.mp4").exists()]}))
else:
    shot = next(s for s in PLAN['shots'] if s['id'] == args.shot and not s.get('approvedPilot'))
    stem = shot.get('sourceStem', shot['id'])
    if not args.part:
        parser.error('Choose part 1 or 2')
    if args.part == 1:
        image = ROOT / shot['image']
        prompt = 'One continuous five-second shot. ' + shot['motion']
        seconds = 5
    else:
        if shot['seconds']<=5:
            parser.error('This short scene needs only one complete take')
        source = DOC / f"source/{stem}-01.mp4"
        c = cv2.VideoCapture(str(source))
        if c.get(cv2.CAP_PROP_FPS) != 16 or c.get(cv2.CAP_PROP_FRAME_COUNT) < 80:
            raise RuntimeError('First take must be inspected and present at 16 FPS before continuation')
        c.set(cv2.CAP_PROP_POS_FRAMES, 79)
        ok, frame = c.read()
        c.release()
        if not ok:
            raise RuntimeError('Cannot extract the complete conditioning frame')
        image = ROOT / f".local/cinematic-opening/inputs/{stem}-02.png"
        image.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(image), frame)
        prompt = 'One continuous continuation of the exact supplied complete scene. ' + shot['ending']
        seconds = min(5, shot['seconds'] - 5 + 0.25)
    prompt += ' Preserve the original painted Organic Sci-Fi R3 game illustration, lighting, anatomy, ship structure, materials and whole-scene composition. Fixed camera, no zoom or pan, no cuts, no text, no subtitles, no music. Real motion inside the scene; never a still-picture slideshow.'
    file = DOC / f"prompts/{stem}-{args.part:02}.txt"
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(prompt + '\n', encoding='utf-8')
    print(json.dumps({'input': image.relative_to(ROOT).as_posix(), 'prompt': file.relative_to(ROOT).as_posix(), 'seconds': seconds, 'seed': shot['seed'] + args.part - 1, 'part': args.part, 'shot': shot['id']}))
