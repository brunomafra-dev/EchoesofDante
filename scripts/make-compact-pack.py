"""Build the compact ImageGen pack for the Erudite and Beast-Binder (Vinculado) batches.

Writes .local/imagegen-pack/ (ignored by Git): short prompts, the minimum set of
reference images and a README. Cost is driven by image count, size and quality,
not by prompt length, so the prompt is short but keeps every rule that previously
caused rejected sheets (magenta background, four distinct walk steps, blue blade).

  python scripts/make-compact-pack.py
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
ACTORS = ROOT / 'public/assets/visual/complete-actors'
PACK = ROOT / '.local/imagegen-pack'
STYLES = ('none', 'basic', 'reinforced')
SEXES = ('female', 'male')
CHARACTERS = {   # visual preset -> professions it still needs
    'astral': ('warrior', 'hunter', 'xenobinder'),      # Erudito / Erudita
    'xenobinder': ('warrior', 'hunter', 'astral'),      # Vinculado / Vinculada
}
INSTRUMENT = {
    'warrior': ('energy saber', 'Weapon: one-handed energy saber, thick glowing cyan-blue blade (never white or silver), held low and forward at rest.'),
    'hunter': ('plasma carbine', 'Weapon: compact two-handed plasma carbine with a small cyan muzzle glow; low-ready at rest, aimed forward in row 6.'),
    'astral': ('casting gauntlet', 'Tool: dark-metal casting gauntlet on the right forearm with a cyan palm emitter; open palm forward in row 6.'),
    'xenobinder': ('conductor glove', 'Tool: olive conductor glove with green filament lines on the right hand; open-hand command gesture in row 6. No creature.'),
}
TEMPLATE = """8x6 sprite sheet, painterly 2D isometric action RPG. Flat magenta #FF00FF background; no grid, text, shadows or floor. 48 full-body figures, one per cell, same scale, feet on one baseline, nothing cropped.
Columns = facing: S, SE, E, NE, N, NW, W, SW. Rows: 1 idle; 2-5 four distinct walk steps (left contact, right passing, right contact, left passing); 6 attack pose.
Figure: the exact person, face, hair, outfit and armor of Ref1 ({sex}). From Ref2 take ONLY the {name}; ignore its body and clothes.
{text}
"""

refs = PACK / 'refs'
prompts = PACK / 'prompts'
if PACK.exists():
    shutil.rmtree(PACK)
refs.mkdir(parents=True)
prompts.mkdir()
rows = []
n = 0
for preset, professions in CHARACTERS.items():
    for profession in professions:
        for sex in SEXES:
            for style in STYLES:
                n += 1
                ref1 = f'{preset}-{sex}-{style}.png'
                ref2 = f'{profession}-{sex}-none.png'
                for name in (ref1, ref2):
                    if not (refs / name).exists():
                        shutil.copy2(ACTORS / name, refs / name)
                out = f'{preset}-{profession}-{sex}-{style}.png'
                name, text = INSTRUMENT[profession]
                body = TEMPLATE.format(sex=sex, name=name, text=text)
                (prompts / f'{n:02d}_{out[:-4]}.txt').write_text(f'SAVE AS: {out}\nREF 1: refs/{ref1}\nREF 2: refs/{ref2}\n\n--- PROMPT ---\n{body}', encoding='utf8')
                rows.append(f'| {n:02d} | `{out}` | `{ref1}` | `{ref2}` |')
readme = f"""# Pacote ImageGen enxuto: Erudito e Vinculado ({n} folhas)

Cada folha = 1 imagem. Anexe Ref 1 e Ref 2, cole o texto depois de `--- PROMPT ---`, peça **1 imagem, 1536x1024, qualidade media**.
Salve em `.local/erudite-pack/raw/` com o nome de `SAVE AS` (Erudito) e rode `python scripts/normalize-erudite-sources.py`;
o normalizador aceita 1536x1024 e 1024x1024. O Vinculado ainda precisa do preset `xenobinder` no pipeline (so quando as folhas existirem).

Ordem para gastar pouco: gere **uma** folha primeiro, valide, e so entao as outras.

| # | Salvar como | Ref 1 (identidade) | Ref 2 (so o instrumento) |
|---|---|---|---|
""" + '\n'.join(rows) + '\n'
(PACK / 'LEIA-ME.md').write_text(readme, encoding='utf8')
print(n, 'prompts,', len(list(refs.iterdir())), 'refs')
