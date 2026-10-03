"""Author the original Warden music prototype as a small, seamless PCM loop.

This is an offline score, not a runtime music generator. Its fixed notes and
rhythm were written for Echoes of Dante; it contains no recordings, downloads,
external samples, AI music, or dependencies. Browser playback uses one WAV.
"""

import math
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 24
BEAT = 0.75  # 80 BPM; two restrained beats beneath each deliberate movement.
TAU = math.tau
SIZE = RATE * DURATION
DEST = Path(__file__).resolve().parents[1] / "public/assets/audio/warden-theme.wav"

# The exploration score's open D / A / E relationship returns in a lower register.
# Long, uneven gaps keep the creature's warnings audible above the tension bed.
SIGNAL_SCORE = [
    (1.125, 293.66, 2.6, 0.030), (3.75, 220.0, 2.2, 0.024),
    (6.75, 329.63, 2.6, 0.029), (9.375, 293.66, 2.8, 0.026),
    (13.125, 349.23, 2.8, 0.030), (16.5, 329.63, 2.7, 0.025),
    (19.5, 220.0, 2.6, 0.029), (22.125, 293.66, 3.2, 0.026),
]
PULSES = [0, 2, 4.5, 6, 8, 10, 12.5, 14, 16, 18, 20.5, 22, 24, 26, 28.5, 30]


def add_voice(samples, start, length, voice):
    """Wrap releases over the boundary, preserving the authored loop tail."""
    offset = round(start * RATE)
    for frame in range(round(length * RATE)):
        age = frame / RATE
        samples[(offset + frame) % SIZE] += voice(age, length)


def mineral_note(note, amount):
    def voice(age, length):
        envelope = min(1.0, age / 0.12, (length - age) / 0.8)
        # Soft mineral partials, deliberately unlike an electronic square beep.
        body = math.sin(TAU * note * age)
        grain = math.sin(TAU * note * 2.017 * age) * math.exp(-age * 1.3) * 0.16
        return (body + grain) * envelope * math.exp(-age * 0.5) * amount
    return voice


def pulse(age, length):
    envelope = min(1.0, age / 0.025, (length - age) / 0.24) * math.exp(-age * 5.2)
    # A short voiced thud and woody partial; no noise sample or percussion pack.
    phase = TAU * (42 * age + 12 * (1 - math.exp(-age * 8)) / 8)
    return (math.sin(phase) + 0.14 * math.sin(TAU * 137 * age)) * envelope * 0.067


def render():
    samples = [0.0] * SIZE
    # Integer cycle counts make the continuous bed periodic at the loop boundary.
    for i in range(SIZE):
        t = i / RATE
        breath = 0.84 + 0.16 * math.cos(TAU * t / 6)
        root = math.sin(TAU * round(36.71 * DURATION) * t / DURATION)
        fifth = math.sin(TAU * 55 * t + 0.16 * math.sin(TAU * t / 12))
        surface = math.sin(TAU * round(146.83 * DURATION) * t / DURATION)
        samples[i] = (root * 0.040 + fifth * 0.024 + surface * 0.007) * breath

    for beat in PULSES:
        add_voice(samples, beat * BEAT, 0.65, pulse)
    for start, note, length, amount in SIGNAL_SCORE:
        add_voice(samples, start, length, mineral_note(note, amount))
        add_voice(samples, start + 0.31, length, mineral_note(note, amount * 0.18))
        add_voice(samples, start + 0.67, length, mineral_note(note, amount * 0.08))

    peak = max(abs(sample) for sample in samples)
    gain = 0.34 / peak
    pcm = [round(sample * gain * 32767) for sample in samples]
    DEST.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(DEST), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(struct.pack(f"<{SIZE}h", *pcm))

    # Compare the seam with neighboring sample differences, not just zero amplitude.
    seam = abs(pcm[0] - pcm[-1])
    nearby = max(abs(pcm[i] - pcm[i - 1]) for i in list(range(1, 256)) + list(range(SIZE - 256, SIZE)))
    assert max(abs(value) for value in pcm) < 32767, "Audio clips"
    assert seam <= nearby * 1.1 + 2, "Discontinuous loop boundary"
    rms = math.sqrt(sum(value * value for value in pcm) / SIZE) / 32767
    print(f"{DEST.name}: {DURATION}s, mono PCM16, {RATE} Hz, {DEST.stat().st_size} bytes")
    print(f"peak={max(abs(value) for value in pcm) / 32767:.4f}; rms={rms:.4f}; seam={seam}; nearby_delta={nearby}")


if __name__ == "__main__":
    render()
