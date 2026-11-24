"""Validate the 18 externally painted Erudite source grids (0.1.205).

Read-only: never writes game assets. It checks the contract that
prepare-scout-professions.py relies on and the rules of the project
(whole painted figures, no loose limbs/instruments, real walk phases).

Usage:
  python scripts/validate-erudite-sources.py                 # all 18 required
  python scripts/validate-erudite-sources.py --allow-partial # validate what exists
  python scripts/validate-erudite-sources.py --source-dir DIR --report FILE

Exit code 0 only when there are no errors (and, unless --allow-partial,
all 18 files exist). Requires Pillow, NumPy and OpenCV.
"""
from pathlib import Path
import argparse, hashlib, itertools, json, sys
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PROFESSIONS = ['warrior', 'hunter', 'xenobinder']
SEXES = ['female', 'male']
STYLES = ['none', 'basic', 'reinforced']
EXPECTED = [(p, s, t) for p in PROFESSIONS for s in SEXES for t in STYLES]
SIZE = (1536, 1152)
COLS, ROWS = 8, 6
EDGE_MARGIN = 4          # figure must not touch its cell border
LOOSE_RATIO = 0.05       # a second component bigger than this share of the figure is "loose"
HEIGHT_RATIO = (0.86, 1.07)   # same bounds that verify-scout-professions.py enforces after scaling
PHASE_ERROR, PHASE_WARN = 0.005, 0.03


def name(p, s, t):
    return f'astral-{p}-{s}-{t}.png'


def tile_info(tile):
    """Return dict about the figure in one cell, or an error string."""
    alpha = tile[:, :, 3]
    mask = (alpha > 32).astype('uint8')
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n <= 1:
        return {'error': 'empty cell'}
    areas = stats[1:, cv2.CC_STAT_AREA]
    main = 1 + int(np.argmax(areas))
    main_area = int(areas.max())
    others = sorted((int(a) for i, a in enumerate(areas, 1) if i != main), reverse=True)
    ys, xs = np.where(labels == main)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    keep = cv2.dilate((labels == main).astype('uint8'), np.ones((3, 3), np.uint8)) > 0
    rgb = tile[:, :, :3].astype(float)
    solid = (alpha > 128) & keep
    cyan = (rgb[:, :, 1] > rgb[:, :, 0] * 1.28) & (rgb[:, :, 2] > rgb[:, :, 0] * 1.28) & (rgb[:, :, 1] > 100)
    body = solid & ~cyan
    yy, _ = np.where(body)
    if len(yy) < 1000:
        return {'error': f'figure too small ({len(yy)} body pixels)'}
    return {'box': box, 'main_area': main_area, 'loose': others[0] if others else 0,
            'top': int(yy.min()), 'bottom': int(yy.max()) + 1,
            'lower': (alpha[96:, :] > 128), 'full': (alpha > 128)}


def validate(path):
    errors, warnings = [], []
    try:
        raw = Image.open(path)
        raw.load()
    except Exception as exc:  # unreadable/corrupt
        return {'errors': [f'unreadable image: {exc}'], 'warnings': []}
    if raw.size != SIZE:
        errors.append(f'size {raw.size[0]}x{raw.size[1]}, expected {SIZE[0]}x{SIZE[1]}')
    if raw.mode not in ('RGBA', 'LA') and 'transparency' not in raw.info:
        errors.append(f'no alpha channel (mode {raw.mode}); transparent background required')
        return {'errors': errors, 'warnings': warnings}
    image = raw.convert('RGBA')
    w, h = image.size
    alpha = np.array(image.getchannel('A'))
    lo, hi = int(alpha.min()), int(alpha.max())
    if (lo, hi) != (0, 255):
        errors.append(f'alpha range {lo}-{hi}; needs fully transparent and fully opaque pixels')
    opaque = float((alpha > 128).mean())
    if opaque > 0.40:
        errors.append(f'{opaque:.0%} of the sheet is opaque: background/floor not removed')
    if errors:
        return {'errors': errors, 'warnings': warnings}
    grid = {}
    for r in range(ROWS):
        for c in range(COLS):
            tile = np.array(image.crop((round(c * w / COLS), round(r * h / ROWS), round((c + 1) * w / COLS), round((r + 1) * h / ROWS))))
            info = tile_info(tile)
            if 'error' in info:
                errors.append(f'row {r + 1} col {c + 1}: {info["error"]}')
                continue
            grid[(r, c)] = info
            x0, y0, x1, y1 = info['box']
            th, tw = tile.shape[:2]
            if x0 < EDGE_MARGIN or y0 < EDGE_MARGIN or x1 > tw - EDGE_MARGIN or y1 > th - EDGE_MARGIN:
                errors.append(f'row {r + 1} col {c + 1}: figure/instrument touches or crosses the cell border')
            if info['loose'] > LOOSE_RATIO * info['main_area']:
                errors.append(f'row {r + 1} col {c + 1}: detached piece ({info["loose"]} px); the importer keeps only the largest piece and would erase it (loose limb or instrument?)')
    if errors:
        return {'errors': errors, 'warnings': warnings}
    for c in range(COLS):
        base = grid[(0, c)]
        height0 = base['bottom'] - base['top']
        if height0 < 80:
            errors.append(f'col {c + 1}: idle figure only {height0}px tall; too low-resolution')
        elif height0 < 120:
            warnings.append(f'col {c + 1}: idle figure {height0}px tall (cell is 192px); sheet looks small')
        for r in range(1, ROWS):
            height = grid[(r, c)]['bottom'] - grid[(r, c)]['top']
            ratio = height / height0
            if not HEIGHT_RATIO[0] <= ratio <= HEIGHT_RATIO[1]:
                errors.append(f'row {r + 1} col {c + 1}: figure height is {ratio:.2f}x the idle pose; scale/torso changed')
            if r <= 4 and abs(grid[(r, c)]['bottom'] - base['bottom']) > 8:
                warnings.append(f'row {r + 1} col {c + 1}: feet baseline differs from idle by {abs(grid[(r, c)]["bottom"] - base["bottom"])}px')
        phases = [grid[(r, c)]['lower'] for r in range(1, 5)]
        for (i, a), (j, b) in itertools.combinations(enumerate(phases, 1), 2):
            union = np.count_nonzero(a | b)
            diff = np.count_nonzero(a ^ b) / union if union else 0
            if diff < PHASE_ERROR:
                errors.append(f'col {c + 1}: walk rows {i + 1} and {j + 1} are identical (need four real phases)')
            elif diff < PHASE_WARN:
                warnings.append(f'col {c + 1}: walk rows {i + 1} and {j + 1} are very similar ({diff:.1%} different)')
        idle = grid[(0, c)]['full']
        union = np.count_nonzero(idle | grid[(5, c)]['full'])
        if union and np.count_nonzero(idle ^ grid[(5, c)]['full']) / union < 0.03:
            warnings.append(f'col {c + 1}: action row barely differs from idle')
    return {'errors': errors, 'warnings': warnings}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source-dir', default=str(ROOT / 'docs/erudite-professions/source'))
    ap.add_argument('--report', default=str(ROOT / 'docs/2d-refinement/qa/205/source-validation/report.json'))
    ap.add_argument('--allow-partial', action='store_true')
    ap.add_argument('--quiet', action='store_true')
    args = ap.parse_args()
    src = Path(args.source_dir)
    report = {'passed': False, 'sourceDir': str(src), 'expected': len(EXPECTED), 'found': 0, 'missing': [], 'sheets': {}, 'duplicates': []}
    digests = {}
    for combo in EXPECTED:
        file = src / name(*combo)
        if not file.exists():
            report['missing'].append(name(*combo))
            continue
        report['found'] += 1
        result = validate(file)
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        result['sha256'] = digest
        digests.setdefault(digest, []).append(name(*combo))
        report['sheets'][name(*combo)] = result
    for digest, files in digests.items():
        if len(files) > 1:
            report['duplicates'].append(files)
    errors = sum(len(s['errors']) for s in report['sheets'].values()) + len(report['duplicates'])
    complete = not report['missing']
    report['passed'] = errors == 0 and (complete or args.allow_partial) and report['found'] > 0
    report['complete'] = complete
    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
    if not args.quiet:
        print(f'Erudite sources: {report["found"]}/{len(EXPECTED)} found, {errors} error(s)')
        for file in report['missing']:
            print(f'  MISSING {file}')
        for file, result in report['sheets'].items():
            for message in result['errors'][:6]:
                print(f'  ERROR   {file}: {message}')
            if len(result['errors']) > 6:
                print(f'  ERROR   {file}: ... {len(result["errors"]) - 6} more')
            for message in result['warnings'][:3]:
                print(f'  warn    {file}: {message}')
        for files in report['duplicates']:
            print('  ERROR   identical files:', ', '.join(files))
        print('PASSED' if report['passed'] else 'NOT READY')
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
