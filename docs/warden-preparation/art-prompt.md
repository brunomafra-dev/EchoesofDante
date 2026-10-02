# Assets originais — Primeiro Eco / limiar

Ferramenta: **imagegen**, com alpha. Referências próprias: `deep-relay.png` e `ancient-approach.png`, já aprovadas na linguagem D. Nenhum asset externo foi baixado.

Prompt utilizado:

> Create a transparent game asset sheet with TWO separate original painted assets, spaced widely apart and fully contained, NO text. Match the attached Echoes of Dante assets' illustration style exactly: hand-painted organic sci-fi 3/4 top-down, soft mineral surfaces, irregular silhouettes, contact shadows, worn slate olive stone, restrained violet #a98cff seams and amber #ffbd54 minerals, roots, no cyan, no triangles/low poly/fantasy runes. LEFT asset: a memorable small ancestral archive, a leaning split fossil-like stone shell 3 meters tall, asymmetrical eroded layered mineral shell engulfing a buried dark technological plate, one slender broken luminous violet inscription strip, amber inclusions, roots enclosing the foot, material and volume, mysterious and unfamiliar. RIGHT asset: a vastly monumental SEALED threshold, asymmetrical wide ancient geological arch with a solid heavy dark sealed stone slab inside, fully CLOSED with no traversable black hole, enormous layered stone shoulder on one side and fractured narrower buttress on other, subtle violet fissure across slab, deep shadows, sparse roots and amber mineral. Gate massive, ancient, integrated, not a temple, no figure/creature, no modern human machinery. Orthographic-like three quarter overhead game environment view matching refs. Both assets stand on transparent background including soft contact shadow. No terrain tile, sky, labels, captions or UI. Paint silhouettes and volumes, avoid geometric facets. Two clearly separated complete objects side by side for offline extraction.

Fonte preservada localmente: `.codex/generated_images/01a0df0e-3f54-78d2-bf2c-6f7125fee783/exec-b316d9cc-b680-4402-ba19-a7e925040d97.png` no perfil de usuário. O PNG original não é necessário à build; os recortes finais estão versionados.

```sh
python scripts/prepare-warden-art.py caminho/para/exec-b316d9cc-b680-4402-ba19-a7e925040d97.png
```

O script separa os dois objetos, recorta o alpha, reduz com Lanczos e mantém margem transparente em 512×512. Os PNGs RGBA finais somam **705.968 bytes (~689 KiB)**. São carregados pelo preload compartilhado do Phaser, sem geração procedural em runtime. As marcas iluminadas sobre o chão são geometria pequena estática, não substituem as pinturas dos objetos.
