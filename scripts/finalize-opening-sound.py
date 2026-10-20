"""Mux the Concat sound mix onto the approved, byte-identical H.264 streams."""
import hashlib
import json
import subprocess
from pathlib import Path

import cv2
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/cinematic-opening/revision-05'
WORK = ROOT / '.local/cinematic-opening/revision-05'
PUBLIC = ROOT / 'public/assets/cinematic-opening'
FF = imageio_ffmpeg.get_ffmpeg_exe()


def video_hash(p):
    return subprocess.run([FF,'-v','error','-i',str(p),'-map','0:v:0','-c','copy','-f','hash','-'],
                          capture_output=True,check=True).stdout.decode().strip()


def info(p):
    c=cv2.VideoCapture(str(p))
    data=dict(width=int(c.get(3)),height=int(c.get(4)),fps=c.get(5),frames=int(c.get(7)),
              bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest())
    c.release(); return data


sound_export=WORK/'film-export.mp4'
assert info(sound_export)['frames']==1302
exports={}
for key,file,start,seconds,frames in [('film','arrival-whole-scene.mp4',0,54.25,1302),
                                      ('bridge','bridge-voice-proof.mp4',24,12,288),
                                      ('landing','landing-heroes.mp4',49.5,4.75,114)]:
    picture=WORK/f'approved-{key}.mp4'
    output=PUBLIC/file
    command=[FF,'-y','-v','error','-i',str(picture),'-i',str(sound_export)]
    if key=='film':
        command+=['-map','0:v:0','-map','1:a:0','-c','copy']
    else:
        command+=['-filter_complex',f'[1:a]atrim=start={start}:end={start+seconds},asetpts=PTS-STARTPTS[a]',
                  '-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k']
    command+=['-t',str(seconds),'-movflags','+faststart',str(output)]
    subprocess.run(command,check=True)
    original_hash=video_hash(picture); final_hash=video_hash(output)
    assert original_hash==final_hash, 'Approved video packets changed'
    data=info(output)
    assert (data['width'],data['height'],data['fps'],data['frames'])==(1280,720,24,frames)
    exports[key]={**data,'videoPacketHash':final_hash,'videoUnchanged':True,'seconds':seconds}
    print(key,json.dumps(exports[key]),flush=True)
manifest=json.loads((ROOT/'docs/cinematic-opening/media.json').read_text(encoding='utf-8'))
manifest['output']={k:v for k,v in exports['film'].items() if k not in ['videoPacketHash','videoUnchanged','seconds']}
manifest['humanApproval']='Visuals and voices approved in 0.1.119; new music and effects pending'
manifest['editor']='Concat 0.2.8 sound edit; approved 1280x720 H.264 packets copied without re-encode'
manifest['audio']={'origin':'Original MIDI score, FluidSynth/GeneralUser GS, original generated SFX, unchanged Kokoro speech',
                   'voiceReport':json.loads((DOC/'voice-report.json').read_text(encoding='utf-8')),
                   'soundDesign':'docs/cinematic-opening/revision-05/sound-design.json',
                   'fixedSpeakerVoices':True,'lipSync':False,'dialogueDucking':True}
(ROOT/'docs/cinematic-opening/media.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(DOC/'exports.json').write_text(json.dumps(exports,indent=2)+'\n',encoding='utf-8')
