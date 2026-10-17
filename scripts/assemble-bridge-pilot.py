"""Offline whole-frame video assembly. No character cutouts or game runtime generation.

Requires the author's existing numpy, OpenCV and imageio-ffmpeg packages.
Run from the repository root: python scripts/assemble-bridge-pilot.py
"""
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.local/cinematic-pilot/pilot-12/assembly'
DOC = ROOT / 'docs/cinematic-pilot/revision-04'
PUBLIC = ROOT / 'public/assets/cinematic-pilot'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
TAKES = [PUBLIC / 'bridge-hf-motion-test.mp4', DOC / 'source/take-02.mp4', DOC / 'source/take-03.mp4']
OUTPUT = PUBLIC / 'bridge-whole-scene-pilot.mp4'
CAPTIONS = [
    (0.5, 3.8, 'IVO', 'Água líquida. Atmosfera compatível.'),
    (4.1, 6.8, 'NARA', 'Então existe uma chance.'),
    (7.2, 11.6, 'NARA', 'Prepare o reconhecimento. Ninguém desce sozinho.'),
]


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def clock(seconds, sep='.'):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}'


def ass_clock(seconds):
    return clock(seconds)[:-1]


def ambience():
    """Original restrained cabin hum/air/console sounds, not a loop or voiceover."""
    sr = 48000
    t = np.arange(sr * 12, dtype=np.float64) / sr
    rng = np.random.default_rng(108)
    noise = rng.normal(0, 1, len(t))
    spectrum = np.fft.rfft(noise)
    hz = np.fft.rfftfreq(len(t), 1 / sr)
    spectrum *= np.minimum(1, hz / 110) / (1 + (hz / 1450) ** 2)
    air = np.fft.irfft(spectrum, n=len(t))
    air /= max(np.std(air), 1e-8)
    hum = (0.045 * np.sin(2*np.pi*48*t) + 0.024 * np.sin(2*np.pi*96*t + 0.4)
           + 0.012 * np.sin(2*np.pi*144*t)) * (0.93 + 0.07*np.sin(2*np.pi*0.13*t))
    left = hum + 0.018 * air
    right = hum + 0.018 * np.roll(air, 203)
    for start, freq in [(0.9, 660), (1.12, 880), (2.8, 590), (9.4, 740)]:
        age = t - start
        env = np.where(age >= 0, np.exp(-np.maximum(age, 0) / 0.065), 0)
        ping = 0.024 * np.sin(2*np.pi*freq*age) * env
        left += ping * 0.8
        right += ping
    fade = np.clip(t / 0.5, 0, 1) * np.clip((12-t)/0.8, 0, 1)
    stereo = np.stack((left*fade, right*fade), axis=1)
    assert np.max(np.abs(stereo)) < 0.4
    path = WORK / 'bridge-ambience.wav'
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(sr)
        f.writeframes((stereo * 32767).astype('<i2').tobytes())
    return path, {'sampleRate': sr, 'channels': 2, 'seconds': 12,
                  'peak': float(np.max(np.abs(stereo))), 'rms': float(np.sqrt(np.mean(stereo**2))),
                  'origin': 'Original deterministic NumPy synthesis; no samples, music or voiceover'}


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    metadata = []
    for path in TAKES:
        c = cv2.VideoCapture(str(path))
        info = {'path': path.relative_to(ROOT).as_posix(), 'sha256': sha(path),
                'width': int(c.get(3)), 'height': int(c.get(4)),
                'fps': c.get(5), 'frames': int(c.get(7)), 'bytes': path.stat().st_size}
        c.release()
        assert (info['width'], info['height'], info['fps']) == (832, 480, 16.0), info
        metadata.append(info)
    assert [m['frames'] for m in metadata] == [81, 81, 37]
    # Keep real motion only. Condition frames at the two seams are not duplicated.
    # Four extra real source frames provide interpolation lookahead past 12 seconds.
    ranges = [(0, 80), (1, 81), (1, 37)]
    intermediate = WORK / 'whole-motion-source.mp4'
    pipe = subprocess.Popen([FFMPEG, '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                             '-s', '832x480', '-r', '16', '-i', '-', '-an', '-c:v', 'libx264',
                             '-preset', 'fast', '-crf', '12', '-pix_fmt', 'yuv420p', str(intermediate)],
                            stdin=subprocess.PIPE)
    frames = 0
    try:
        for path, (start, stop) in zip(TAKES, ranges):
            c = cv2.VideoCapture(str(path))
            c.set(cv2.CAP_PROP_POS_FRAMES, start)
            for _ in range(start, stop):
                ok, frame = c.read()
                if not ok:
                    raise RuntimeError(f'Missing source frame in {path}')
                pipe.stdin.write(frame.tobytes())
                frames += 1
            c.release()
    finally:
        pipe.stdin.close()
    if pipe.wait() != 0:
        raise RuntimeError('Source assembly failed')
    assert frames == 196
    audio, audio_info = ambience()
    ass = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Segoe UI,29,&H00F3F3E8,&H000000FF,&HAD101610,&HA0101610,0,0,0,0,100,100,0,0,3,8,0,8,75,75,32,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    vtt = 'WEBVTT\n\n'
    for start, end, speaker, text in CAPTIONS:
        ass += f'Dialogue: 0,{ass_clock(start)},{ass_clock(end)},Default,,0,0,0,,{{\\b1\\c&H83BBD9&}}{speaker}{{\\b0\\c&HF3F3E8&}}: {text}\n'
        vtt += f'{clock(start)} --> {clock(end)}\n{speaker}: {text}\n\n'
    (WORK / 'captions.ass').write_text(ass, encoding='utf-8')
    (PUBLIC / 'bridge-whole-scene-pilot.pt-BR.vtt').write_text(vtt.rstrip() + '\n', encoding='utf-8')
    filters = ('minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff,'
               'scale=1248:720:flags=lanczos,pad=1280:720:16:0:color=0x030806,setsar=1,'
               'ass=captions.ass')
    subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'warning', '-i', str(intermediate),
                    '-i', str(audio), '-vf', filters, '-t', '12', '-c:v', 'libx264', '-preset', 'medium',
                    '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000',
                    '-movflags', '+faststart', str(OUTPUT)], cwd=WORK, check=True)
    c = cv2.VideoCapture(str(OUTPUT))
    result = {'width': int(c.get(3)), 'height': int(c.get(4)), 'fps': c.get(5),
              'frames': int(c.get(7)), 'bytes': OUTPUT.stat().st_size, 'sha256': sha(OUTPUT)}
    c.release()
    assert (result['width'], result['height'], result['fps'], result['frames']) == (1280, 720, 24.0, 288), result
    report = {'sources': metadata, 'keptFrameRangesExclusive': ranges, 'sourceFrames': frames,
              'sourceSecondsIncludingLookahead': frames / 16,
              'processing': 'Whole frames; remove duplicate conditioning frames; motion-compensated 16 to 24 FPS interpolation; Lanczos upscale without stretching; trim to 12 s; burn PT-BR captions; original stereo ambience',
              'native720p24': False, 'loopOrFreezeOrSlowMotion': False, 'output': result, 'audio': audio_info,
              'humanApproval': 'pending; earlier five-second sample approval does not approve this pilot'}
    (DOC / 'media.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
