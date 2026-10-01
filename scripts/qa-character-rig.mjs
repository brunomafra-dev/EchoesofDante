// Local visual migration checks; Playwright + Chrome must already be available.
// DEV hooks arrange the scene; all actions below use real browser inputs.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5174/';
const out = 'docs/character-art-pass';
const before = JSON.parse(await readFile(`${out}/before-baseline.json`, 'utf8'));
const after = JSON.parse(await readFile(`${out}/after-baseline.json`, 'utf8'));
for (const key of ['objects','textures','tweens','graphics','renderTextures','obstacles','bounds']) {
  assert.deepEqual(after[key], before[key], key);
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const result = { method: 'Chrome headless, not physical playtest', errors, baselineCountsAndPhysicsUnchanged: true, aimDirections: [], walkingDirections: [] };
try {
  const page = await browser.newPage({ viewport: { width:1280, height:720 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if(r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(base);
  await page.waitForFunction(() => window.__danteGame?.scene.getScene('Game').player?.view?.active);
  await page.evaluate(() => { const s=window.__danteGame.scene.getScene('Game');s.area='cavern';s.scene.restart(); });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const s=window.__danteGame.scene.getScene('Game');
    Object.assign(s.player.position,{x:1000,y:730});s.player.invulnerableUntil=Infinity;
    s.cameras.main.stopFollow().centerOn(1000,730);
    s.enemies.forEach(e=>{e.qaUpdate=e.update;e.update=()=>{};});
    Object.assign(s.enemies[0].position,{x:1130,y:730});s.enemies[0].view.setPosition(1130,730);
  });

  async function rigCheck() {
    const data = await page.evaluate(() => {
      const p=window.__danteGame.scene.getScene('Game').player;
      const secondGrip=p.weapon.view.getWorldTransformMatrix().transformPoint(p.weapon.supportGripX,0);
      const glove=p.supportGlove.getWorldTransformMatrix().transformPoint(0,0);
      const primary=p.weapon.view.getWorldTransformMatrix().transformPoint(0,0);
      const anchor=p.handAnchor.getWorldTransformMatrix().transformPoint(0,0);
      return {
        primaryGripError:Math.hypot(primary.x-anchor.x,primary.y-anchor.y),
        supportGripError:Math.hypot(secondGrip.x-glove.x,secondGrip.y-glove.y),
        legsAngle:Math.atan2(Math.sin(p.view.rotation+p.legsRig.rotation),Math.cos(p.view.rotation+p.legsRig.rotation)),
        bodyAngle:Math.atan2(Math.sin(p.view.rotation+p.bodyRig.rotation),Math.cos(p.view.rotation+p.bodyRig.rotation)),
        hierarchy:p.weapon.view.parentContainer===p.handAnchor && p.handAnchor.parentContainer===p.bodyRig,
        finite:[p.leftLeg.x,p.leftLeg.y,p.rightLeg.x,p.rightLeg.y,p.handAnchor.x,p.handAnchor.y].every(Number.isFinite),
        state:p.animationState,
        torsoTexture:p.torso.texture.key,
      };
    });
    assert.ok(data.hierarchy && data.finite);
    assert.ok(data.primaryGripError < 0.001 && data.supportGripError < 0.001);
    assert.ok(Math.abs(data.legsAngle)<0.001 && Math.abs(data.bodyAngle)<0.16);
    return data;
  }
  async function stateCapture(name) {
    await page.evaluate(()=>window.__danteGame.loop.sleep());
    try { await rigCheck();await page.screenshot({path:`${out}/${name}.png`}); }
    finally {await page.evaluate(()=>window.__danteGame.loop.wake());}
  }
  for(const [name,dx,dy] of [['right',1,0],['down',0,1],['left',-1,0],['up',0,-1],['up-left',-1,-1],['up-right',1,-1],['down-left',-1,1],['down-right',1,1]]) {
    await page.mouse.move(640+200*dx,360+200*dy);await page.waitForTimeout(60);
    result.aimDirections.push({name,...await rigCheck()});
  }
  for(const key of ['w','a','s','d']) {
    await page.keyboard.down(key);
    await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.animationState==='WALK');
    await page.waitForTimeout(100);
    result.walkingDirections.push({key,...await rigCheck()});
    if(key==='d') await stateCapture('walking');
    await page.keyboard.up(key);await page.waitForTimeout(150);
  }
  await page.mouse.move(850,360);
  await page.mouse.down();
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.animationState==='ATTACK_SWING',{},{polling:'raf'});
  await stateCapture('attack-swing');await page.mouse.up();await page.waitForTimeout(450);
  await page.keyboard.down('q');await page.waitForTimeout(600);
  assert.equal((await rigCheck()).state,'CHARGE');await stateCapture('charge');
  await page.keyboard.up('q');await page.waitForTimeout(30);await stateCapture('charge-release');
  await page.waitForTimeout(450);
  await page.keyboard.down('Space');
  await page.waitForFunction(()=>window.__danteGame.scene.getScene('Game').player.animationState==='DASH');
  await stateCapture('dash');await page.keyboard.up('Space');
  await page.waitForTimeout(500);
  await page.evaluate(()=>{
    const s=window.__danteGame.scene.getScene('Game');
    Object.assign(s.enemies[0].position,{x:1140,y:730});s.enemies[0].update=s.enemies[0].qaUpdate;
  });
  const limbStart=await page.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies[0].forelimbs.rotation);
  await page.waitForTimeout(130);
  await stateCapture('hollow-chase');
  result.hollowMoving=await page.evaluate(()=>window.__danteGame.scene.getScene('Game').enemies[0].position.x<1140);
  assert.ok(result.hollowMoving);
  result.actionsCaptured=['walking','attack-swing','charge','charge-release','dash','hollow-chase'];
  result.hollowLimbAnimated=await page.evaluate(start=>window.__danteGame.scene.getScene('Game').enemies[0].forelimbs.rotation!==start,limbStart);
  assert.ok(result.hollowLimbAnimated);
  await page.waitForTimeout(8000);
  result.settledCavernFps=await page.evaluate(async()=>{
    const samples=[];
    for(let i=0;i<20;i++){await new Promise(resolve=>setTimeout(resolve,200));samples.push(window.__danteGame.loop.actualFps);}
    return {mean:samples.reduce((a,b)=>a+b,0)/samples.length,min:Math.min(...samples),max:Math.max(...samples)};
  });
  if(process.argv[3]) {
    await page.close();
    const production=await browser.newPage({viewport:{width:1280,height:720}});
    const assets=new Set();
    production.on('pageerror',e=>errors.push(e.message));
    production.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
    production.on('response',r=>{
      if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`);
      if(r.url().includes('/assets/visual/characters/') && r.status()===200) assets.add(new URL(r.url()).pathname.split('/').at(-1));
    });
    await production.goto(process.argv[3]);
    await production.locator('canvas').waitFor({state:'visible'});
    await production.waitForTimeout(2000);
    assert.equal(assets.size,8);
    assert.ok(await production.evaluate(()=>document.querySelector('canvas').width>0));
    await production.keyboard.down('d');await production.waitForTimeout(200);await production.keyboard.up('d');
    await production.mouse.click(850,360);
    await production.screenshot({path:`${out}/production.png`});
    result.production={url:process.argv[3],paintedAssetsLoaded:[...assets].sort(),canvasVisible:true};
    await production.close();
  }
  assert.equal(errors.length,0);
  await writeFile(`${out}/rig-checks.json`,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally {await browser.close();}
