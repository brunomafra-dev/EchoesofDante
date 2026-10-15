"""Render the silent cinematic trailer used by the in-game first-arrival prologue.

The five original paintings are only source plates. This offline render adds
continuous camera movement, crossfades, restrained atmospheric motion and
letterboxing; runtime playback is a single MP4 video element.
Requires Pillow and imageio-ffmpeg in the asset-authoring environment.
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/prologue"
OUTPUT = SOURCE / "arrival-trailer.mp4"
PLATES = ["earth", "evacuation", "voyage", "dante", "landing"]
WIDTH, HEIGHT, FPS = 1280, 720, 24
SHOT_SECONDS, BLEND_SECONDS = 4.4, 0.6
STEP = SHOT_SECONDS - BLEND_SECONDS
DURATION = (len(PLATES) - 1) * STEP + SHOT_SECONDS


def cover(image: Image.Image, t: float, shot: int) -> Image.Image:
    """Slow, directionally varied camera move over one 16:9 painted plate."""
    zoom = 1.045 + 0.025 * t
    w, h = round(WIDTH * zoom), round(HEIGHT * zoom)
    frame = image.resize((w, h), Image.Resampling.LANCZOS)
    max_x, max_y = w - WIDTH, h - HEIGHT
    progress = 0.5 - 0.5 * math.cos(math.pi * t)
    direction = -1 if shot in (1, 3) else 1
    x = round(max_x * (0.18 + 0.64 * (progress if direction > 0 else 1 - progress)))
    y = round(max_y * (0.22 + 0.56 * progress))
    return frame.crop((x, y, x + WIDTH, y + HEIGHT))


def atmosphere(shot: int, t: float) -> Image.Image:
    rng = random.Random(7100 + shot)
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    palette = ((246, 173, 96), (200, 225, 213), (161, 196, 219), (177, 166, 255), (245, 194, 122))
    count = 52 if shot in (0, 1, 4) else 68
    for _ in range(count):
        x0, y0 = rng.randrange(WIDTH), rng.randrange(HEIGHT)
        vx, vy = rng.uniform(-9, 9), rng.uniform(-17, -2)
        x = (x0 + vx * t) % WIDTH
        y = (y0 + vy * t) % HEIGHT
        radius = rng.choice((1, 1, 1, 2))
        color = palette[shot]
        alpha = rng.randrange(20, 58)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*color, alpha))
    return overlay.filter(ImageFilter.GaussianBlur(0.35))


def vignette_mask() -> Image.Image:
    mask = Image.new("L", (WIDTH, HEIGHT), 0)
    pixels = mask.load()
    cx, cy = WIDTH / 2, HEIGHT / 2
    for y in range(HEIGHT):
        for x in range(WIDTH):
            radius = math.sqrt(((x - cx) / cx) ** 2 + ((y - cy) / cy) ** 2)
            pixels[x, y] = max(0, min(54, round(max(0, radius - 0.58) * 66)))
    return mask


VIGNETTE = vignette_mask()


def grade(frame: Image.Image) -> Image.Image:
    # Mild contrast/vignette anchors the paintings together without changing
    # Dante's established green, amber and violet palette.
    frame = frame.convert("RGB")
    shade = Image.new("RGB", (WIDTH, HEIGHT), (4, 12, 13))
    return Image.composite(shade, frame, VIGNETTE)


def render_frame(plates: list[Image.Image], seconds: float) -> Image.Image:
    shot = min(len(PLATES) - 1, int(seconds / STEP))
    local = min(1.0, max(0.0, (seconds - shot * STEP) / SHOT_SECONDS))
    current = cover(plates[shot], local, shot).convert("RGBA")
    blend_at = SHOT_SECONDS - BLEND_SECONDS
    if shot + 1 < len(PLATES) and seconds - shot * STEP > blend_at:
        next_start = (shot + 1) * STEP
        next_local = min(1.0, max(0.0, (seconds - next_start) / SHOT_SECONDS))
        nxt = cover(plates[shot + 1], next_local, shot + 1).convert("RGBA")
        alpha = (seconds - (shot * STEP + blend_at)) / BLEND_SECONDS
        current = Image.blend(current, nxt, max(0.0, min(1.0, alpha)))
    frame = Image.alpha_composite(current, atmosphere(shot, local)).convert("RGB")
    frame = grade(frame)
    # Letterbox the image itself so the video reads as a single trailer frame.
    draw = ImageDraw.Draw(frame)
    draw.rectangle((0, 0, WIDTH, 30), fill=(2, 5, 6))
    draw.rectangle((0, HEIGHT - 30, WIDTH, HEIGHT), fill=(2, 5, 6))
    return frame


def main() -> None:
    plates = [Image.open(SOURCE / f"{name}.webp").convert("RGB") for name in PLATES]
    writer = imageio_ffmpeg.write_frames(
        str(OUTPUT), (WIDTH, HEIGHT), fps=FPS, codec="libx264", pix_fmt_in="rgb24",
        pix_fmt_out="yuv420p", ffmpeg_log_level="error",
        output_params=["-crf", "23", "-preset", "medium", "-movflags", "+faststart", "-an"],
    )
    writer.send(None)
    try:
        for index in range(round(DURATION * FPS)):
            seconds = index / FPS
            writer.send(render_frame(plates, seconds).tobytes())
    finally:
        writer.close()
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes, {DURATION:.1f}s, {WIDTH}x{HEIGHT} @ {FPS} fps)")


if __name__ == "__main__":
    main()
