"""Offline whole-frame film assembly. Missing footage is an error, never filled by stills.

--audio-only prepares the original sound mix and subtitles without claiming a film exists.
"""
import argparse
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import cv2
import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening'
PLAN = json.loads((DOC / 'shots.json').read_text(encoding='utf-8'))
WORK = ROOT / '.local/cinematic-opening/assembly'
PUBLIC = ROOT / 'public/assets/cinematic-opening'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
DURATION = PLAN['targetSeconds']
OUTPUT = PUBLIC / 'arrival-whole-scene.mp4'


def run(args, **kwargs):
    subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'warning', *map(str, args)], check=True, **kwargs)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sound():
    sr = 48000
    t = np.arange(round(sr * DURATION), dtype=np.float64) / sr
    rng = np.random.default_rng(109)
    spectrum = np.fft.rfft(rng.normal(0, 1, len(t)))
    hz = np.fft.rfftfreq(len(t), 1/sr)
    spectrum *= np.minimum(1, hz/90) / (1 + (hz/1700)**2)
    air = np.fft.irfft(spectrum, n=len(t))
    air /= np.std(air)

    def region(start, end, fade=0.6):
        return np.clip((t-start)/fade, 0, 1) * np.clip((end-t)/fade, 0, 1)

    wind = air * (0.023*region(0, 12) + 0.01*region(12, 36) + 0.037*region(36, 47) + 0.016*region(45, DURATION))
    engine = (np.sin(2*np.pi*48*t) + 0.45*np.sin(2*np.pi*96*t) + 0.2*np.sin(2*np.pi*144*t))
    engine *= (0.009*region(0, 6) + 0.055*region(6, 12) + 0.022*region(12, 24)
               + 0.038*region(24, 36) + 0.053*region(36, 46) + 0.012*region(46, 49))
    score = np.zeros(len(t))
    # One deliberately sparse original phrase over the film, no repeating loop.
    for start, end, notes in [(0.3, 10, [73.416, 110]), (12, 23, [65.406, 98]),
                              (18.4, 31, [73.416, 110, 164.814]), (36.5, 47.5, [87.307, 130.813]),
                              (46, DURATION, [73.416, 110, 146.832])]:
        env = region(start, end, 2.4)
        for j, note in enumerate(notes):
            score += 0.006*env*(np.sin(2*np.pi*note*t + j*.7) + .23*np.sin(2*np.pi*note*2*t))
    left, right = engine + wind + score, engine + np.roll(wind, 197) + score
    for start, freq in [(24.9, 660), (25.12, 880), (26.8, 590), (37.1, 740), (44.6, 420)]:
        age = t-start
        env = np.where(age >= 0, np.exp(-np.maximum(age, 0)/.07), 0)
        ping = .024*np.sin(2*np.pi*freq*age)*env
        left += ping*.85
        right += ping
    for start, freq in [(48.1, 1750), (50.5, 2200), (52.2, 1500)]:
        age = t-start
        env = np.where((age >= 0) & (age < .38), np.sin(np.pi*np.clip(age/.38, 0, 1))**2, 0)
        chirp = .009*env*np.sin(2*np.pi*(freq*age + 350*age**2))
        left += chirp
        right += chirp*.6
    fade = np.clip(t/.5, 0, 1)*np.clip((DURATION-t)/1.4, 0, 1)
    pcm = np.stack([left*fade, right*fade], axis=1)
    peak, rms = float(np.max(np.abs(pcm))), float(np.sqrt(np.mean(pcm**2)))
    assert peak < .65
    wav = WORK / 'expedition-mix.wav'
    with wave.open(str(wav), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(sr)
        f.writeframes((pcm*32767).astype('<i2').tobytes())
    run(['-i', wav, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', PUBLIC / 'expedition-mix.m4a'])
    return wav, {'seconds': DURATION, 'sampleRate': sr, 'channels': 2, 'peak': peak, 'rms': rms,
                 'origin': 'Original offline NumPy synthesis, seed 109; no voice, external samples or repeated music loop'}


def captions():
    def clock(value):
        ms = round(value*1000)
        return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
    vtt = 'WEBVTT\n\n'
    ass = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Segoe UI,29,&H00F3F3E8,&H000000FF,&HAD101610,&HA0101610,0,0,0,0,100,100,0,0,3,8,0,8,60,60,32,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    for start, end, speaker, text in PLAN['captions']:
        assert 0 <= start < end <= DURATION
        line = f'{speaker}: {text}' if speaker else text
        vtt += f'{clock(start)} --> {clock(end)}\n{line}\n\n'
        if speaker:
            line = f'{{\\b1\\c&H83BBD9&}}{speaker}{{\\b0\\c&HF3F3E8&}}: {text}'
        ass += f'Dialogue: 0,{clock(start)[:-1]},{clock(end)[:-1]},Default,,0,0,0,,{line}\n'
    (PUBLIC / 'arrival.pt-BR.vtt').write_text(vtt.rstrip()+'\n', encoding='utf-8')
    (WORK / 'captions.ass').write_text(ass, encoding='utf-8')


def sources(shot):
    if shot.get('approvedPilot'):
        return [(ROOT / 'public/assets/cinematic-pilot/bridge-hf-motion-test.mp4', 0, 80),
                (ROOT / 'docs/cinematic-pilot/revision-04/source/take-02.mp4', 1, 80),
                (ROOT / 'docs/cinematic-pilot/revision-04/source/take-03.mp4', 1, 36)]
    return [(DOC / f"source/{shot['id']}-01.mp4", 0, 80),
            (DOC / f"source/{shot['id']}-02.mp4", 1, min(80, round((shot['seconds']-5+.25)*16)))]


def assemble():
    missing = [p.relative_to(ROOT).as_posix() for s in PLAN['shots'] for p, _, _ in sources(s) if not p.exists()]
    if missing:
        raise RuntimeError('Footage missing; no placeholder film will be produced:\n'+'\n'.join(missing))
    manifests = []
    for shot in PLAN['shots']:
        native = WORK / f"{shot['id']}-native.mp4"
        process = subprocess.Popen([FFMPEG, '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24',
                                    '-s', '832x480', '-r', '16', '-i', '-', '-an', '-c:v', 'libx264',
                                    '-preset', 'fast', '-crf', '12', '-pix_fmt', 'yuv420p', str(native)], stdin=subprocess.PIPE)
        used = []
        try:
            for path, start, count in sources(shot):
                c = cv2.VideoCapture(str(path))
                assert (c.get(3), c.get(4), c.get(5)) == (832, 480, 16), str(path)
                c.set(cv2.CAP_PROP_POS_FRAMES, start)
                for _ in range(count):
                    ok, frame = c.read()
                    if not ok:
                        raise RuntimeError(f'Incomplete source: {path}')
                    process.stdin.write(frame.tobytes())
                c.release()
                used.append({'path': path.relative_to(ROOT).as_posix(), 'startFrame': start,
                             'usedFrames': count, 'sha256': digest(path)})
        finally:
            process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError('Native source assembly failed')
        piece = WORK / f"{shot['id']}.mp4"
        run(['-i', native, '-vf', 'minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff,scale=1248:720:flags=lanczos,pad=1280:720:16:0:color=0x030806,setsar=1',
             '-t', shot['seconds'], '-an', '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', piece])
        c = cv2.VideoCapture(str(piece)); frames = int(c.get(7)); c.release()
        assert frames == round(shot['seconds']*24), (shot['id'], frames)
        manifests.append({'id': shot['id'], 'seconds': shot['seconds'], 'source': used, 'frames': frames})
    (WORK / 'concat.txt').write_text(''.join(f"file '{s['id']}.mp4'\n" for s in PLAN['shots']), encoding='utf-8')
    wav, audio = sound()
    captions()
    run(['-f', 'concat', '-safe', '1', '-i', 'concat.txt', '-i', wav,
         '-vf', 'ass=captions.ass', '-t', DURATION, '-c:v', 'libx264', '-crf', '21', '-preset', 'medium',
         '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', OUTPUT], cwd=WORK)
    c = cv2.VideoCapture(str(OUTPUT))
    info = {'width': int(c.get(3)), 'height': int(c.get(4)), 'fps': c.get(5), 'frames': int(c.get(7)),
            'bytes': OUTPUT.stat().st_size, 'sha256': digest(OUTPUT)}
    c.release()
    assert (info['width'], info['height'], info['fps'], info['frames']) == (1280, 720, 24, round(DURATION*24))
    report = {'completeFilm': True, 'humanApproval': 'pending', 'native720p24': False,
              'sourceFps': 16, 'interpolation': 'FFmpeg motion compensated; whole frames',
              'loopOrFrozenFiller': False, 'shots': manifests, 'audio': audio, 'output': info}
    (DOC / 'media.json').write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps(info))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audio-only', action='store_true')
    args = parser.parse_args()
    WORK.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    assert abs(sum(s['seconds'] for s in PLAN['shots'])-DURATION) < 1e-8
    if args.audio_only:
        _, report = sound()
        captions()
        (DOC / 'audio.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
        print('Audio and captions prepared; complete film NOT produced.')
    else:
        assemble()
