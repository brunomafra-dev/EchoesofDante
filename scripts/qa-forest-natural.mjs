import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/forest-finish/revision-05/qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1366,height:768}});
const report={method:'Chrome: actual walking/E, explicit DEV placement, controlled scene-time contact/settling samples, restart/resource checks and reduced-motion emulation. No physical-device claim.',checks:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
const ready=async()=>{await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.hud&&!document.querySelector('#loading:not([hidden])'),{},{timeout:120000});await page.waitForTimeout(200)};
const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),l=s.arena.life;return{objects:s.children.list.length,textures:Object.keys(s.textures.list).length,shutdown:s.events.listenerCount('shutdown'),resize:s.scale.listenerCount('resize'),leaves:l.leaves.filter(p=>p.image.visible).length,leafPool:l.leaves.length,tracked:l.previous.size,plants:l.plants.map(p=>({x:p.x,y:p.y,bend:p.bend,angle:p.image.angle,touching:p.touching})),uv:[l.water.tilePositionX,l.water.tilePositionY],position:{...s.player.position}}});
const position=async(x,y)=>{await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.getScene('Game');s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,{x,y})},{x,y});await page.waitForTimeout(180)};
try{
 await page.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','natural-real-save-sentinel'));
 await page.goto(base+'/forest-finish.html?v=0.1.138');await ready();
 for(const[x,y]of [[885,475],[2050,320]]){
  await position(x,y);
  const before=(await state()).objects;
  assert.equal(await page.evaluate(()=>window.__danteGame.scene.getScene('Game').controls.touch.interactAvailable),false);
  await page.keyboard.press('e',{delay:120});await page.waitForTimeout(200);
  assert.equal((await state()).objects,before);
  assert.equal(await page.evaluate(()=>!!window.__danteGame.scene.getScene('Game').children.getByName('finish-signal-response')),false);
 }
 report.checks.push('Former water/mineral hotspots have no E/touch/gamepad interaction, prompt or signal response');
 const motion=await page.evaluate(()=>{
  const s=window.__danteGame.scene.getScene('Game'),life=s.arena.life,plant=life.plants[0];s.scene.pause();
  const anchor=[plant.image.x,plant.image.y],actor={position:{x:1100,y:850},isDead:false};let time=s.time.now;
  const run=(count,actors=[])=>{for(let i=0;i<count;i++)life.update(time+=1000/60,actor,actors)};
  run(180);const calm=plant.image.angle,uv=[life.water.tilePositionX,life.water.tilePositionY];run(70);const wind=plant.image.angle;
  actor.position={x:plant.x-20,y:plant.y-39};run(25);const contact=plant.bend;
  actor.position={x:1100,y:850};run(180);const settled=plant.bend;
  const creature={position:{x:plant.x+20,y:plant.y-18},isDead:false};run(25,[creature]);const creatureBend=plant.bend;
  run(180);const tracked=life.previous.size;
  const result={anchor,after:[plant.image.x,plant.image.y],calm,wind,contact,settled,creatureBend,tracked,uvChanged:uv[0]!==life.water.tilePositionX||uv[1]!==life.water.tilePositionY};
  s.scene.resume();return result;
 });
 assert.deepEqual(motion.anchor,motion.after);assert.ok(Math.abs(motion.wind-motion.calm)>.05);assert.ok(Math.abs(motion.contact)>1);assert.ok(Math.abs(motion.settled)<.1);assert.ok(motion.creatureBend< -1);assert.equal(motion.tracked,1);assert.ok(motion.uvChanged);report.motion=motion;
 report.checks.push('Gentle wind moves leaves, contact bends plants around fixed roots, damping settles after departure; creatures also cause contact');
 const plant=(await state()).plants[0];await position(plant.x-55,plant.y-39);
 await page.locator('canvas').focus();await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');
 assert.ok((await state()).leaves>0);assert.equal((await state()).leafPool,6);await page.screenshot({path:out+'/brushing.png'});
 await position(1060,840);await page.waitForTimeout(850);assert.equal((await state()).leaves,0);
 await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.equal((await state()).leaves,0);
 report.checks.push('Actual walking through vegetation releases bounded leaves; they expire and open trail does not emit leaves');
 const stable=[];
 for(let i=0;i<3;i++){await page.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.restart());await ready();const snapshot=await state();stable.push(Object.fromEntries(['objects','textures','shutdown','resize'].map(k=>[k,snapshot[k]])));assert.deepEqual(await page.evaluate(()=>{const f=window.__danteGame.scene.getScene('Game').children.getByName('finish-continuous-ground').frame;return[f.name,f.cutWidth,f.cutHeight]}),['__BASE',1536,1024]);}
 assert.deepEqual(stable[0],stable[1]);assert.deepEqual(stable[1],stable[2]);report.stability=stable;
 report.checks.push('Three restarts retain full floor frame and stable objects/textures/listeners');
 for(const[width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(180);await page.screenshot({path:out+'/layout-'+width+'.png'});}
 await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(1000);const fps=[];for(let i=0;i<10;i++){await page.waitForTimeout(200);fps.push(await page.evaluate(()=>window.__danteGame.loop.actualFps));}report.fps=fps.reduce((a,b)=>a+b,0)/fps.length;
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await ready();const still=(await state()).uv;
 await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');assert.deepEqual((await state()).uv,still);assert.ok((await state()).plants.every(p=>p.angle===0));assert.equal((await state()).leaves,0);
 report.checks.push('Reduced-motion preference freezes wind/UV and removes airborne leaves');
 assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'natural-real-save-sentinel');assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
}catch(e){report.failure=String(e);await page.screenshot({path:out+'/failure.png'});throw e;}finally{await browser.close();await writeFile(out+'/natural.json',JSON.stringify(report,null,2));}
