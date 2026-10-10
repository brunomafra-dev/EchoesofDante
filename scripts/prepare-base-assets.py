"""Offline packaging of original shuttle, shelter and resource icons."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw
out=Path('public/assets/base');out.mkdir(parents=True,exist_ok=True)
if len(sys.argv)>1:
 art=Image.open(sys.argv[1]).convert('RGBA');art.thumbnail((640,480),Image.Resampling.LANCZOS);art.save(out/'landing-shuttle.png',optimize=True)
if len(sys.argv)>2:
 art=Image.open(sys.argv[2]).convert('RGBA');art.thumbnail((256,256),Image.Resampling.LANCZOS);art.save(out/'field-shelter.png',optimize=True)
# Original civilian NPCs and atlas: scripts/prepare-expedition-visuals.py
for tier in [1,2,3]:
 # Resource drops remain minerals/materials; equipment uses its own miniatures.
 art=Image.open('public/assets/visual/environment/mineral-growth.png').convert('RGBA');art=art.crop(art.getbbox());art.thumbnail((32,32))
 canvas=Image.new('RGBA',(48,48));canvas.alpha_composite(art,(8,8));d=ImageDraw.Draw(canvas);d.ellipse((28,29,44,45),fill='#b9a371',outline='#ead49a',width=2);canvas.save(out/f'resource-{tier}.png',optimize=True)
