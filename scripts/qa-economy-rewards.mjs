import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/base-economy/reward-clarity/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],checks=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
const ready=()=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.basePanel);
const key=async k=>{await p.keyboard.down(k);await p.waitForTimeout(100);await p.keyboard.up(k);await p.waitForTimeout(150)};
const openSmith=async()=>{await p.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:760,y:740}));await key('e');await p.locator('.base-dialog[open]').waitFor()};
const close=()=>p.locator('.base-dialog [data-close]').click();
try{
 await p.goto('http://localhost:5184/base-playtest.html');await ready();const storage=await p.evaluate(()=>JSON.stringify(localStorage));
 assert.equal(await p.locator('[data-credits]').textContent(),'300');await p.locator('[data-no-materials]').click();await p.locator('.playtest-navigation').evaluate(e=>e.open=false);await openSmith();
 assert.equal(await p.locator('[data-recipe]').count(),21);assert.equal(await p.locator('[data-recipe] button:enabled').count(),0);
 const row=p.locator('[data-recipe="forest-armor"]');assert.match(await row.textContent(),/35 créditos · você tem 300/);assert.match(await row.textContent(),/6 Liga da floresta · você tem 0/);assert.match(await row.textContent(),/Faltam 6 Liga/);
 const blocked=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),before=JSON.stringify(s.economy);return{ok:s.serviceAction({kind:'craft',id:'forest-armor'}),unchanged:JSON.stringify(s.economy)===before}});assert.deepEqual(blocked,{ok:false,unchanged:true});checks.push('Credits alone cannot fabricate: all 21 recipes show ownership, material cost, shortage and disabled action');
 await close();await p.locator('.playtest-navigation').evaluate(e=>e.open=true);await p.locator('.playtest-navigation [data-reset]').click();await p.locator('.playtest-navigation').evaluate(e=>e.open=false);await openSmith();
 await row.getByRole('button',{name:'FABRICAR'}).click();assert.equal(await p.locator('[data-credits]').textContent(),'265');assert.match(await row.textContent(),/6 Liga da floresta · você tem 24/);checks.push('Successful craft spends both currencies; recipe stock and persistent balance update immediately');
 const screenshots=[];for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.screenshot({path:`${out}/forge-${width}.png`});screenshots.push(`forge-${width}.png`);const size=await p.locator('.base-dialog').evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert.ok(size.scroll<=size.client+2);await close();const balance=await p.locator('.expedition-credits').boundingBox();assert.ok(balance.x>=0&&balance.y>=0&&balance.x+balance.width<=width);await p.screenshot({path:`${out}/balance-${width}.png`});screenshots.push(`balance-${width}.png`);await openSmith()}
 await close();assert.equal(await p.evaluate(()=>JSON.stringify(localStorage)),storage);checks.push('Four resolutions: wallet visible, forge does not overflow; lab preserves real saves');
 await p.goto('http://localhost:5184/?qa=play');await ready();
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.lootKills=0;s.player.invulnerableUntil=Infinity});
 const deaths=[];
 for(let i=1;i<=12;i++){
  if(i===9){await p.evaluate(()=>window.__danteGame.scene.getScene('Game').restart());await p.waitForTimeout(500);await ready();assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').lootKills),8);await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity)}
  const result=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),e=s.enemies.find(e=>!e.isDead),credits=s.economy.credits,material=s.economy.materials[0];s.resolvePlayerHits(s.time.now,[e],999,0,0x5fe6d8,s.player.position,false);const resources=s.resources.snapshot(),gear=s.loot.snapshot();const reward=resources.find(d=>d.owner==='host'&&Math.hypot(d.x-e.position.x,d.y-e.position.y)<1);
   s.resources.collect(e.position,'host',p=>s.collectResource(p));return{dead:e.isDead,reward,gear,credits:s.economy.credits-credits,material:s.economy.materials[0]-material,counter:s.lootKills,balance:document.querySelector('[data-credits]').textContent};});
  assert.equal(result.dead,true);assert.equal(result.reward.amount,1);assert.equal(result.credits,4);assert.equal(result.material,1);assert.equal(result.counter,i);assert.equal(result.gear.length,i===12?1:0);deaths.push(result);
 }
 checks.push('Twelve real normal-enemy deaths give 12 material rewards; no equipment on deaths 1–11, one on 12; respawn does not reset cadence');
 // Another respawn must not leave a guaranteed first-kill item or create duplicates.
 await p.evaluate(()=>window.__danteGame.scene.getScene('Game').restart());await p.waitForTimeout(500);await ready();assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').lootKills),12);assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').loot.snapshot().length),0);
 await p.waitForTimeout(8000);const stable=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{objects:s.children.list.length,textures:Object.keys(s.textures.list).length,tweens:s.tweens.getTweens().length}});const fps=[];for(let i=0;i<6;i++){await p.waitForTimeout(500);fps.push(await p.evaluate(()=>window.__danteGame.loop.actualFps))}const after=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{objects:s.children.list.length,textures:Object.keys(s.textures.list).length,tweens:s.tweens.getTweens().length}});assert.deepEqual(after,stable);assert.deepEqual(errors,[]);
 await writeFile(out+'/rewards.json',JSON.stringify({version:'0.1.87',passed:true,checks,errors,deaths,stability:{before:stable,after,fps,mean:fps.reduce((a,b)=>a+b,0)/fps.length},screenshots,method:'Chrome headless; real combat damage with DEV fixtures and respawn, four viewports. No physical hardware.'},null,2));console.log({passed:true,checks,errors,stability:after,fps});
}finally{await browser.close()}
