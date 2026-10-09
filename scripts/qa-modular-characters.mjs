import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/modular-characters/qa';await mkdir(out,{recursive:true});
const base=process.argv[2]??'http://localhost:5184/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless, real keyboard/mouse; DEV aim/position/reset arrangement. No physical hardware or human visual approval.',errors:[],cases:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720}});
 await context.addInitScript(()=>{localStorage.setItem('qa-preserved','unchanged');});
 const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});
 const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
 const state=()=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),p=s.player,w=s.hunterArt?.weapon;return {sex:p.sex,body:s.hunterArt?.body.texture.key??p.torso.texture.key,weapon:w?.rifle.texture.key??p.weapon.art?.texture.key,torso:(s.hunterArt?.torso??p.modularTorso).image.visible,position:{...p.position},phase:s.charge.phase,dash:p.isDashing,objects:s.children.list.length,tweens:s.tweens.getTweens().length,fps:window.__danteGame.loop.actualFps};});
 for(const c of ['warrior','hunter'])for(const sex of ['male','female']){
  await p.goto(`${base}character-playtest.html?class=${c}&sex=${sex}&kit=pilot`);await ready();await p.locator('.playtest-navigation').evaluate(e=>e.open=false);
  await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const e of s.enemies)e.update=()=>{};s.player.invulnerableUntil=Infinity;s.controls.aimFrom=()=>0;Object.assign(s.player.position,{x:900,y:800});});
  await p.waitForTimeout(300);const first=await state();assert.equal(first.sex,sex);assert.equal(first.weapon,`${c}-pilot-weapon`);assert.ok(first.torso);
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
   await p.evaluate(a=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>a,angle);await p.waitForTimeout(80);
   const rig=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),p=s.player;if(s.hunterArt)return {finite:Number.isFinite(s.hunterArt.weapon.rifle.rotation),aim:s.hunterArt.weapon.rifle.rotation};const w=p.weapon.view.getWorldTransformMatrix().transformPoint(p.weapon.supportGripX*p.weapon.view.scaleX,0),g=p.supportGlove.getWorldTransformMatrix().transformPoint(0,0);return{finite:true,error:Math.hypot(w.x-g.x,w.y-g.y)};});assert.ok(rig.finite);if(c==='hunter')assert.ok(Math.abs(Math.atan2(Math.sin(rig.aim-angle),Math.cos(rig.aim-angle)))<.001);else assert.ok(rig.error<.001);
  }
  await p.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>0);
  const before=(await state()).position;await p.keyboard.down('d');await p.waitForTimeout(320);await p.keyboard.up('d');assert.ok((await state()).position.x>before.x+5);
  await p.mouse.down();await p.waitForTimeout(120);await p.mouse.up();
  await p.keyboard.down('Space');await p.waitForTimeout(70);assert.ok((await state()).dash);await p.keyboard.up('Space');await p.waitForTimeout(350);
  await p.keyboard.down('q');await p.waitForTimeout(450);assert.equal((await state()).phase,'CHARGING');await p.keyboard.up('q');await p.waitForTimeout(500);
  await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.equipItem('armor');s.equipItem('weapon');});await p.waitForTimeout(100);assert.equal((await state()).torso,false);assert.ok(!(await state()).weapon.includes('pilot'));
  const stable=await state();for(let i=0;i<10;i++)await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.equipItem('armor','forest-armor');s.equipItem('weapon','forest-emitter');s.equipItem('armor');s.equipItem('weapon');});
  await p.waitForTimeout(300);assert.equal((await state()).objects,stable.objects);assert.equal((await state()).tweens,stable.tweens);
  await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.equipItem('armor','forest-armor');s.equipItem('weapon','forest-emitter');});
  await p.waitForTimeout(2000);report.cases.push({classId:c,...await state()});await p.screenshot({path:`${out}/${c}-${sex}.png`});
  assert.equal(await p.evaluate(()=>localStorage.getItem('qa-preserved')),'unchanged');assert.equal(await p.evaluate(()=>localStorage.getItem('echoes-of-dante.characters.v1')),null);
 }
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);assert.ok(await p.locator('#game canvas').isVisible());await p.locator('.playtest-navigation').evaluate(e=>e.open=true);assert.ok((await p.locator('.playtest-navigation').boundingBox()).width<width);await p.locator('.playtest-navigation').evaluate(e=>e.open=false);}
 await p.goto(base+'test-library.html');assert.equal(await p.locator('a.launch').count(),1);await p.locator('a.launch').click();await ready();
 report.saveIsolation=true;report.resolutions=true;report.libraryNavigation=true;
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
