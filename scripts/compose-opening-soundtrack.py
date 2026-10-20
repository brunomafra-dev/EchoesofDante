"""Author the 54s score/foley offline; dialogue is the unchanged casting reference.

Original MIDI composition, FluidSynth + GeneralUser GS; original generated SFX.
Output stems contain authored fades, spectral space and speech-aware ducking.
Nothing in this script or its models runs in the browser.
"""
import hashlib
import json
import math
import struct
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening/revision-05'
WORK = ROOT / '.local/cinematic-opening/revision-05'
PUBLIC = ROOT / 'public/assets/cinematic-opening'
SR, SECONDS = 48000, 54.25
N = round(SR*SECONDS)
FF = imageio_ffmpeg.get_ffmpeg_exe()
SYNTH = ROOT / '.local/tools/fluidsynth/bin/fluidsynth-v2.6.1-win10-x64-cpp11/bin/fluidsynth.exe'
FONT = ROOT / '.local/models/music/GeneralUser-GS.sf2'
WORK.mkdir(parents=True, exist_ok=True)
DOC.mkdir(parents=True, exist_ok=True)
TIME = np.arange(N, dtype=np.float32)/SR


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def decode(p):
    r = subprocess.run([FF, '-v', 'error', '-i', str(p), '-ar', str(SR), '-ac', '2',
                        '-f', 'f32le', '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype='<f4').reshape(-1,2).copy()


def save(p, data):
    assert np.isfinite(data).all() and np.max(np.abs(data)) < .95
    with wave.open(str(p), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes(np.round(data*32767).astype('<i2').tobytes())


def band(data, low=45, high=3500):
    # Soft offline spectral shaping, not a brick-wall cut or runtime filter.
    count = len(data)
    hz = np.fft.rfftfreq(count, 1/SR)
    response = 1/np.sqrt(1+(hz/high)**8)
    response *= 1/np.sqrt(1+(low/np.maximum(hz,.01))**4)
    out = np.fft.irfft(np.fft.rfft(data, axis=0)*response[:,None], n=count, axis=0)
    return out.astype(np.float32)


def envelope(length, attack, release):
    t = np.arange(length)/SR
    return (np.sin(np.clip(t/attack,0,1)*np.pi/2)**2 *
            np.sin(np.clip((length/SR-t)/release,0,1)*np.pi/2)**2).astype(np.float32)


def vlq(value):
    out = [value & 127]
    while (value := value >> 7): out.insert(0, (value & 127)|128)
    return bytes(out)


def midi_track(events):
    data, last = bytearray(), 0
    for tick, priority, payload in sorted(events, key=lambda e:(e[0],e[1])):
        data.extend(vlq(tick-last)); data.extend(payload); last=tick
    data.extend(vlq(round(SECONDS*480)-last)); data.extend(b'\xff\x2f\x00')
    return b'MTrk'+struct.pack('>I',len(data))+data


# Original score: loss -> patient transit -> restrained wonder -> open ending.
# Low velocities, no percussion, no arpeggiator or repeating short music loop.
CHORDS = [(0,[50,57,60,64,65]), (6,[46,53,57,60,65]),
          (12,[48,55,60,64,67]), (18.2,[53,57,60,64,67]),
          (24,[50,57,60,64,65]), (30,[46,53,57,60,65]),
          (36,[53,57,60,64,67]), (40.5,[48,55,62,64,67]),
          (46.7,[50,57,62,64,69]), (50,[50,57,62,64,69])]
tracks = [[(0,0,b'\xff\x51\x03\x0f\x42\x40')]]  # 60 BPM, 480 ticks/sec
parts = [('soft piano',0,0,53), ('sustained strings',1,48,78), ('warm space pad',2,89,64)]
note_report=[]
for name, ch, program, pan in parts:
    events=[(0,0,bytes([0xc0|ch,program])),(0,0,bytes([0xb0|ch,7,90])),
            (0,0,bytes([0xb0|ch,10,pan])),(0,0,bytes([0xb0|ch,91,58])),
            (0,0,bytes([0xb0|ch,93,18]))]
    notes=[]
    if ch in (1,2):
        for k,(start,chord) in enumerate(CHORDS):
            end = CHORDS[k+1][0]+.4 if k+1<len(CHORDS) else 52.1
            tones = chord[:4] if ch==1 else [chord[0]+12,chord[1]+12,chord[-1]]
            for j,pitch in enumerate(tones):
                notes.append((start+.08*j,end-(start+.08*j),pitch,(31 if ch==1 else 24)+(3 if 18<=start<24 else 0)))
    else:
        for start,pitches in [(2.8,[62,69,64]),(14,[62,65,64]),(19,[69,72,76,74]),
                              (27,[65,64]),(34,[62,69]),(37.1,[69,72,74]),
                              (43,[67,64]),(49.8,[69,74,76])]:
            for j,pitch in enumerate(pitches):
                notes.append((start+j*1.05,2.8,pitch,28+(j%2)*3))
    for start,length,pitch,velocity in notes:
        end=min(52.4,start+length)
        events.extend([(round(start*480),2,bytes([0x90|ch,pitch,velocity])),
                       (round(end*480),1,bytes([0x80|ch,pitch,0]))])
        note_report.append(dict(part=name,start=start,end=end,pitch=pitch,velocity=velocity))
    tracks.append(events)
midi = b'MThd'+struct.pack('>IHHH',6,1,len(tracks),480)+b''.join(midi_track(t) for t in tracks)
midi_file=DOC/'um-lugar-para-recomecar.mid'; midi_file.write_bytes(midi)
subprocess.run([str(SYNTH),'-ni','-g','.5','-r',str(SR),'-R','1','-C','1',
                '-o','synth.reverb.room-size=0.72','-o','synth.reverb.damp=0.65',
                '-o','synth.reverb.level=0.22','-F',str(WORK/'score-raw.wav'),str(FONT),str(midi_file)],check=True)
raw=decode(WORK/'score-raw.wav')
music=np.zeros((N,2),dtype=np.float32); music[:min(N,len(raw))]=raw[:N]
music=band(music,60,3100)
music*=.024/max(float(np.sqrt(np.mean(music**2))),1e-6)
music*=envelope(N,1.6,2.0)[:,None]

# Each source is original generation, never a ripped commercial soundtrack.
source_manifest=json.loads((DOC/'sfx-sources.json').read_text(encoding='utf-8'))
audio={}
for source in source_manifest['sources']:
    p=ROOT/source['path']; assert digest(p)==source['sha256']
    audio[source['key']]=decode(p)
effects=np.zeros((N,2),dtype=np.float32)
cues=[]


def cue(key,start,seconds,level,offset=0,low=45,high=2200,fade=.5):
    data=audio[key][round(offset*SR):round((offset+seconds)*SR)].copy()
    if len(data)<round(seconds*SR):
        # Only the sources explicitly generated as ambience may repeat.
        assert key in ['cabin','forest']
        data=np.tile(audio[key],(math.ceil(seconds*SR/len(audio[key])),1))[:round(seconds*SR)]
    data=band(data,low,high)
    data*=level/max(float(np.sqrt(np.mean(data**2))),1e-6)
    data*=envelope(len(data),min(fade,seconds/3),min(fade,seconds/3))[:,None]
    i=round(start*SR); size=min(len(data),N-i)
    effects[i:i+size]+=data[:size]
    cues.append(dict(source=key,start=start,seconds=seconds,sourceOffset=offset,targetRMS=level,
                     highCutHz=high,fadeSeconds=fade))

cue('earthwind',0,6,.011,high=1050,fade=1.2)
cue('engine',6,6,.038,high=1450,fade=.65)  # visible fleet lift-off
cue('cabin',12,6,.012,high=1250,fade=.9)  # interior observation deck
cue('engine',18,6,.015,offset=6,high=1150,fade=1.1)  # distant orbital drive
cue('cabin',24,8,.011,high=1400,fade=.65)
cue('cabin',31.4,8,.011,high=1400,fade=.65)
cue('cabin',38.6,1.9,.009,high=1400,fade=.4)
cue('equipment',36.2,4,.011,high=2800,fade=.12)
cue('descent',40.5,9,.034,high=1700,fade=.6)
cue('settle',49.5,1.6,.022,high=1700,fade=.12)
cue('steps',49.7,3.6,.017,high=2900,fade=.1)
cue('forest',49.5,4.75,.014,high=2200,fade=.7)

voices=json.loads((DOC/'voice-report.json').read_text(encoding='utf-8'))
speech=np.zeros((N,2),dtype=np.float32)
duck_music=np.ones(N,dtype=np.float32);duck_effects=np.ones(N,dtype=np.float32)
line_metrics=[]
for line in voices['lines']:
    v=decode(ROOT/line['path'])
    # Concat's unchanged mono-to-stereo pan law, gain used since revision 03.
    v*=min(2,.58/line['peak'])
    i=round(line['start']*SR); speech[i:i+len(v)]+=v
    # A 180ms anticipation and 550ms release avoid pumping between syllables.
    age=TIME-line['start'];end=line['start']+line['seconds']
    env=np.minimum(np.clip((age+.18)/.18,0,1),np.clip((end+.55-TIME)/.55,0,1))
    mask=(np.max(np.abs(v),axis=1)>.012)
    voice_rms=float(np.sqrt(np.mean(v[mask]**2)))
    background_rms=float(np.sqrt(np.mean((music[i:i+len(v)]+effects[i:i+len(v)])[mask]**2)))
    target=min(.42,voice_rms/(max(background_rms,1e-6)*10**(16/20)))
    duck_music=np.minimum(duck_music,1-env*(1-min(.32,target)))
    duck_effects=np.minimum(duck_effects,1-env*(1-target))
music*=duck_music[:,None];effects*=duck_effects[:,None]
effects*=envelope(N,.6,.9)[:,None]
for line in voices['lines']:
    i=round(line['start']*SR);n=round(line['seconds']*SR)
    v=speech[i:i+n]; bg=(music+effects)[i:i+n];mask=np.max(np.abs(v),axis=1)>.012
    vr=float(np.sqrt(np.mean(v[mask]**2)));br=float(np.sqrt(np.mean(bg[mask]**2)))
    margin=20*np.log10(vr/max(br,1e-8))
    assert margin>=15.5,(line['id'],margin)
    line_metrics.append(dict(id=line['id'],voiceRMS=vr,backgroundRMS=br,marginDB=float(margin)))
save(WORK/'music-bed.wav',music);save(WORK/'scene-effects.wav',effects)
save(WORK/'dialogue-reference.wav',speech)
save(WORK/'expected-mix.wav',speech+music+effects)
for stem,array in [('music',music),('effects',effects)]:
    subprocess.run([FF,'-y','-v','error','-i',str(WORK/('music-bed.wav' if stem=='music' else 'scene-effects.wav')),
                    '-c:a','aac','-b:a','160k','-movflags','+faststart',str(PUBLIC/f'opening-{stem}.m4a')],check=True)
report=dict(seconds=SECONDS,sampleRate=SR,channels=2,origin='Original MIDI score + original generated effects; offline authored ducking',
            synthVersion='FluidSynth 2.6.1',soundfont='GeneralUser GS 2.0.3',soundfontSHA256=digest(FONT),
            midiSHA256=digest(midi_file),instrumentation=[p[0] for p in parts],notes=note_report,cues=cues,
            speechFilesChanged=False,targetSpeechMarginDB=16,lines=line_metrics,
            musicRMS=float(np.sqrt(np.mean(music**2))),effectsRMS=float(np.sqrt(np.mean(effects**2))),
            expectedMixRMS=float(np.sqrt(np.mean((speech+music+effects)**2))),
            expectedMixPeak=float(np.max(np.abs(speech+music+effects))),
            stems={k:dict(path=str((WORK/f).relative_to(ROOT)).replace('\\','/'),sha256=digest(WORK/f))
                   for k,f in [('music','music-bed.wav'),('effects','scene-effects.wav')]},humanApproval='pending')
(DOC/'sound-design.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['seconds','musicRMS','effectsRMS','expectedMixRMS','expectedMixPeak','lines']},indent=2))
