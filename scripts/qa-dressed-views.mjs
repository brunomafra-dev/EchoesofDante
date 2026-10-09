import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/modular-characters/revision-03/qa/views';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1280,height:720}});
const report={errors:[],cases:[],method:'Chrome headless, five captured directions, mixed outfit, actual charge input. Captures without artificial invulnerability blinking.'};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 for(const cls of ['hunter','warrior'])for(const sex of ['female','male']){
  await page.goto(`http://localhost:5184/character-playtest.html?class=${cls}&sex=${sex}&kit=reinforced&weapon=advanced`);
  await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
  await page.locator('.playtest-navigation').evaluate(e=>e.open=false);
  await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const e of s.enemies)e.update=()=>{};s.player.invulnerableUntil=0;});
  for(const [name,angle]of [['front',Math.PI/2],['back',-Math.PI/2],['right',0],['left',Math.PI],['diagonal',Math.PI/4]]){
   await page.evaluate(a=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>a,angle);await page.waitForTimeout(100);
   const clip=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),cam=s.cameras.main,p=s.player.position,b=document.querySelector('#game canvas').getBoundingClientRect();const scale=b.width/1280;return {x:b.x+((p.x-cam.worldView.x)*cam.zoom-85)*scale,y:b.y+((p.y-cam.worldView.y)*cam.zoom-115)*scale,width:170*scale,height:175*scale};});
   await page.screenshot({path:`${out}/${cls}-${sex}-${name}.png`,clip});
  }
  // Armor-only matches the current persistent slot layout, with cloth elsewhere.
  for(const part of ['helmet','legs','boots','gloves'])await page.selectOption(`select[data-part="${part}"]`,'none',{force:true});
  await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.aimFrom=()=>0);await page.waitForTimeout(100);
  await page.screenshot({path:`${out}/${cls}-${sex}-mixed.png`});
  await page.keyboard.down('q');await page.waitForTimeout(450);
  const st=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),body=s.hunterArt?.body??s.player.torso,t=s.hunterArt?.torso??s.player.modularTorso,w=s.hunterArt?.weapon;return {phase:s.charge.phase,key:body.texture.key,frame:body.frame.name,look:t.look,children:t.image.list.length,upper:w?.sleeves[0].texture.key??s.player.supportUpperArm.texture.key};});
  assert.equal(st.phase,'CHARGING');assert.equal(st.look.torso,'reinforced');assert.equal(st.upper,'reinforced-arm-kit');assert.equal(st.children,0);assert.ok(st.key.startsWith(`dressed-${cls}-${sex}`));
  await page.screenshot({path:`${out}/${cls}-${sex}-mixed-charge.png`});await page.keyboard.up('q');await page.waitForTimeout(700);
  report.cases.push({classId:cls,sex,...st});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log(report);
