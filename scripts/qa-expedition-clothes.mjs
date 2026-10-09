import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/modular-characters/revision-02/qa';await mkdir(out,{recursive:true});
const base=process.argv[2]??'http://localhost:5184/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={errors:[],cases:[],method:'Chrome emulation; no physical device or human approval.'};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720}});const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});
 await context.addInitScript(()=>localStorage.setItem('qa-preserved','yes'));
 for(const classId of ['warrior','hunter'])for(const sex of ['male','female']){
  await page.goto(`${base}character-playtest.html?class=${classId}&sex=${sex}&kit=clothes`);
  await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  await page.locator('.playtest-navigation').evaluate(e=>e.open=false);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.controls.aimFrom=()=>Math.PI/2;s.player.invulnerableUntil=Infinity;for(const e of s.enemies)e.update=()=>{};});
  const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),t=s.hunterArt?.torso??s.player.modularTorso;return {body:(s.hunterArt?.body??s.player.torso).texture.key,look:t.look,visible:Object.entries(t.layers).filter(([k,v])=>v.visible).map(([k])=>k),objects:s.children.list.length,tweens:s.tweens.getTweens().length,phase:s.charge.phase,dash:s.player.isDashing,fps:window.__danteGame.loop.actualFps,position:{...s.player.position}};});
  assert.ok((await state()).body.includes(`${classId}-${sex}-clothes`));assert.equal((await state()).visible.length,0);
  await page.waitForTimeout(600);await page.screenshot({path:`${out}/${classId}-${sex}-clothes.png`});
  for(const style of ['basic','reinforced']){
   for(const part of ['helmet','torso','legs','boots','gloves'])await page.selectOption(`select[data-part="${part}"]`,style,{force:true});
   await page.waitForTimeout(200);assert.equal((await state()).visible.length,4);
   for(const a of [0,Math.PI/2,Math.PI,-Math.PI/2]){await page.evaluate(a=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>a,a);await page.waitForTimeout(70);
    assert.ok(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.hunterArt?.body??s.player.torso,t=s.hunterArt?.torso??s.player.modularTorso;return Object.values(t.layers).every(l=>l.frame.name===b.frame.name&&l.flipX===b.flipX&&l.y===b.y);}));}
   await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>Math.PI/2);await page.waitForTimeout(80);await page.screenshot({path:`${out}/${classId}-${sex}-${style}.png`});
  }
  const before=await state();await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.ok((await state()).position.x>before.position.x);
  await page.mouse.click(750,300);await page.keyboard.down('Space');await page.waitForTimeout(60);assert.ok((await state()).dash);await page.keyboard.up('Space');await page.waitForTimeout(350);
  await page.keyboard.down('q');await page.waitForTimeout(350);assert.equal((await state()).phase,'CHARGING');await page.keyboard.up('q');await page.waitForTimeout(800);
  const stable=await state();for(let i=0;i<15;i++)await page.evaluate(i=>{const s=window.__danteGame.scene.getScene('Game'),v=i%2?'basic':'none';s.setPlaytestAppearance({helmet:v,torso:v,legs:v,boots:v,gloves:v});},i);
  await page.waitForTimeout(120);assert.equal((await state()).objects,stable.objects);assert.equal((await state()).tweens,stable.tweens);
  assert.equal(await page.evaluate(()=>localStorage.getItem('qa-preserved')),'yes');assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.characters.v1')),null);
  report.cases.push({classId,sex,...await state()});
 }
 for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);assert.ok(await page.locator('#game canvas').isVisible());await page.locator('.playtest-navigation').evaluate(e=>e.open=true);assert.ok((await page.locator('.playtest-navigation').boundingBox()).width<width);}
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
