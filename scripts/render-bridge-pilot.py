"""Offline, deterministic cutout/skeletal film authoring (never imported by Vite).

Original painted source parts: docs/cinematic-pilot/source; provenance/prompts
alongside them. Requires the existing authoring tools Pillow, numpy, OpenCV and
imageio-ffmpeg. Runtime consumes only MP4/poster/VTT. No moving camera/zoom.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import tempfile
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/cinematic-pilot/source'
OUT = ROOT / 'public/assets/cinematic-pilot'
QA = ROOT / 'docs/cinematic-pilot/qa'
W, H, FPS, SECONDS = 1280, 720, 24, 12


def ease(a: float, b: float, t: float) -> float:
    v = max(0., min(1., (t - a) / (b - a)))
    return v * v * (3 - 2 * v)


def gesture(a: float, b: float, c: float, d: float, t: float) -> float:
    return ease(a, b, t) * (1 - ease(c, d, t))


def lerp(a, b, t):
    return np.array(a, dtype=float) * (1 - t) + np.array(b, dtype=float) * t


def joint(a, b, upper, lower, bend):
    """Fixed-length two-bone IK, with a deliberately authored elbow/knee side."""
    a, b = np.array(a, float), np.array(b, float)
    delta = b - a
    dist = max(.001, min(float(np.linalg.norm(delta)), upper + lower - .05))
    direction = delta / max(.001, float(np.linalg.norm(delta)))
    along = (upper * upper - lower * lower + dist * dist) / (2 * dist)
    height = math.sqrt(max(0., upper * upper - along * along))
    return a + direction * along + np.array([-direction[1], direction[0]]) * height * bend


def crop_part(sheet, rect):
    part = sheet.crop(rect)
    alpha = part.getchannel('A')
    # Registration ignores isolated semitransparent export dust, not anatomy.
    box = alpha.point(lambda v: 255 if v > 70 else 0).getbbox()
    assert box, rect
    part = part.crop(box)
    clean = np.array(part)
    clean[:, :, 3][clean[:, :, 3] < 25] = 0
    return Image.fromarray(clean)


# Explicit registration of these exact painted source sheets; not a heuristic
# that assumes AI laid all twelve parts out in equal cells.
RECTS = [
    (0, 0, 445, 400), (445, 65, 765, 400),
    (765, 0, 1100, 415), (1100, 0, 1448, 415),
    (20, 405, 360, 725), (445, 410, 765, 725),
    (770, 420, 1100, 730), (1100, 420, 1448, 730),
    (20, 730, 435, 1086), (445, 730, 750, 1086),
    (755, 735, 1100, 1086), (1100, 740, 1448, 1086),
]


class Actor:
    def __init__(self, identity):
        self.identity = identity
        sheet = Image.open(SOURCE / f'{identity}.png').convert('RGBA')
        self.parts = [crop_part(sheet, r) for r in RECTS]
        # Head drawings both lean toward screen-right. Mirroring is explicit,
        # not pretending that the two generated cells provide opposite yaws.
        self.head_right = self.parts[3]
        self.head_left = self.parts[2].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        self.bitmaps = {}
        self.shadow = Image.new('RGBA', (100, 34))
        ImageDraw.Draw(self.shadow).ellipse((17, 10, 81, 25), fill=(6, 10, 9, 132))
        self.shadow = self.shadow.filter(ImageFilter.GaussianBlur(3))
        self.last = {}

    def stamp(self, frame, part, position, size, pivot=(.5, .5), angle=0., mirror=False, opacity=1.):
        if isinstance(part, int):
            part = self.parts[part]
        # Premultiplied-alpha warp avoids black cutout fringes at moving edges.
        key = (id(part), mirror)
        if key not in self.bitmaps:
            source = part.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if mirror else part.copy()
            source.thumbnail((256, 256), Image.Resampling.LANCZOS)
            src = np.array(source).astype(np.float32) / 255
            src[:, :, :3] *= src[:, :, 3:4]
            self.bitmaps[key] = src
        src = self.bitmaps[key]
        sh, sw = src.shape[:2]
        sx, sy = size[0] / sw, size[1] / sh
        c, s = math.cos(angle), math.sin(angle)
        matrix = np.array([[c * sx, -s * sy, 0.], [s * sx, c * sy, 0.]], np.float32)
        matrix[:, 2] = np.array(position) - matrix[:, :2] @ np.array([pivot[0] * sw, pivot[1] * sh])
        corners = matrix[:, :2] @ np.array([[0, sw, sw, 0], [0, 0, sh, sh]]) + matrix[:, 2:3]
        lo = np.maximum(0, np.floor(corners.min(axis=1) - 2).astype(int))
        hi = np.minimum([W, H], np.ceil(corners.max(axis=1) + 2).astype(int))
        if np.any(hi <= lo):
            return
        matrix[:, 2] -= lo
        warped = cv2.warpAffine(src, matrix, tuple(hi - lo), flags=cv2.INTER_CUBIC)
        alpha = np.clip(warped[:, :, 3:4], 0, 1) * opacity
        color = np.clip(warped[:, :, :3], 0, 1) * opacity
        roi = frame[lo[1]:hi[1], lo[0]:hi[0]]
        roi[:] = color * 255 + roi * (1 - alpha)

    def bone(self, frame, part, a, b, width, mirror=False):
        a, b = np.array(a), np.array(b)
        delta = b - a
        length = np.linalg.norm(delta)
        # Rounded attachment ends overlap into sleeve/knee by 5 pixels;
        # neither shoulders nor elbows are disconnected floating cutouts.
        self.stamp(frame, part, a, (width, length + 10), (.5, 5 / (length + 10)),
                   math.atan2(delta[1], delta[0]) - math.pi / 2, mirror)

    def arm(self, frame, shoulder, wrist, side, hand=6, operating=0.):
        # Continuous projected pole turn: the near elbow passes behind the
        # forearm as the hand leaves the console, rather than jumping sides.
        elbow = joint(shoulder, wrist, 51, 45, side * (1 - operating) - operating)
        angle = math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0])
        # Root is the wrist end, never the centre of the hand painting.
        if hand == 11:
            self.stamp(frame, hand, wrist, (33, 19), (.93, .48), angle - math.pi)
        else:
            self.stamp(frame, hand, wrist, (18 if hand == 6 else 23, 24), (.5, .09), angle - math.pi / 2, side < 0)
        self.bone(frame, 5, elbow, wrist, 19 if self.identity == 'ivo' else 15, side < 0)
        self.bone(frame, 4, shoulder, elbow, 27 if self.identity == 'ivo' else 23, side < 0)
        return elbow

    def render(self, frame, t):
        ivo = self.identity == 'ivo'
        if ivo:
            x, ground = 377., 535.
            walking = 0.
        else:
            x, ground = nara_x(t), 585.
            walking = gesture(.45, .85, 3.8, 4.35, t)
        breath = math.sin(t * 2.1 + (1 if ivo else 0)) * .6
        # Hips/shoulders share the same torso transform.
        lean = -.025 if ivo else -.035 * walking + .018 * gesture(4.1, 4.6, 7.1, 7.7, t)
        rot = np.array([[math.cos(lean), -math.sin(lean)], [math.sin(lean), math.cos(lean)]])
        origin_y = ground + breath
        if not ivo:
            # Lower the hips only as far as the planted/swinging feet require.
            # The previous fixed hip height made IK targets unreachable and
            # produced conspicuously crouched / lengthened legs.
            vertical = []
            for side in [-1, 1]:
                ankle = nara_foot(t, side)
                hip = rot @ np.array([side * 12, -126])
                dx = ankle[0] - (x + hip[0])
                vertical.append(ankle[1] - math.sqrt(max(1., 113.4 ** 2 - dx ** 2)) - hip[1])
            origin_y = max(origin_y, max(vertical))
        origin = np.array([x, origin_y])
        def p(x, y):
            return origin + rot @ np.array([x, y])
        shoulders = [p(-31 if ivo else -27, -209), p(29 if ivo else 27, -207)]

        if ivo:
            contact = gesture(-1, 0, 2.6, 3.3, t) + gesture(9.6, 10.4, 12.1, 12.4, t)
            contact = min(1., contact)
            tap = math.sin(t * 17) * 2.3 * gesture(.5, .9, 2.4, 2.8, t)
            wrists = [lerp(p(-38, -115), [281, 323 + tap], contact),
                      lerp(p(37, -116), [321, 328 + tap * .4], contact)]
            explain = gesture(3.1, 3.8, 5.3, 6.2, t)
            wrists[1] = lerp(wrists[1], p(73, -171), explain)
            hand = 7 if explain > .3 else 6
            head_turn = ease(2.7, 3.45, t) * (1 - ease(10.3, 11.1, t))
        else:
            swing = math.sin((t - .55) * math.pi / .58) * walking
            wrists = [p(-35 - swing * 13, -113 - max(0, swing) * 9),
                      p(35 + swing * 13, -114 + min(0, swing) * 9)]
            explain = gesture(4.5, 5.15, 6.7, 7.35, t)
            indicate = gesture(8., 8.65, 10.8, 11.6, t)
            wrists[0] = lerp(wrists[0], p(-68, -174), explain)
            wrists[1] = lerp(wrists[1], p(78, -203), indicate)
            hand = 11 if indicate > .35 else 6
            head_turn = ease(7.5, 8.35, t)

        feet = []
        for side in [-1, 1]:
            if ivo:
                ankle = np.array([x + side * 17, ground - 13])
            else:
                ankle = nara_foot(t, side)
            hip = p(side * (14 if ivo else 12), -126)
            knee = joint(hip, ankle, 55, 59, 1)
            feet.append((hip, knee, ankle))

        # Floor contact shadow for planted feet, never a floating general halo.
        for _, _, ankle in feet:
            height = max(0., ground - 13 - ankle[1])
            self.stamp(frame, self.shadow, (ankle[0] - 4, ground + 2), (75, 25), opacity=1 - min(.5, height * .02))

        # Far limbs -> legs -> pelvis -> torso -> near arm -> neckline/head.
        self.arm(frame, shoulders[0], wrists[0], -1, 7 if not ivo and explain > .35 else 6,
                 contact if ivo else 0.)
        for i, (hip, knee, ankle) in enumerate(feet):
            self.stamp(frame, 10, ankle, (34 if ivo else 32, 27), (.65, .15), -.05 if i == 0 else .05)
            self.bone(frame, 9, knee, ankle, 24 if ivo else 22, i == 1)
            self.bone(frame, 8, hip, knee, 30 if ivo else 27, i == 1)
        self.stamp(frame, 1, p(0, -126), (66 if ivo else 61, 40), (.5, .28), lean)
        self.stamp(frame, 0, p(0, -136), (87 if ivo else 78, 100), (.5, .95), lean, True)
        self.arm(frame, shoulders[1], wrists[1], 1, hand, contact if ivo else 0.)
        # Yaw is a brief narrowed profile turn between two painted views, not
        # a ghostly dissolve of two full heads. Neck remains in the collar.
        head = self.head_right if head_turn > .5 else self.head_left
        narrowing = 1 - .24 * math.sin(head_turn * math.pi)
        nod = math.sin(t * 3.6) * .022 * (explain if not ivo else .4)
        self.stamp(frame, head, p(0, -227), ((48 if ivo else 43) * narrowing, 57 if ivo else 54),
                   (.5, .94), lean + nod + (-.035 if ivo else -.02))
        self.last = {'x': x, 'hips': [list(f[0]) for f in feet], 'feet': [list(f[2]) for f in feet], 'shoulders': [list(s) for s in shoulders],
                     'wrists': [list(w) for w in wrists], 'headTurn': head_turn}


def nara_x(t):
    # Smooth approach/deceleration, no whole-sprite hovering or scrolling plate.
    return 969 - 249 * ease(.55, 4.15, t)


def nara_foot(t, side):
    # Each foot is world-locked through stance; only its own swing lifts it.
    start = .55 if side < 0 else 1.03
    events = [start + i * 1.16 for i in range(4)]
    old = 969 + side * 14
    for takeoff in events:
        if takeoff > 4.:
            continue
        landing = min(4.3, takeoff + .5)
        target = nara_x(min(4.15, landing + .13)) + side * 14
        if t < takeoff:
            return np.array([old, 572.])
        if t < landing:
            s = ease(takeoff, landing, t)
            return np.array([old * (1 - s) + target * s, 572 - math.sin(s * math.pi) * 20])
        old = target
    # Final small settling step keeps a useful stance rather than crossing feet.
    settle = ease(4.1, 4.55, t)
    return np.array([old * (1 - settle) + (720 + side * 14) * settle,
                     572 - (10 if side < 0 else 1) * math.sin(settle * math.pi)])


def panel_motion(frame, t):
    overlay = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(overlay)
    # Local scan sweeps stay inside the two functional screen surfaces.
    for x, y, w in [(169, 304, 65), (1081, 323, 64)]:
        progress = (t * .32) % 1
        d.line((x, y + progress * 12, x + w, y + 5 + progress * 12), fill=(107, 180, 100, 100), width=2)
    data = np.array(overlay, dtype=np.float32)
    alpha = data[:, :, 3:4] / 255
    frame[:] = frame * (1 - alpha) + data[:, :, :3] * alpha


def soundtrack(path):
    rate = 48000
    t = np.arange(SECONDS * rate, dtype=np.float64) / rate
    rng = np.random.default_rng(104105)
    noise = rng.normal(0, 1, len(t))
    soft = np.convolve(noise, np.ones(180) / 180, 'same')
    sound = .043 * np.sin(2 * math.pi * 49 * t) + .022 * np.sin(2 * math.pi * 73.5 * t) + soft * .25
    for at in [1.05, 1.53, 2.21, 2.69, 3.37, 3.85, 4.55]:
        dt = np.maximum(0, t - at)
        envelope = (t >= at) * np.exp(-dt * 38)
        sound += envelope * (noise * .085 + np.sin(2 * math.pi * (107 * dt - 24 * dt * dt)) * .08)
    for at in [.63, 1.65, 2.25, 9.95, 10.38]:
        dt = np.maximum(0, t - at)
        env = (t >= at) * np.minimum(1, dt * 180) * np.exp(-dt * 14)
        sound += env * .027 * np.sin(2 * math.pi * (620 * dt + 80 * dt * dt))
    fade = np.minimum(1, t / .4) * np.minimum(1, (SECONDS - t) / .7)
    sound *= np.maximum(0, fade)
    stereo = np.column_stack((sound, sound * .92 + np.roll(soft, 120) * .025))
    peak = float(np.max(np.abs(stereo)))
    assert peak < .95
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(rate)
        f.writeframes((np.clip(stereo, -1, 1) * 32767).astype('<i2').tobytes())
    return peak


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stills-only', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True); QA.mkdir(parents=True, exist_ok=True)
    background = np.array(Image.open(SOURCE / 'bridge.png').convert('RGB').resize((W, H), Image.Resampling.LANCZOS), dtype=np.float32)
    actors = [Actor('ivo'), Actor('nara')]
    def render(t):
        frame = background.copy()
        panel_motion(frame, t)
        for actor in actors:
            actor.render(frame, t)
        return Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8))
    samples = []
    for t in [.75, 2.4, 4.8, 6.2, 9.4, 11.4]:
        render(t).save(QA / f'frame-{t:.2f}.jpg', quality=92)
        samples.append({'seconds': t, 'actors': {a.identity: a.last for a in actors}})
    render(6.2).save(OUT / 'bridge-poster.webp', quality=90)
    if args.stills_only:
        return
    with tempfile.TemporaryDirectory(prefix='dante-bridge-') as temp:
        temp = Path(temp)
        silent, audio = temp / 'picture.mp4', temp / 'bridge.wav'
        writer = imageio_ffmpeg.write_frames(str(silent), (W, H), fps=FPS, codec='libx264',
            pix_fmt_in='rgb24', pix_fmt_out='yuv420p', ffmpeg_log_level='error',
            output_params=['-crf', '20', '-preset', 'medium', '-an'])
        writer.send(None)
        try:
            for i in range(FPS * SECONDS):
                writer.send(render(i / FPS).tobytes())
                if i % 48 == 0:
                    print(f'Frame {i + 1}/{FPS * SECONDS}', flush=True)
        finally:
            writer.close()
        peak = soundtrack(audio)
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-i', str(silent), '-i', str(audio),
            '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-t', str(SECONDS), '-movflags', '+faststart',
            str(OUT / 'bridge-pilot.mp4')], check=True, capture_output=True)
    manifest = {'width': W, 'height': H, 'fps': FPS, 'frames': FPS * SECONDS, 'duration': SECONDS,
        'camera': 'locked; no pan, zoom, crossfade or whole-scene transform',
        'animation': 'original illustrated cutout parts; fixed-length IK arms/legs; planted feet; authored actions',
        'audioPeakBeforeEncode': peak, 'sources': {}, 'samples': samples,
        'videoBytes': (OUT / 'bridge-pilot.mp4').stat().st_size}
    for path in SOURCE.glob('*.png'):
        manifest['sources'][path.name] = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'size': Image.open(path).size}
    (QA / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Wrote {manifest["videoBytes"]:,} bytes; {SECONDS}s / {FPS} FPS / {W}x{H}', flush=True)


if __name__ == '__main__':
    raise SystemExit('REJEITADO: piloto 0.1.105. Render por membros desativado. Leia docs/cinematic-pilot/revision-02/README.md; o novo filme exige animar personagens inteiros.')
