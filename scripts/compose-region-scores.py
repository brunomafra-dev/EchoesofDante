"""Original authored regional scores, rendered OFFLINE. No recordings/samples.

Authoring dependencies: numpy and imageio-ffmpeg (not game dependencies).
The browser streams finished MP3s; it never synthesizes music or schedules notes.
Each arrangement has an introduction, development, quieter middle and return.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import tempfile
import wave
import sys
import numpy as np
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
RATE = 22050
DEST = ROOT / 'public/assets/audio'
# root MIDI, BPM, bar count, tonal movement, instrumentation, soundscape seed
SCORES = {
    'icecave': (45, 52, 36, [0, 3, 7, 5, 0, -2, 3, 7], 'glass', 151),
    'vesper': (41, 84, 40, [0, -2, 5, 3, 0, 7, 1, -2], 'battle', 163),
    'frost': (57, 54, 36, [0, 5, 3, 7, 0, -2, 5, 3], 'air', 127),
    'forest': (50, 60, 36, [0, 5, -2, 3, 0, 7, 5, -2], 'wood', 11),
    'cavern': (38, 52, 32, [0, -2, 3, 5, 0, -5, 3, -2], 'stone', 23),
    'deep': (41, 48, 32, [0, 3, -2, 7, 0, 5, 3, -2], 'glass', 31),
    'deeper': (36, 56, 32, [0, 1, 5, -2, 0, 3, 1, -2], 'pulse', 43),
    'exterior': (55, 64, 36, [0, 5, 7, 3, 0, -2, 5, 7], 'air', 59),
    'valley': (48, 68, 40, [0, 7, 5, 3, 0, -2, 5, 7], 'wood', 67),
    'sirocco': (45, 58, 36, [0, 3, 5, -2, 0, 7, 3, 5], 'sand', 79),
    'dunes': (40, 50, 36, [0, -2, 1, 5, 0, 3, -2, 1], 'sand', 83),
    'warden': (38, 80, 40, [0, 3, -2, 1, 0, 5, 3, -2], 'battle', 97),
    'soterrado': (43, 76, 40, [0, -2, 3, 5, 0, 1, -2, 3], 'battle', 109),
}

def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)

def add(sound, start, length, midi, gain, kind, pan=0):
    t = np.arange(round(length * RATE), dtype=np.float32) / RATE
    f = frequency(midi)
    if kind == 'pad':
        attack, release = min(3.5, length * .25), min(4.5, length * .35)
        env = np.minimum(1, t / attack) * np.minimum(1, (length - t) / release)
        env = np.maximum(0, env) ** 1.5
        # A soft bowed/analog mass, rather than a continuously exposed pure tone.
        v = np.sin(2 * np.pi * f * t + .13 * np.sin(2 * np.pi * .19 * t))
        v += .32 * np.sin(2 * np.pi * f * 1.0023 * t)
        v += .15 * np.sin(2 * np.pi * f * 2 * t) + .055 * np.sin(2 * np.pi * f * 3 * t)
    elif kind == 'bass':
        env = np.minimum(1, t / .08) * np.exp(-t * 1.2) * np.minimum(1, (length - t) / .25)
        v = np.sin(2 * np.pi * f * t) + .11 * np.sin(2 * np.pi * f * 2 * t)
    elif kind == 'drum':
        env = np.minimum(1, t / .025) * np.exp(-t * 8)
        v = np.sin(2 * np.pi * (45 * t + 8 * (1 - np.exp(-t * 12))))
        v += .12 * np.sin(2 * np.pi * 143 * t) * np.exp(-t * 18)
    else:
        env = np.minimum(1, t / .035) * np.exp(-t * (1.35 if kind == 'wood' else .64))
        env *= np.maximum(0, np.minimum(1, (length - t) / .8))
        ratio = 2.03 if kind == 'wood' else 2.005
        v = np.sin(2 * np.pi * f * t + .38 * np.exp(-t * 3) * np.sin(2 * np.pi * f * ratio * t))
        v += .20 * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * 2)
        v += .07 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 4)
    voice = (v * env * gain).astype(np.float32)
    # Sustain and reverberation wrap at the musical boundary, keeping the loop tail.
    offset = round(start * RATE) % len(sound)
    n = min(len(voice), len(sound) - offset)
    stereo = voice[:, None] * np.array([math.sqrt((1-pan)/2), math.sqrt((1+pan)/2)], dtype=np.float32)
    sound[offset:offset+n] += stereo[:n]
    if n < len(voice): sound[:len(voice)-n] += stereo[n:]

def render(name, spec):
    root, bpm, bars, changes, material, seed = spec
    beat = 60 / bpm
    duration = bars * 4 * beat
    size = round(duration * RATE)
    sound = np.zeros((size, 2), dtype=np.float32)
    rng = np.random.default_rng(seed)
    # Slow airy environmental bed. Original filtered noise, never an external sample.
    noise = rng.normal(0, 1, size + 96).astype(np.float32)
    cumulative = np.cumsum(noise, dtype=np.float64)
    wind = ((cumulative[96:] - cumulative[:-96]) / 96).astype(np.float32)
    time = np.arange(size, dtype=np.float32) / RATE
    wind *= (.006 if material not in ('air', 'sand') else .022) * (.65 + .35 * np.sin(2*np.pi*time/duration*3) ** 2)
    sound[:, 0] += wind
    sound[:, 1] += np.roll(wind, 291)
    for bar in range(0, bars, 2):
        section = bar / bars
        quiet = 0.52 if .42 < section < .64 else 1
        shift = changes[(bar // 4) % len(changes)]
        # Voicings move every four bars; attack, release and rests create breathing room.
        for j, interval in enumerate([0, 7, 14] if material != 'battle' else [0, 7, 10]):
            register = 12 if material in ('air', 'wood') and j else 0
            add(sound, bar*4*beat, 9*beat, root+shift+interval+register,
                .020*quiet*(.7 if j else 1), 'pad', [-.45,.3,.1][j])
        if bar >= 4 and (material in ('pulse','battle') or bar % 4 == 0):
            add(sound, bar*4*beat+.1, 2.5*beat, root+shift-12, .033*quiet, 'bass')
    # Six composed, differently spaced phrases over the complete piece.
    phrases = [(4,[0,7,9,2]), (10,[7,2,0]), (17,[2,9,7,0]),
               (24,[0,5,9,7]), (29,[7,9,2]), (bars-3,[5,2,0])]
    for index, (bar, notes) in enumerate(phrases):
        for j, interval in enumerate(notes):
            start = (bar*4 + [0,2.5,6,9.5][j]) * beat
            add(sound, start, 4.5*beat, root+24+interval, .030 if material=='battle' else .025,
                'wood' if material in ('wood','sand') else 'glass', -.35+j*.19)
    # Brief arpeggiated developments separated by a sparse middle passage.
    for bar in list(range(6, 10)) + list(range(22, 26)):
        for j, interval in enumerate([0,7,14] if material not in ('sand','battle') else [0,3,7]):
            add(sound, (bar*4+j*1.3)*beat, 3*beat, root+12+interval,
                .009, 'wood' if material in ('wood','sand') else 'glass', (j-1)*.5)
    if material in ('pulse','sand','battle'):
        stride = 1 if material=='battle' else 3
        for bar in range(3, bars-2, stride):
            if bars*.43 < bar < bars*.62: continue
            for off in ([0,2.5,3.25] if material=='battle' else [0,2.75]):
                add(sound, (bar*4+off)*beat, .7, 30, .030 if material=='battle' else .013, 'drum', .12)
    dry = sound.copy()
    for delay, level in [(.173,.16),(.391,.12),(.719,.09),(1.237,.06),(2.111,.03)]:
        sound += np.roll(dry[:, ::-1], round(delay*RATE), axis=0) * level
    # Conservative mastering: full arrangements are comfortable under gameplay SFX.
    sound = np.tanh(sound * 1.5)
    peak = float(np.max(np.abs(sound)))
    gain = .30 / max(peak, .001)
    sound *= gain
    # A tiny, authored boundary envelope removes the nonperiodic noise/partial seam.
    # Twelve milliseconds at each edge, once per multi-minute piece; no runtime DSP.
    edge = round(.012 * RATE)
    window = np.sin(np.linspace(0, np.pi/2, edge, dtype=np.float32)) ** 2
    sound[:edge] *= window[:,None]
    sound[-edge:] *= window[::-1,None]
    pcm = np.round(sound * 32767).astype('<i2')
    target = DEST / f'{name}-journey.mp3'
    with tempfile.TemporaryDirectory(prefix='dante-score-') as tmp:
        wav = Path(tmp)/'score.wav'
        with wave.open(str(wav),'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(pcm.tobytes())
        subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-hide_banner', '-loglevel', 'error',
            '-i', str(wav), '-codec:a','libmp3lame','-b:a','112k','-write_xing','1',str(target)], check=True)
    metrics = {'track':name, 'durationSeconds':round(duration,3), 'bpm':bpm, 'bars':bars,
        'bytes':target.stat().st_size, 'peak':round(float(np.max(np.abs(sound))),4),
        'rms':round(float(np.sqrt(np.mean(sound**2))),4),
        'boundaryDelta':round(float(np.max(np.abs(sound[0]-sound[-1]))),6), 'boundaryFadeMs':12,
        'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    assert metrics['peak'] < .5, 'Unexpected clipped/loud mix'
    assert metrics['boundaryDelta'] < .025, 'Audible discontinuity at boundary'
    print(json.dumps(metrics),flush=True)
    return metrics

if __name__=='__main__':
    DEST.mkdir(parents=True,exist_ok=True)
    selected = sys.argv[1:] or list(SCORES)
    metrics = [render(name,SCORES[name]) for name in selected]
    folder=ROOT/('docs/glacier-expansion' if any(n in ['icecave', 'vesper'] for n in selected) else 'docs/frozen-reach' if selected == ['frost'] else 'docs/soterrado-boss' if selected == ['soterrado'] else 'docs/sirocco-interior-and-sound')
    folder.mkdir(parents=True,exist_ok=True)
    (folder/'audio-measurements.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
