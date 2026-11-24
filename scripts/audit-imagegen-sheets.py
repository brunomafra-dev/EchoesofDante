"""Audit raw generator sheets (Erudite `astral-*` and Vinculado `xenobinder-*`) against the 8x6 contract.

Counts the figures in every sheet, groups them into rows, and reports per
character/profession pair which sheets are usable and which must be regenerated.
Read-only; writes .local/imagegen-pack/audit.json and audit.md.

  python scripts/audit-imagegen-sheets.py [--raw .local/erudite-pack/raw]
Requires Pillow, NumPy and OpenCV.
"""
from pathlib import Path
import argparse, collections, json
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PAIRS = {'astral': ('warrior', 'hunter', 'xenobinder'), 'xenobinder': ('warrior', 'hunter', 'astral')}
LABEL = {'astral': 'Erudito/Erudita', 'xenobinder': 'Vinculado/Vinculada'}
SEXES, STYLES = ('female', 'male'), ('none', 'basic', 'reinforced')


def classify(path):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    h, w = a.shape[:2]
    bg = np.median(np.concatenate([a[:6, :6].reshape(-1, 3), a[:6, -6:].reshape(-1, 3), a[-6:, :6].reshape(-1, 3), a[-6:, -6:].reshape(-1, 3)]), axis=0)
    m = (np.sqrt(((a - bg) ** 2).sum(axis=2)) > 90).astype('uint8')
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    n, _, st, cen = cv2.connectedComponentsWithStats(m, 8)
    figs = sorted(((cen[i][1], cen[i][0]) for i in range(1, n) if st[i][cv2.CC_STAT_AREA] > 1500))
    rows, gap = [], 0.09 * h
    for y, x in figs:
        if rows and y - rows[-1][-1][0] < gap:
            rows[-1].append((y, x))
        else:
            rows.append([(y, x)])
    per = [len(r) for r in rows]
    cols = collections.Counter(per).most_common(1)[0][0] if per else 0
    if len(figs) == 48 and per == [8] * 6:
        verdict = 'ok'
    elif cols == 8 and per == [8] * len(per):
        verdict = f'missing {6 - len(per)} row(s)' if len(per) < 6 else 'extra rows'
    elif cols == 7:
        verdict = 'missing a direction (7 columns)'
    else:
        verdict = 'irregular grid'
    return {'size': [w, h], 'figures': len(figs), 'perRow': per, 'verdict': verdict}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--raw', default=str(ROOT / '.local/erudite-pack/raw'))
    ap.add_argument('--out', default=str(ROOT / '.local/imagegen-pack'))
    args = ap.parse_args()
    raw = Path(args.raw)
    report, lines = {}, []
    for preset, professions in PAIRS.items():
        for profession in professions:
            ok, bad = [], []
            for sex in SEXES:
                for style in STYLES:
                    name = f'{preset}-{profession}-{sex}-{style}.png'
                    f = raw / name
                    if not f.exists():
                        bad.append((name, 'not generated'))
                        report[name] = {'verdict': 'not generated'}
                        continue
                    info = classify(f)
                    report[name] = info
                    (ok if info['verdict'] == 'ok' else bad).append((name, info['verdict']))
            complete = not bad
            lines.append(f'### {LABEL[preset]} como {profession}: {len(ok)}/6 corretas' + (' (pronto para importar)' if complete else ''))
            for name, why in bad:
                lines.append(f'- refazer `{name}`: {why}')
    total_ok = sum(1 for v in report.values() if v['verdict'] == 'ok')
    summary = f'{total_ok} de {len(report)} folhas esperadas estao corretas (8x6 = 48 figuras).'
    Path(args.out).mkdir(parents=True, exist_ok=True)
    (Path(args.out) / 'audit.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
    (Path(args.out) / 'audit.md').write_text(summary + '\n\n' + '\n'.join(lines) + '\n', encoding='utf8')
    print(summary)
    print('\n'.join(lines))


if __name__ == '__main__':
    main()
