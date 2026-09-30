"""Render the two original, temporary Echoes of Dante exploration loops.

Offline authoring only: the browser plays the resulting WAV files directly.
No samples, external libraries, or third-party recordings are used.
"""

import math
import struct
import wave
from pathlib import Path

RATE = 22050
DURATION = 16
TAU = math.tau
DEST = Path(__file__).resolve().parents[1] / "public/assets/audio"
DEST.mkdir(parents=True, exist_ok=True)

FOREST_CHORDS = [
    (146.83, 220.00, 329.63),  # D, A, E: an open signal
    (174.61, 261.63, 349.23),
    (130.81, 196.00, 329.63),
    (146.83, 220.00, 293.66),
]
CAVERN_CHORDS = [
    (73.42, 146.83, 220.00),
    (87.31, 174.61, 261.63),
    (65.41, 130.81, 196.00),
    (73.42, 146.83, 220.00),
]
MOTIF = [
    (0.70, 293.66, 0.80), (2.10, 349.23, 0.65), (3.05, 329.63, 0.90),
    (4.70, 220.00, 0.90), (6.10, 293.66, 0.70), (7.00, 261.63, 1.10),
    (8.70, 329.63, 0.80), (10.10, 349.23, 0.65), (11.05, 293.66, 0.95),
    (12.70, 220.00, 0.90), (14.10, 261.63, 0.70), (15.02, 293.66, 0.75),
]


def envelope(age: float, length: float) -> float:
    if age < 0 or age > length:
        return 0.0
    return min(1.0, age / 0.11, (length - age) / 0.35)


def render(name: str, chords: list[tuple[float, float, float]], deep: bool) -> None:
    samples = [0.0] * (RATE * DURATION)
    for i in range(len(samples)):
        t = i / RATE
        chord = chords[int(t // 4)]
        phase = t % 4
        breath = (0.5 - 0.5 * math.cos(TAU * phase / 4)) * 0.18 + 0.82
        pad = 0.0
        for j, note in enumerate(chord):
            pad += math.sin(TAU * note * t + 0.22 * math.sin(TAU * 0.14 * t + j)) * (0.56 if j == 0 else 0.28)
            pad += 0.15 * math.sin(TAU * (note * 2.005) * t)
        pad *= 0.072 * breath
        pulse_age = t % (2.0 if deep else 2.5)
        pulse = math.sin(TAU * (chord[0] / 2) * t) * math.exp(-pulse_age * 3.2) * (0.034 if deep else 0.024)
        signal = math.sin(TAU * (54 if deep else 67) * t + 0.12 * math.sin(TAU * 0.19 * t)) * 0.026
        samples[i] = pad + pulse + signal

    for start, note, length in MOTIF:
        note = note * (0.75 if deep else 1.0)
        offset = int(start * RATE)
        end = min(len(samples), offset + int(length * RATE))
        for i in range(offset, end):
            age = (i - offset) / RATE
            bell = math.sin(TAU * note * age) + 0.24 * math.sin(TAU * 2.01 * note * age)
            samples[i] += 0.070 * envelope(age, length) * bell

    # Two quiet echoes add space without a runtime effect or scheduler.
    dry = samples[:]
    for delay, amount in ((0.19, 0.16), (0.38, 0.08)):
        shift = int(delay * RATE)
        for i in range(shift, len(samples)):
            samples[i] += dry[i - shift] * amount

    with wave.open(str(DEST / name), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b"".join(
            struct.pack("<h", int(max(-1, min(1, 1.4 * value * min(1, t / 0.25, (DURATION - t) / 0.25))) * 32767))
            for t, value in ((i / RATE, sample) for i, sample in enumerate(samples))
        ))


render("forest-theme.wav", FOREST_CHORDS, False)
render("cavern-theme.wav", CAVERN_CHORDS, True)
