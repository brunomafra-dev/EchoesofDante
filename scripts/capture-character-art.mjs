// Local authoring / comparison utility; requires locally available Playwright + Chrome.
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const base = process.argv[2] ?? 'http://localhost:5174/';
const stage = process.argv[3] ?? 'before';
const out = 'docs/character-art-pass';
await mkdir(`${out}/references`, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base);
  await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
  if (stage === 'before') {
    for (const name of ['warrior-body','warrior-body-back','warrior-body-side','warrior-boot','warrior-saber-arm','hollow-body','hollow-forelimbs','hollow-rear-limbs']) {
      const svg = await readFile(`public/assets/visual/${name}.svg`, 'utf8');
      const png = await page.evaluate(async svg => {
        const image = new Image(); image.src = 'data:image/svg+xml;base64,' + btoa(svg);
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width * 4; canvas.height = image.height * 4;
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        return canvas.toDataURL('image/png').split(',')[1];
      }, svg);
      await writeFile(`${out}/references/${name}.png`, Buffer.from(png,'base64'));
    }
  }
  await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.scene.restart(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const s=window.__danteGame.scene.getScene('Game');
    s.cameras.main.stopFollow().centerOn(1000,730);
    Object.assign(s.player.position,{x:1000,y:730});s.player.invulnerableUntil=0;
    s.enemies.forEach(e=>{e.update=()=>{};});
    Object.assign(s.enemies[0].position,{x:1130,y:730});
    s.enemies[0].view.setPosition(1130,730).setRotation(0);
    s.enemies[0].shadow.setPosition(1130,745);
  });
  for (const [name,dx,dy] of [['right',1,0],['down',0,1],['left',-1,0],['up',0,-1],['up-left',-1,-1],['up-right',1,-1],['down-left',-1,1],['down-right',1,1]]) {
    await page.mouse.move(640+dx*200,360+dy*200);await page.waitForTimeout(150);
    await page.screenshot({path:`${out}/${stage}-${name}.png`});
  }
  await writeFile(`${out}/${stage}-baseline.json`,JSON.stringify(await page.evaluate(()=>{
    const g=window.__danteGame,s=g.scene.getScene('Game');
    return {objects:s.children.list.length,textures:g.textures.getTextureKeys().length,tweens:s.tweens.getTweens().length,graphics:s.children.list.filter(o=>o.type==='Graphics').length,renderTextures:s.children.list.filter(o=>o.type==='RenderTexture').length,obstacles:s.arena.obstacles,bounds:s.movementBounds,fps:g.loop.actualFps};
  }),null,2)+'\n');
  console.log(`Saved ${stage} eight-direction comparisons and reference PNGs to ${out}`);
} finally {await browser.close();}
