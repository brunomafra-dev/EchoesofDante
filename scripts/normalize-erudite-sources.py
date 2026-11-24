"""Normalise raw generator outputs into the 18 Erudite source grids (0.1.205).

Image generators (Gemini, ChatGPT) rarely return a transparent 1536x1152 PNG.
This tool takes raw files named astral-{profession}-{sex}-{style}.png (any
size; non-4:3 sheets such as 1536x1024 are re-sliced cell by cell; solid or already-transparent background) and writes
validator-ready files. It only changes the container: background removal and
resize. It never repaints, moves or redraws a figure.

  python scripts/normalize-erudite-sources.py --raw .local/erudite-pack/raw

Output goes to docs/erudite-professions/source/ (use --out to change). Run
validate-erudite-sources.py afterwards. Recommended generator background:
flat pure magenta #FF00FF with no shadow (no figure uses magenta; green would
collide with the Beast Binder's green filament).
Requires Pillow and NumPy.
"""
from pathlib import Path
import argparse, sys
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SIZE = (1536, 1152)
NAMES = [f'astral-{p}-{s}-{t}.png' for p in ('warrior', 'hunter', 'xenobinder') for s in ('female', 'male') for t in ('none', 'basic', 'reinforced')]
T0, T1 = 38.0, 92.0   # colour distance where the key fades in/out


def background_colour(rgb):
    h, w = rgb.shape[:2]
    patches = [rgb[:8, :8], rgb[:8, -8:], rgb[-8:, :8], rgb[-8:, -8:]]
    samples = np.concatenate([p.reshape(-1, 3) for p in patches]).astype(float)
    colour = np.median(samples, axis=0)
    spread = float(np.abs(samples - colour).max())
    return colour, spread


def strip_grid_lines(arr, notes):
    """Paint the 8x6 cell borders with the background colour when the generator drew gridlines."""
    h, w = arr.shape[:2]
    colour, _ = background_colour(arr[:, :, :3])
    band = max(2, round(w / 256))
    for c in range(1, 8):
        x = round(c * w / 8)
        arr[:, max(0, x - band):x + band, :3] = colour
    for r in range(1, 6):
        y = round(r * h / 6)
        arr[max(0, y - band):y + band, :, :3] = colour
    arr[:band, :, :3] = colour
    arr[-band:, :, :3] = colour
    arr[:, :band, :3] = colour
    arr[:, -band:, :3] = colour
    notes.append(f'cell borders cleared ({band}px)')


def despill(arr, colour, band=3):
    """Remove the background colour that bleeds into the figure's edge pixels.

    Works only in a narrow band next to transparency, so painted colours deeper
    inside the figure are never touched. Tuned for magenta; for other flat
    backgrounds it reduces the matching channel excess the same way.
    """
    import cv2
    alpha = (arr[:, :, 3] > 8).astype('uint8')
    core = cv2.erode(alpha, np.ones((2 * band + 1, 2 * band + 1), np.uint8))
    edge = (alpha > 0) & (core == 0)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    hi = colour.argsort()[::-1]            # the strongest channels of the key colour
    ch = [arr[:, :, int(hi[0])], arr[:, :, int(hi[1])]]
    low = arr[:, :, int(hi[2])]
    spill = np.maximum(0, np.minimum(ch[0], ch[1]) - low)
    spill = np.where(edge, spill, 0)
    arr[:, :, int(hi[0])] = np.clip(ch[0] - spill, 0, 255)
    arr[:, :, int(hi[1])] = np.clip(ch[1] - spill, 0, 255)
    # leftover key-coloured specks next to transparency (pockets between legs/arms): drop them
    wide = (alpha > 0) & (cv2.erode(alpha, np.ones((13, 13), np.uint8)) == 0)
    magenta = np.minimum(ch[0], ch[1]) - low > 40
    arr[:, :, 3] = np.where(wide & magenta, 0, arr[:, :, 3])
    # pull the semi-transparent rim in by a hair so no fringe survives the resize
    rim = edge & (arr[:, :, 3] < 200)
    arr[:, :, 3] = np.where(rim, arr[:, :, 3] * 0.6, arr[:, :, 3])


def repack_cells(img):
    """Cut the sheet into 8x6 cells of its own size and centre each figure in a 192x192 cell."""
    w, h = img.size
    out = Image.new('RGBA', SIZE, (0, 0, 0, 0))
    for r in range(6):
        for c in range(8):
            x0, x1 = round(c * w / 8), round((c + 1) * w / 8)
            y0, y1 = round(r * h / 6), round((r + 1) * h / 6)
            cell = img.crop((x0, y0, x1, y1))
            k = min(188 / cell.width, 188 / cell.height)
            if abs(k - 1) > 0.01:
                cell = cell.resize((round(cell.width * k), round(cell.height * k)), Image.Resampling.LANCZOS)
            out.alpha_composite(cell, (c * 192 + (192 - cell.width) // 2, r * 192 + (192 - cell.height) // 2))
    return out


def normalise(path, out, notes):
    img = Image.open(path)
    img.load()
    w, h = img.size
    repack = abs(w / h - 4 / 3) > 0.03     # e.g. 1536x1024 or 1024x1024: re-slice the 8x6 cells, never stretch
    if repack and min(w, h) < 768:
        raise ValueError(f'{w}x{h} is too small to carry 48 figures')
    rgba = img.convert('RGBA')
    arr = np.array(rgba).astype(float)
    strip_grid_lines(arr, notes)
    alpha = arr[:, :, 3]
    if alpha.min() < 250 and (alpha < 5).mean() > 0.2:
        notes.append('already transparent: kept alpha')
    else:
        colour, spread = background_colour(arr[:, :, :3])
        if spread > 28:
            raise ValueError(f'corners are not one flat colour (spread {spread:.0f}); ask for a solid flat background')
        dist = np.sqrt(((arr[:, :, :3] - colour) ** 2).sum(axis=2))
        a = np.clip((dist - T0) / (T1 - T0), 0, 1)
        # remove the background contribution from semi-transparent edge pixels
        safe = np.maximum(a, 1e-3)[:, :, None]
        rgb = np.clip((arr[:, :, :3] - (1 - a)[:, :, None] * colour) / safe, 0, 255)
        arr[:, :, :3] = np.where(a[:, :, None] > 0, rgb, 0)
        arr[:, :, 3] = a * 255
        despill(arr, colour)
        notes.append(f'keyed background rgb{tuple(int(c) for c in colour)}')
    result = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    if repack:
        result = repack_cells(result)
        notes.append(f'cells repacked from {w}x{h} (uniform scale, no stretching)')
    if result.size != SIZE:
        result = result.resize(SIZE, Image.Resampling.LANCZOS)
        notes.append(f'resized {w}x{h} -> {SIZE[0]}x{SIZE[1]}')
    a = np.array(result.getchannel('A'))
    a[a < 6] = 0                       # kill faint fringe so the sheet has real transparency
    a[a > 250] = 255
    result.putalpha(Image.fromarray(a))
    out.parent.mkdir(parents=True, exist_ok=True)
    result.save(out, optimize=True)


def find_raw(raw, name):
    stem = Path(name).stem
    for ext in ('.png', '.webp', '.jpg', '.jpeg'):
        if (raw / (stem + ext)).exists():
            return raw / (stem + ext)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', default=str(ROOT / '.local/erudite-pack/raw'))
    ap.add_argument('--out', default=str(ROOT / 'docs/erudite-professions/source'))
    args = ap.parse_args()
    raw, out = Path(args.raw), Path(args.out)
    done = failed = 0
    for name in NAMES:
        src = find_raw(raw, name)
        if src is None:
            continue
        notes = []
        try:
            normalise(src, out / name, notes)
            done += 1
            print(f'ok    {name}: ' + '; '.join(notes))
        except Exception as exc:
            failed += 1
            print(f'FAIL  {name}: {exc}')
    missing = [n for n in NAMES if find_raw(raw, n) is None]
    print(f'{done} normalised, {failed} failed, {len(missing)} not in {raw}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
