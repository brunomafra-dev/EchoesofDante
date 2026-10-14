import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/caster-motion-audit/visual';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={method:'Real keyboard/mouse movement, directional attacks and Q hold/release; recorded Chrome canvas, isolated saves. Reviewed screenshots, not physical/human playtest.',errors:[],cases:[],menu:[]};
const S=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','arg',code)(window.__danteGame.scene.getScene('Game'),arg),{code,arg});
try{
 for(const cls of ['astral','xenobinder']){
  const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  for(const sex of ['male','female']){
   await p.goto(`http://localhost:5184/${cls}-playtest.html?sex=${sex}&kit=initial&motion=1`);
   await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);
   await S(p,'s.enemies.forEach(e=>e.update=()=>{});s.player.invulnerableUntil=0;s.player.view.setAlpha(1);const b=s.movementBounds??{left:56,right:2544,top:56,bottom:1644};let point;for(let y=b.top+160;y<b.bottom-160&&!point;y+=80)for(let x=b.left+160;x<b.right-420&&!point;x+=80){if(s.arena.obstacles.every(o=>Math.hypot(o.x-Math.max(x,Math.min(x+270,o.x)),o.y-y)>o.radius+s.player.radius+15))point={x,y};}if(!point)throw Error("No open segment");Object.assign(s.player.position,point)');
   await p.waitForTimeout(250);
   await p.mouse.move(1100,370);await p.keyboard.down('d');
   for(let i=0;i<4;i++){await p.waitForTimeout(130);const clip=await S(p,'const c=s.cameras.main,b=document.querySelector("canvas").getBoundingClientRect(),k=b.width/1280;return {x:b.x+(s.player.position.x-c.scrollX-90)*k,y:b.y+(s.player.position.y-c.scrollY-110)*k,width:180*k,height:180*k}');await p.screenshot({path:`${out}/${cls}-${sex}-walk-${i}.png`,clip});}
   await p.keyboard.up('d');await p.keyboard.down('a');await p.mouse.down();await p.waitForTimeout(500);await p.mouse.up();await p.keyboard.up('a');
   await p.mouse.move(620,100);await p.keyboard.down('s');await p.waitForTimeout(400);await p.keyboard.up('s');
   await p.keyboard.down('q');await p.waitForTimeout(180);await p.mouse.move(230,400);await p.waitForTimeout(150);await p.mouse.move(800,550);await p.waitForTimeout(200);await p.keyboard.up('q');await p.waitForTimeout(500);
   await p.keyboard.down('d');await p.keyboard.press('Space');await p.waitForTimeout(280);await p.keyboard.up('d');
   assert.equal(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);
   report.cases.push({cls,sex,recorded:true});
  }
  const video=p.video();await context.close();await video.saveAs(`${out}/${cls}-motion.webm`);
 }
 const p=await browser.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://localhost:5184/');
 await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);
 await p.locator('[data-shell="characters"]').click();await p.locator('[data-shell="new-character"]').click();
 for(const cls of ['astral','xenobinder'])for(const sex of ['male','female']){
  await p.locator(`[data-class="${cls}"]`).click();await p.locator('[name="character-sex"]').selectOption(sex);await p.waitForTimeout(700);
  assert.ok(!await p.locator(`[data-class="${cls}"] .showcase-caption`).innerText().then(v=>v.includes('INDISPONÍVEL')));
  await p.locator('[data-shell="replay"]').click();await p.waitForTimeout(600);await p.screenshot({path:`${out}/menu-${cls}-${sex}.png`});
  report.menu.push({cls,sex,ready:true});
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log(report);
