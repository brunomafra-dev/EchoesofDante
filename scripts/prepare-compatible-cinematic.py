"""Offline delivery encodes of the approved master; no shot/audio mix changes."""
import hashlib
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'public/assets/cinematic-opening'
SOURCE = MEDIA / 'arrival-whole-scene.mp4'
DOC = ROOT / 'docs/cinematic-compatibility'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

def encode(name, args):
    target = MEDIA / name
    subprocess.run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'warning', '-i', str(SOURCE),
                    '-map', '0:v:0', '-map', '0:a:0', *args, str(target)], check=True)
    return {'file': name, 'bytes': target.stat().st_size,
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}

files = [encode('arrival-compatible-v1.mp4', [
    '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'baseline', '-level:v', '3.1',
    '-pix_fmt', 'yuv420p', '-crf', '22', '-maxrate', '2400k', '-bufsize', '4800k',
    '-g', '48', '-keyint_min', '24', '-movflags', '+faststart',
    '-c:a', 'aac', '-profile:a', 'aac_low', '-b:a', '128k', '-ar', '48000']),
    encode('arrival-compatible-v1.webm', [
    '-c:v', 'libvpx-vp9', '-row-mt', '1', '-threads', '4', '-cpu-used', '3',
    '-pix_fmt', 'yuv420p', '-crf', '31', '-b:v', '1600k', '-maxrate', '2200k',
    '-bufsize', '4400k', '-g', '48', '-c:a', 'libopus', '-b:a', '112k'])]
DOC.mkdir(parents=True, exist_ok=True)
(DOC / 'media.json').write_text(json.dumps({
    'source': str(SOURCE.relative_to(ROOT)), 'sourceBytes': SOURCE.stat().st_size,
    'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'width': 1280, 'height': 720, 'fps': 24, 'seconds': 54.25,
    'mix': 'Approved source, same edits and audio; delivery transcode only.', 'files': files,
}, indent=2) + '\n', encoding='utf-8')
print(json.dumps(files))
