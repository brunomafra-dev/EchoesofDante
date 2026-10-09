import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/modular-characters/shoulder-fix/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1280,height:720}});
const report={method:'Chrome headless, real keyboard/mouse; socket alpha, draw order, attack and charge sampling; no physical playtest.',errors:[],cases:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
const ready=()=>page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
const audit=()=>page.evaluate(()=>{
 const s=window.__danteGame.scene.getScene('Game'),body=s.hunterArt?.body??s.player.torso;
 const arms=s.hunterArt?[s.hunterArt.weapon.sleeves[0],s.hunterArt.weapon.sleeves[2]]:[s.player.paintedArms.mainUpper,s.player.supportUpperArm];
 const rig=s.hunterArt?s.player.view:s.player.bodyRig;
 return{key:body.texture.key,frame:body.frame.name,phase:s.charge.phase,attack:s.attack.pose(s.time.now,s.player.rotation).phase,
  roots:arms.map(a=>{const x=Math.round((a.x-body.x)/body.scaleX*(body.flipX?-1:1)+128),y=Math.round((a.y-body.y)/body.scaleY+128);
   return {x:a.x,y:a.y,alpha:body.texture.context.getImageData(body.frame.cutX+x,body.frame.cutY+y,1,1).data[3],above:rig.list.indexOf(a)>rig.list.indexOf(body),overlap:a.originX*a.displayWidth};}),
  objects:s.children.list.length,textures:Object.keys(s.textures.list).length,fps:window.__danteGame.loop.actualFps};
});
const capture=async(name)=>{
 const clip=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),c=s.cameras.main,p=s.player.position,b=document.querySelector('#game canvas').getBoundingClientRect(),k=b.width/1280;return{x:b.x+((p.x-c.worldView.x)*c.zoom-95)*k,y:b.y+((p.y-c.worldView.y)*c.zoom-120)*k,width:190*k,height:180*k};});
 await page.screenshot({path:`${out}/${name}.png`,clip});
};
try{
 for(const cls of ['hunter','warrior'])for(const sex of ['female','male']){
  await page.goto(`http://localhost:5184/character-playtest.html?class=${cls}&sex=${sex}&kit=clothes&weapon=starter`);await ready();
  await page.locator('.playtest-navigation').evaluate(e=>e.open=false);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const e of s.enemies)e.update=()=>{};s.player.invulnerableUntil=0;});
  const caseReport={classId:cls,sex,directions:[],abilitySamples:0};
  for(const [name,angle]of [['front',Math.PI/2],['back',-Math.PI/2],['right',0],['left',Math.PI],['diagonal',Math.PI/4],['nw',-Math.PI*3/4],['ne',-Math.PI/4],['sw',Math.PI*3/4]]){
   await page.evaluate(a=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>a,angle);await page.waitForTimeout(80);
   const st=await audit();const back=cls==='hunter'?Number(st.frame)>=4&&Number(st.frame)<8:st.key.endsWith('-back');assert.equal(st.roots[0].above,!back);assert.ok(st.roots.every(r=>r.alpha>150&&Math.abs(r.overlap-5)<.001),JSON.stringify(st));
   if(['front','back','right','left'].includes(name))await capture(`${cls}-${sex}-${name}-idle`);
   if(cls==='warrior'){
    await page.mouse.down();await page.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.attack.pose(s.time.now,s.player.rotation).phase==='SWING'});
    const swing=await audit();assert.ok(swing.roots.every(r=>r.alpha>150));caseReport.abilitySamples++;
    if(['front','back','right','left'].includes(name))await capture(`${cls}-${sex}-${name}-strike`);
    await page.mouse.up();await page.waitForTimeout(450);
   }
   caseReport.directions.push(st);
  }
  await page.keyboard.down('d');
  for(let i=0;i<12;i++){await page.waitForTimeout(40);const st=await audit();const back=cls==='hunter'?Number(st.frame)>=4&&Number(st.frame)<8:st.key.endsWith('-back');assert.equal(st.roots[0].above,!back);assert.ok(st.roots.every(r=>r.alpha>150));caseReport.abilitySamples++;}
  await page.keyboard.up('d');
  await page.keyboard.down('q');await page.waitForTimeout(500);const charge=await audit();assert.equal(charge.phase,'CHARGING');assert.ok(charge.roots.every(r=>r.alpha>150));await capture(`${cls}-${sex}-charge`);await page.keyboard.up('q');await page.waitForTimeout(800);
  // Dressing/undressing restores the approved armored draw order and origins.
  const before=await audit();
  for(let i=0;i<6;i++){
   await page.selectOption('select[data-part="torso"]','basic',{force:true});await page.waitForTimeout(30);
   const arms=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return (s.hunterArt?s.hunterArt.weapon.sleeves:[s.player.paintedArms.mainUpper,s.player.supportUpperArm]).map(a=>a.originX)});assert.ok(arms.every(x=>x===0));
   await page.selectOption('select[data-part="torso"]','none',{force:true});await page.waitForTimeout(30);assert.ok((await audit()).roots.every(r=>r.alpha>150));
  }
  const after=await audit();assert.equal(after.textures,before.textures);assert.equal(after.objects,before.objects);
  caseReport.fps=after.fps;report.cases.push(caseReport);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log({passed:report.passed,cases:report.cases.length,errors:report.errors});
