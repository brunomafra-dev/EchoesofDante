"""Normalize original imagegen paintings for the existing world anchors.

Offline only. Usage: python scripts/prepare-environment-art.py SOURCE_DIRECTORY
The source files are retained. Pillow is an authoring tool, not a game dependency.
"""
from pathlib import Path
import sys
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/assets/visual/environment"
SOURCES = {
    "rock-shelf": "exec-02ea044c-28cd-4153-8303-2690dbb82361.png",
    "forest-canopy": "exec-136f2a88-1468-4c7f-90e0-efab0704244f.png",
    "forest-trunk": "exec-ffb1e8d6-b2fb-45d5-ae94-a0bf2af92091.png",
    "mineral-growth": "exec-60b5f8f7-1c6a-48a0-8803-ee1155f35420.png",
    "ancient-frame": "exec-a7841a5e-05ce-4510-8e0a-692a5c86fdbb.png",
    "ancient-remnant": "exec-1d72e0a1-69f1-451e-95e1-42d2112dc4bd.png",
    "forest-ground": "exec-557db3dd-854e-4009-b611-2d6fe02ef025.png",
    "cavern-ground": "exec-97ba7188-27fc-49e4-a103-9ba1627e0b69.png",
}

def cutout(source, canvas, fit, center):
    im = Image.open(source).convert("RGBA")
    bbox = im.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    if not bbox:
        raise ValueError(f"Empty cutout: {source}")
    im = im.crop(bbox)
    im.thumbnail(fit, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", canvas)
    out.alpha_composite(im, (round(center[0]-im.width/2), round(center[1]-im.height/2)))
    return out

def main():
    source = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for name, filename in SOURCES.items():
        if name.endswith("ground"):
            im = Image.open(source / filename).convert("RGB").resize((512, 512), Image.Resampling.LANCZOS)
            # Quiet ground preserves authored path contrast. Crossfade opposite edges
            # offline so the repeated material cannot produce hard square seams.
            pixels = im.load()
            original = im.copy().load()
            n, edge = 512, 32
            for y in range(n):
                for x in range(n):
                    dx, dy = min(x, n-1-x), min(y, n-1-y)
                    wx, wy = max(0, (edge-dx)/edge)*0.5, max(0, (edge-dy)/edge)*0.5
                    a, b, c, d = original[x,y], original[n-1-x,y], original[x,n-1-y], original[n-1-x,n-1-y]
                    pixels[x,y] = tuple(round(a[k]*(1-wx)*(1-wy)+b[k]*wx*(1-wy)+c[k]*(1-wx)*wy+d[k]*wx*wy) for k in range(3))
            im = ImageEnhance.Color(im).enhance(0.72)
            im = ImageEnhance.Contrast(im).enhance(0.65)
        elif name == "forest-canopy":
            im = cutout(source/filename, (200,150), (182,132), (100,72))
        elif name == "forest-trunk":
            # Root contact remains (112,106), matching treeFootprint and the old origin.
            im = cutout(source/filename, (220,155), (140,130), (112,71))
        else:
            fit = (448,400) if name == "rock-shelf" else (460,460)
            im = cutout(source/filename, (512,512), fit, (256,256))
        im.save(OUT / f"{name}.png", optimize=True)
    # A painted root apron replaces the lab's line-drawn overlay in the world.
    roots = Image.open(OUT / "forest-trunk.png").convert("RGBA").crop((42, 85, 182, 132))
    alpha = roots.getchannel("A")
    for y in range(10):
        for x in range(roots.width):
            alpha.putpixel((x,y), round(alpha.getpixel((x,y))*y/10))
    roots.putalpha(alpha)
    roots = roots.resize((256,86), Image.Resampling.LANCZOS)
    apron = Image.new("RGBA", (256,128))
    apron.alpha_composite(roots, (0,21))
    apron.save(OUT / "root-growth.png", optimize=True)
    for old, new in [("rock-illustrated","world-rock"), ("contact-shadow","world-shadow")]:
        im = Image.open(ROOT / f"public/assets/experiments/rock-rendering/{old}.png")
        im.save(OUT / f"{new}.png", optimize=True)
    for asset in sorted(OUT.glob("*.png")):
        print(asset.name, Image.open(asset).size, asset.stat().st_size)

if __name__ == "__main__":
    main()
