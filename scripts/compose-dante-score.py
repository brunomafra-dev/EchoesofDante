"""Original in-game chamber scores, rendered offline (never scheduled in Phaser).

Authoring: numpy, imageio-ffmpeg, FluidSynth 2.6.1, GeneralUser GS 2.0.3.
No borrowed melodies or recordings. Source MIDI and measurements accompany MP3s.
Render two passes and retain the second, carrying reverb across the loop boundary.
"""
import hashlib
import json
import math
import struct
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/warden-and-sound/score'
WORK = ROOT / '.local/dante-score'
DEST = ROOT / 'public/assets/audio/score-149'
SYNTH = ROOT / '.local/tools/fluidsynth/bin/fluidsynth-v2.6.1-win10-x64-cpp11/bin/fluidsynth.exe'
FONT = ROOT / '.local/models/music/GeneralUser-GS.sf2'
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 44100
for path in [DOC, WORK, DEST]: path.mkdir(parents=True, exist_ok=True)


def vlq(n):
    a = [n & 127]
    while (n := n >> 7): a.insert(0, (n & 127) | 128)
    return bytes(a)


def track(events, end):
    data, previous = bytearray(), 0
    for tick, priority, payload in sorted(events):
        data.extend(vlq(tick - previous)); data.extend(payload); previous = tick
    data.extend(vlq(end - previous)); data.extend(b'\xff\x2f\x00')
    return b'MTrk' + struct.pack('>I', len(data)) + data


# Modal, spacious chamber arrangements: guitar, strings, woodwind, soft piano.
# Each location has its own root, pacing, phrase contour and harmonic sequence.
SCORES = {
    'base': ('home', 62, 70, [0, 7, 5, 2]),
    'springs': ('home', 65, 72, [0, 5, 9, 7]),
    'terraces': ('home', 60, 74, [0, 9, 5, 7]),
    'forest': ('green', 62, 74, [0, 5, 3, 7]),
    'cavern': ('stone', 57, 66, [0, 3, 5, 0]),
    'deep': ('stone', 60, 64, [0, 5, 8, 7]),
    'deeper': ('stone', 55, 70, [0, 8, 5, 7]),
    'exterior': ('green', 65, 72, [0, 3, 5, 7]),
    'valley': ('green', 60, 76, [0, 5, 7, 3]),
    'sirocco': ('sand', 62, 76, [0, 8, 5, 7]),
    'dunes': ('sand', 57, 68, [0, 5, 8, 7]),
    'frost': ('ice', 60, 68, [0, 5, 3, 7]),
    'icecave': ('ice', 62, 64, [0, 8, 5, 7]),
    'cinder': ('ember', 57, 70, [0, 5, 8, 7]),
    'obsidian': ('ember', 55, 68, [0, 3, 8, 7]),
    'caldera': ('ember', 60, 70, [0, 8, 5, 7]),
    'warden': ('boss', 50, 92, [0, 1, 5, 7]),
    'soterrado': ('boss', 48, 88, [0, 8, 1, 7]),
    'vesper': ('boss', 53, 96, [0, 5, 1, 7]),
    'titan': ('boss', 46, 90, [0, 1, 8, 7]),
}
MOTIFS = {
    'home': [0, 7, 9, 4, 2, 7], 'green': [0, 7, 10, 9, 5, 2],
    'stone': [0, 2, 7, 5, 3, 2], 'sand': [7, 8, 5, 3, 2, 0],
    'ice': [7, 14, 10, 9, 5, 7], 'ember': [0, 3, 2, 7, 5, 2],
    'boss': [12, 7, 8, 3, 2, 1],
}
report = []
for name, (family, root, bpm, harmony) in SCORES.items():
    boss = family == 'boss'
    bars = 48 if boss else 32
    beats = bars * 4
    seconds = beats * 60 / bpm
    end = (beats * 2 + 8) * 480
    tempo = round(60_000_000 / bpm)
    events = [[(0, 0, b'\xff\x51\x03' + tempo.to_bytes(3, 'big'))]]
    # General MIDI program numbers (zero based), mellow register and low velocity.
    parts = [(0, 48, 58), (1, 24 if family in ['home', 'green', 'sand'] else 0, 78),
             (2, 42, 64), (3, 73 if family in ['home', 'green'] else 11, 49)]
    if boss: parts = [(0, 48, 58), (1, 45, 74), (2, 42, 64), (3, 47, 54)]
    counts = []
    for ch, program, pan in parts:
        notes = []
        for cycle in range(2):
            for bar in range(bars):
                start = cycle * beats + bar * 4
                section = bar // 8
                chord_root = root + harmony[(bar // 2 + section) % 4]
                while chord_root > 65: chord_root -= 12
                if ch == 0 and bar % 2 == 0:
                    # Fifths/suspended thirds, never the old constant piercing tone.
                    pitches = [chord_root - 12, chord_root - 5, chord_root + (4 if family == 'home' else 3)]
                    for i, pitch in enumerate(pitches): notes.append((start + i * .08, 7.7, pitch, 30 + section % 2 * 3))
                elif ch == 1:
                    if boss:
                        # Pulse changes density by section; space remains for attack sounds.
                        for i in ([0, 1.5, 3] if section % 3 else [0, 2]):
                            notes.append((start + i, .65, chord_root + (7 if i == 3 else 0), 36 + int(i) * 2))
                    elif bar % 8 not in [3, 7]:
                        offsets = [0, 1.5, 2.5] if family in ['green', 'sand', 'home'] else [0, 2.5]
                        for i, offset in enumerate(offsets):
                            notes.append((start + offset + .035 * (bar % 3), 2.3, chord_root + [0, 7, 14][i], 34 + (bar + i) % 5))
                elif ch == 2 and bar % 2 == 0:
                    notes.append((start + .1, 7.5, chord_root - 24, 37 if boss else 28))
                elif ch == 3:
                    if boss and bar % 2 == 0:
                        notes.append((start, 2, root - 12, 44 + section % 3 * 3))
                    elif not boss and bar % 8 in [1, 5]:
                        phrase = MOTIFS[family]
                        # Three-note replies, with a full bar of breath between phrases.
                        for i in range(3):
                            pitch = root + phrase[(i + section + (3 if bar % 8 == 5 else 0)) % 6]
                            while pitch > 78: pitch -= 12
                            notes.append((start + .5 + i * 1.2, 1.4, pitch, 30 + i * 2))
        data = [(0, 0, bytes([0xc0 | ch, program])), (0, 0, bytes([0xb0 | ch, 7, 86])),
                (0, 0, bytes([0xb0 | ch, 10, pan])), (0, 0, bytes([0xb0 | ch, 91, 48]))]
        for t, duration, pitch, velocity in notes:
            data.extend([(round(t * 480), 2, bytes([0x90 | ch, pitch, velocity])),
                         (round((t + duration) * 480), 1, bytes([0x80 | ch, pitch, 0]))])
        events.append(data); counts.append(len(notes) // 2)
    midi = DOC / f'{name}.mid'
    midi.write_bytes(b'MThd' + struct.pack('>IHHH', 6, 1, len(events), 480) + b''.join(track(t, end) for t in events))
    raw = WORK / 'render.wav'
    subprocess.run([str(SYNTH), '-ni', '-q', '-g', '.5', '-r', str(SR), '-R', '1', '-C', '0',
                    '-o', 'synth.reverb.room-size=0.7', '-o', 'synth.reverb.level=0.25',
                    '-o', 'synth.reverb.damp=0.7', '-F', str(raw), str(FONT), str(midi)], check=True)
    decoded = subprocess.run([FF, '-v', 'error', '-i', str(raw), '-f', 'f32le', '-ac', '2', '-'], capture_output=True, check=True)
    a = np.frombuffer(decoded.stdout, dtype='<f4').reshape(-1, 2)
    n = round(seconds * SR); audio = a[n:2*n].copy()
    # Remove DC and retain natural dynamics. Small edge blend avoids rounding clicks.
    audio -= audio.mean(axis=0)
    audio *= .065 / max(float(np.sqrt(np.mean(audio**2))), 1e-8)
    audio *= min(1, .65 / max(float(np.max(np.abs(audio))), 1e-8))
    edge = 128
    bridge = (audio[0] + audio[-1]) / 2
    ramp = np.linspace(0, 1, edge)[:, None]
    audio[:edge] = bridge * (1-ramp) + audio[:edge] * ramp
    audio[-edge:] = audio[-edge:] * (1-ramp) + bridge * ramp
    output = DEST / f'{name}.mp3'
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-af', 'highpass=f=65,lowpass=f=6500', '-codec:a', 'libmp3lame', '-b:a', '128k',
                    '-metadata', 'artist=Echoes of Dante', '-metadata', f'title={name} - Dante 149', str(output)],
                   input=audio.astype('<f4').tobytes(), check=True)
    row = dict(region=name, family=family, seconds=round(seconds, 3), bpm=bpm, notesPerPart=counts,
               rms=float(np.sqrt(np.mean(audio**2))), peak=float(np.max(np.abs(audio))),
               bytes=output.stat().st_size, sha256=hashlib.sha256(output.read_bytes()).hexdigest())
    report.append(row); print(json.dumps(row), flush=True)
(DOC / 'measurements.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
