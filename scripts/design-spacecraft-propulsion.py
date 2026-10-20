"""Offline propulsion proposal: recorded rocket roar + authored turbine rotation.

NASA Discovery STS-131 launch natural sound, sourced/credited in revision-07.
No previously rejected generated clicks, runtime synthesis or AI API calls.
"""
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening/revision-07'
WORK = ROOT / '.local/propulsion-review123'
PUBLIC = ROOT / 'public/assets/cinematic-opening/propulsion-v2'
SOURCE = DOC / 'source/discovery-launch-nasa.mp3'
SR = 48000
FF = imageio_ffmpeg.get_ffmpeg_exe()
PUBLIC.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)


def decode(path):
    r = subprocess.run([FF, '-v', 'error', '-i', str(path), '-ar', str(SR),
                        '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype='<f4').reshape(-1, 2).copy()


def rms(a):
    return float(np.sqrt(np.mean(a*a)))


def band(a, low, high):
    hz = np.fft.rfftfreq(len(a), 1/SR)
    response = 1/np.sqrt(1 + (low/np.maximum(hz, .01))**4)
    response *= 1/np.sqrt(1 + (hz/high)**6)
    return np.fft.irfft(np.fft.rfft(a, axis=0)*response[:, None], n=len(a), axis=0).astype(np.float32)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


source = decode(SOURCE)
outputs = []
for key, seconds, offset in [('takeoff', 6, 0), ('descent', 9, 6)]:
    n = round(seconds*SR); t = np.arange(n)/SR
    # Recorded broad-band jet exhaust is the dominant layer. Soft saturation
    # smooths isolated transients without replacing the continuous roar.
    roar = band(source[round(offset*SR):round(offset*SR)+n], 65, 4200)
    assert len(roar) == n
    roar = np.tanh(roar/max(rms(roar), 1e-6)*.70)
    roar *= .24/max(rms(roar), 1e-6)
    if key == 'takeoff':
        throttle = .25 + .75*np.clip(t/3.6, 0, 1)**.8
        rotation = 72 + 148*np.clip(t/4.0, 0, 1)**.75
    else:
        throttle = (.43 + .55*np.exp(-((t-2.2)/1.2)**2)
                    + .52*np.exp(-((t-5.9)/1.15)**2))
        rotation = 90 + 105*throttle
    rotation *= 1 + .006*np.sin(2*np.pi*2.2*t)
    phase = 2*np.pi*np.cumsum(rotation)/SR
    # Continuous shaft harmonics, no percussive clicks, notes or beeps.
    turbine = sum(gain*np.sin(phase*harmonic+.17*harmonic)
                  for harmonic, gain in [(1,.04),(2,.045),(3,.028),(4,.018),(5,.010),(6,.008)])
    turbine *= 1 + .035*np.sin(2*np.pi*7*t)
    design = roar + turbine[:, None]
    edge = np.sin(np.clip(t/.16, 0, 1)*np.pi/2)**2
    edge *= np.sin(np.clip((seconds-t)/(.4 if key=='takeoff' else 1.1), 0, 1)*np.pi/2)**2
    design *= (throttle*edge)[:, None]
    assert np.max(np.abs(design)) < .9
    wav = WORK/f'{key}-design.wav'
    with wave.open(str(wav), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes(np.round(design*32767).astype('<i2').tobytes())
    out = PUBLIC/f'{key}.mp3'
    subprocess.run([FF, '-y', '-v', 'error', '-i', str(wav),
                    '-af', 'loudnorm=I=-16:TP=-2:LRA=6', '-ar', str(SR),
                    '-c:a', 'libmp3lame', '-b:a', '192k', str(out)], check=True)
    rendered = decode(out)
    interior = rendered[round(.4*SR):-round(.6*SR)]
    mid = band(interior, 180, 1800)
    blocks = [rms(interior[i:i+round(.1*SR)]) for i in range(0, len(interior), round(.1*SR))]
    assert np.max(np.abs(rendered)) < .87, 'Encoded clipping risk'
    assert rms(interior) > .10 and min(blocks) > .025, 'Weak/disconnected thrust'
    assert rms(mid)/rms(interior) > .4, 'Propulsion relies on sub-bass alone'
    outputs.append(dict(file=out.relative_to(ROOT).as_posix(), sha256=sha(out),
                        bytes=out.stat().st_size, seconds=seconds, sourceOffset=offset,
                        rms=rms(rendered), peak=float(np.max(np.abs(rendered))),
                        audibleMidrangeRMS=rms(mid), minimumInterior100msRMS=min(blocks),
                        targetIntegratedLUFS=-16))
report = dict(source=dict(title='Discovery STS-131: Sound of Launch', credit='NASA',
                         page='https://www.nasa.gov/historical-sounds/',
                         download='https://www.nasa.gov/wp-content/uploads/2015/01/590189main_ringtone_131_launchNats.mp3',
                         usage='https://www.nasa.gov/nasa-brand-center/images-and-media/',
                         file=SOURCE.relative_to(ROOT).as_posix(), sha256=sha(SOURCE)),
              method='Recorded launch roar, soft saturation, original continuous turbine harmonics, throttle envelopes, offline loudness normalization',
              outputs=outputs, humanApproval='pending: replacement propulsion isolated only',
              filmChanged=False, generativeAPICalls=0)
(DOC/'production.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report, indent=2))
