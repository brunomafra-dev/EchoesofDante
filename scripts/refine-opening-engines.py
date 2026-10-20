"""Replace only the two masked propulsion cues; preserve approved music/foley."""
import hashlib
import json
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / '.local/cinematic-opening/revision-05'
WORK = ROOT / '.local/cinematic-opening/revision-06'
DOC = ROOT / 'docs/cinematic-opening/revision-06'
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR, N = 48000, 2604000
TIME = np.arange(N, dtype=np.float32) / SR


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def decode(p):
    r = subprocess.run([FF, '-v', 'error', '-i', str(p), '-ar', str(SR),
                        '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype='<f4').reshape(-1, 2).copy()


def save(p, a):
    assert np.isfinite(a).all() and np.max(np.abs(a)) < .9
    with wave.open(str(p), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes(np.round(a * 32767).astype('<i2').tobytes())


def rms(a):
    return float(np.sqrt(np.mean(a**2)))


def shape(a, low, high):
    hz = np.fft.rfftfreq(len(a), 1 / SR)
    response = 1 / np.sqrt(1 + (low / np.maximum(hz, .01))**4)
    response *= 1 / np.sqrt(1 + (hz / high)**8)
    return np.fft.irfft(np.fft.rfft(a, axis=0) * response[:, None],
                        n=len(a), axis=0).astype(np.float32)


WORK.mkdir(parents=True, exist_ok=True)
DOC.mkdir(parents=True, exist_ok=True)
# Copy the approved music stem verbatim, including all its original ducking.
(WORK / 'music-bed.wav').write_bytes((OLD / 'music-bed.wav').read_bytes())
music = decode(WORK / 'music-bed.wav')[:N]
previous = decode(OLD / 'scene-effects.wav')[:N]
effects = previous.copy()
speech = decode(OLD / 'dialogue-reference.wav')[:N]
voices = json.loads((DOC / 'voice-report.json').read_text(encoding='utf-8'))
sources = json.loads((DOC / 'sfx-sources.json').read_text(encoding='utf-8'))
engines = np.zeros((N, 2), dtype=np.float32)
changed = np.zeros(N, dtype=bool)
cues = []
for key, start, seconds, level in [('engine', 6, 6, .090), ('descent', 40.5, 9, .080)]:
    source = next(s for s in sources['sources'] if s['key'] == key)
    p = ROOT / source['path']; assert digest(p) == source['sha256']
    a = decode(p)[:round(seconds * SR)]
    assert len(a) == round(seconds * SR)
    # Keep turbine harmonics, rather than relying on an inaudible sub-bass bed.
    a = shape(a, 100, 2900)
    a *= level / max(rms(a), 1e-6)
    t = np.arange(len(a)) / SR
    fade = (np.sin(np.clip(t / .15, 0, 1) * np.pi / 2)**2 *
            np.sin(np.clip((seconds - t) / .35, 0, 1) * np.pi / 2)**2)
    if key == 'engine':
        fade *= .55 + .70 * np.clip(t / 4, 0, 1)
    a *= fade[:, None]
    i = round(start * SR); engines[i:i+len(a)] = a
    effects[i:i+len(a)] = 0
    changed[i:i+len(a)] = True
    cues.append(dict(source=key, start=start, seconds=seconds, targetRMS=level,
                     passbandHz=[100, 2900], fadeIn=.15, fadeOut=.35))

# Duck only these engines. The approved music and all other effects are fixed.
duck = np.ones(N, dtype=np.float32)
for line in voices['lines']:
    i = round(line['start'] * SR); n = round(line['seconds'] * SR)
    if not changed[i:i+n].any():
        continue
    v = speech[i:i+n]; e = engines[i:i+n]; m = music[i:i+n]
    mask = np.max(np.abs(v), axis=1) > .012
    allowance = max(0, rms(v[mask]) / 10**(11/20) - rms(m[mask]))
    target = min(.72, allowance / max(rms(e[mask]), 1e-6))
    age = TIME - line['start']; end = line['start'] + line['seconds']
    env = np.minimum(np.clip((age+.15)/.15, 0, 1),
                     np.clip((end+.38-TIME)/.38, 0, 1))
    duck = np.minimum(duck, 1 - env * (1-target))
engines *= duck[:, None]
effects += engines
assert np.array_equal(effects[~changed], previous[~changed])

metrics = []
for line in voices['lines']:
    i = round(line['start']*SR); n = round(line['seconds']*SR)
    v = speech[i:i+n]; bg = (music+effects)[i:i+n]
    mask = np.max(np.abs(v), axis=1) > .012
    margin = 20*np.log10(rms(v[mask])/max(rms(bg[mask]), 1e-8))
    assert margin >= 10.8, (line['id'], margin)
    metrics.append(dict(id=line['id'], marginDB=float(margin)))

for cue in cues:
    i = round(cue['start']*SR); n = round(cue['seconds']*SR)
    old_mid = rms(shape(previous[i:i+n], 250, 2000))
    new_mid = rms(shape(effects[i:i+n], 250, 2000))
    cue['audibleMidrangeGainDB'] = 20*np.log10(new_mid/max(old_mid, 1e-8))
    assert cue['audibleMidrangeGainDB'] > 6, cue

save(WORK / 'scene-effects.wav', effects)
save(WORK / 'expected-mix.wav', music+effects+speech)
public = ROOT / 'public/assets/cinematic-opening'
subprocess.run([FF, '-y', '-v', 'error', '-i', str(WORK/'scene-effects.wav'),
                '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
                str(public/'opening-effects.m4a')], check=True)
report = dict(seconds=54.25, sampleRate=SR, speechFilesChanged=False,
              musicUnchanged=True, otherEffectsUnchanged=True,
              targetSpeechMarginDB=11, integratedLoudnessToleranceLU=2.5,
              cues=cues, lines=metrics,
              stems={k:dict(path=p.relative_to(ROOT).as_posix(), sha256=digest(p))
                     for k,p in [('music',WORK/'music-bed.wav'),('effects',WORK/'scene-effects.wav')]},
              humanApproval='pending: engine audibility on user speakers')
(DOC/'sound-design.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(dict(cues=cues, minimumDialogueMarginDB=min(x['marginDB'] for x in metrics)), indent=2))
