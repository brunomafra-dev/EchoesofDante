from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path('docs/frontend-ux-audit-178/evidence')

def sheet(name, entries, columns=2, cell=(640, 385)):
    image = Image.new('RGB', (columns * cell[0], ((len(entries) + columns - 1) // columns) * cell[1]), '#0d1719')
    draw = ImageDraw.Draw(image)
    for index, (title, filename, crop) in enumerate(entries):
        source = Image.open(root / filename)
        if crop:
            source = source.crop(crop)
        source = ImageOps.contain(source, (cell[0] - 12, cell[1] - 35))
        x, y = index % columns * cell[0], index // columns * cell[1]
        image.paste(source, (x + 6, y + 29))
        draw.text((x + 8, y + 8), title, fill='#e8e3d4')
    image.save(root / name, quality=89)

sheet('integration-comparison.jpg', [
    ('Galerias: fissura - recorte ampliado', 'gallery-cargo-desktop.jpg', (325, 375, 525, 590)),
    ('Fratura: coletor - recorte ampliado', 'cold-collector-desktop.jpg', (410, 165, 780, 380)),
    ('Base: objetos / rotulos no mobile', 'base-cluster-mobile.jpg', None),
    ('Posto: abrigo, terminal e tubulacao', 'post-building-desktop.jpg', None),
    ('Primeiro abrigo / residentes no mobile', 'first-camp-mobile.jpg', None),
    ('Galerias: carga / marcas / encontros', 'gallery-cargo-mobile.jpg', None),
])
sheet('ux-comparison.jpg', [
    ('Configuracoes 568x320: estado inicial', 'settings-568-320.jpg', None),
    ('Configuracoes 844x390: estado inicial', 'settings-844-390.jpg', None),
    ('Diario avancado: detalhes abaixo da lista', 'journal-mobile.jpg', None),
    ('Lia: texto e acao abaixo da lista', 'lia-dialog-mobile.jpg', None),
    ('Volume geral 0: abertura diz SOM ATIVO', 'prologue-master-zero.jpg', None),
    ('Flags invalidas: salvo zero, exibido padrao', 'settings-stale-session.jpg', None),
])
