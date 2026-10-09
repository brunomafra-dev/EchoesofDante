import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/modular-characters/revision-03/qa';await mkdir(out,{recursive:true});
const base=process.argv[2]??'http://localhost:5184/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Chrome headless; real keyboard/mouse, source-pixel checks during abilities, emulation only. Human visual approval pending.',errors:[],cases:[]};
try{
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out+'/video',size:{width:1280,height:720}}});
 await context.addInitScript(()=>localStorage.setItem('qa-preserved','yes'));
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
 const ready=()=>page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
 const arrange=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=0;for(const e of s.enemies)e.update=()=>{};s.controls.aimFrom=()=>Math.PI/2;});
 const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.hunterArt?.body??s.player.torso,t=s.hunterArt?.torso??s.player.modularTorso;return {body:b.texture.key,frame:b.frame.name,look:t.look,width:b.displayWidth,height:b.displayHeight,bakes:t.bakeCount,overlayChildren:t.image.list.length,textureCount:Object.keys(s.textures.list).length,dressedTextures:Object.keys(s.textures.list).filter(k=>k.startsWith('dressed-')).length,phase:s.charge.phase,objects:s.children.list.length,tweens:s.tweens.getTweens().length,fps:window.__danteGame.loop.actualFps,position:{...s.player.position}};});
 for(const cls of ['hunter','warrior'])for(const sex of ['male','female']){
  await page.goto(`${base}character-playtest.html?class=${cls}&sex=${sex}&kit=basic&weapon=current`);await ready();await arrange();await page.locator('.playtest-navigation').evaluate(e=>e.open=false);
  for(const style of ['none','basic','reinforced']){
   for(const part of ['helmet','torso','legs','boots','gloves'])await page.selectOption(`select[data-part="${part}"]`,style,{force:true});
   await page.waitForTimeout(120);const st=await state();assert.equal(st.overlayChildren,0);assert.equal(st.width,128);assert.equal(st.height,128);assert.ok(st.body.startsWith(`dressed-${cls}-${sex}`));
   assert.ok(await page.evaluate(({cls,sex,style})=>{
    const s=window.__danteGame.scene.getScene('Game'),b=s.hunterArt?.body??s.player.torso;
    const src=document.createElement('canvas');src.width=1024;src.height=768;const ctx=src.getContext('2d');ctx.drawImage(s.textures.get(`wardrobe-${cls}-${sex}-${style}`).getSourceImage(),0,0);
    const f=Number(b.frame.name),row=cls==='hunter'?Math.floor(f/4):b.texture.key.endsWith('front')?0:b.texture.key.endsWith('back')?1:2;
    const a=ctx.getImageData(f%4*256,row*256,256,256).data,other=b.texture.context.getImageData(f%4*256,cls==='hunter'?Math.floor(f/4)*256:0,256,256).data;
    for(let i=0;i<a.length;i++)if(Math.abs(a[i]-other[i])>1)return false;return true;
   },{cls,sex,style}),'Full kit must equal an intact dressed painting, not overlays');
   await page.screenshot({path:`${out}/${cls}-${sex}-${style}.png`});
  }
  for(const weapon of ['starter','current','advanced']){
   await page.selectOption('select[data-weapon]',weapon,{force:true});
   for(const angle of [0,Math.PI/4,Math.PI/2,Math.PI*3/4,Math.PI,-Math.PI*3/4,-Math.PI/2,-Math.PI/4]){
    await page.evaluate(a=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>a,angle);await page.waitForTimeout(50);
    const rig=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),p=s.player;if(s.hunterArt){const w=s.hunterArt.weapon;return{key:w.rifle.texture.key,angle:w.rifle.rotation,flip:w.rifle.flipX,foreHeight:w.sleeves[1].displayHeight,frame:w.sleeves[1].frame.name};}const w=p.weapon.view.getWorldTransformMatrix().transformPoint(p.weapon.supportGripX*p.weapon.view.scaleX,0),g=p.supportGlove.getWorldTransformMatrix().transformPoint(0,0);return{key:p.weapon.art.texture.key,error:Math.hypot(w.x-g.x,w.y-g.y),foreHeight:p.saberArm.displayHeight,frame:p.saberArm.frame.name};});
    assert.ok(rig.frame.startsWith('anatomy-'));assert.ok(rig.foreHeight>=10);if(cls==='hunter'){assert.ok(Math.abs(Math.atan2(Math.sin(rig.angle-angle),Math.cos(rig.angle-angle)))<.001);if(weapon!=='current')assert.equal(rig.flip,false);}else assert.ok(rig.error<.001);
    assert.ok(weapon==='starter'?rig.key.includes('starter'):weapon==='advanced'?rig.key.includes('pilot'):!rig.key.includes('starter')&&!rig.key.includes('pilot'));
   }
  }
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.controls.aimFrom=()=>Math.PI/2;s.audit=[];s.auditListener=()=>{const b=s.hunterArt?.body??s.player.torso;s.audit.push({key:b.texture.key,phase:s.charge.phase,width:b.displayWidth,height:b.displayHeight,frame:b.frame.name})};s.events.on('postupdate',s.auditListener);});
  const before=await state();await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.ok((await state()).position.x>before.position.x);
  await page.mouse.click(700,400);await page.waitForTimeout(500);await page.keyboard.down('q');await page.waitForTimeout(900);assert.equal((await state()).phase,'CHARGING');await page.screenshot({path:`${out}/${cls}-${sex}-charging.png`});await page.keyboard.up('q');await page.waitForTimeout(900);
  await page.keyboard.press('Space');await page.waitForTimeout(500);
  const frames=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.events.off('postupdate',s.auditListener);return s.audit;});assert.ok(frames.some(f=>f.phase==='CHARGING'));assert.ok(frames.every(f=>f.key.startsWith(`dressed-${cls}-${sex}`)&&f.width===128&&f.height===128));assert.equal((await state()).bakes,before.bakes);
  const stable=await state();for(let i=0;i<30;i++)await page.evaluate(i=>{const s=window.__danteGame.scene.getScene('Game'),v=i%2?'reinforced':'basic';s.setPlaytestAppearance({helmet:v,torso:v,legs:v,boots:v,gloves:v});},i);assert.equal((await state()).dressedTextures,stable.dressedTextures);assert.equal((await state()).objects,stable.objects);
  await page.waitForTimeout(1200);report.cases.push({classId:cls,sex,abilityFrames:frames.length,...await state()});
  // Exercise teardown/recreation, not just visual toggles: no dynamic texture leaks.
  for(let cycle=0;cycle<3;cycle++){await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await page.waitForTimeout(200);await ready();await arrange();await page.waitForTimeout(300);assert.equal((await state()).dressedTextures,stable.dressedTextures);}
  assert.equal(await page.evaluate(()=>localStorage.getItem('qa-preserved')),'yes');assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.characters.v1')),null);
 }
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(80);assert.ok(await page.locator('#game canvas').isVisible());}
 assert.deepEqual(report.errors,[]);report.passed=true;await context.close();
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
