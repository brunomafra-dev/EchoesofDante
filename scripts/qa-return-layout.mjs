import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/base-economy/expedition-return/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[],screens=[];
const visible=async button=>{const data=await button.evaluate(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{ok:b.contains(hit),label:b.textContent,rect:r.toJSON(),hit:hit?.className,viewport:[innerWidth,innerHeight]}});assert.ok(data.ok,JSON.stringify(data))};
const arrived=(p,area)=>p.waitForFunction(area=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area===area&&!s.transitioning&&s.player?.view.active&&s.sys.isActive()},area);
try{
 const context=await browser.newContext({hasTouch:true}),p=await context.newPage();p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5184/base-playtest.html?test=return');await arrived(p,'forest');await p.locator('.playtest-navigation').evaluate(e=>e.open=false);
 for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080},{width:844,height:390}]){
  await p.setViewportSize(viewport);await p.locator('[data-map]').tap();await p.waitForTimeout(120);await visible(p.locator('[data-return-base]'));await visible(p.locator('.atlas-node[aria-current]'));
  await p.screenshot({path:`${out}/return-${viewport.width}.png`});await p.locator('[data-return-base]').tap();await arrived(p,'base');
  await p.locator('[data-map]').tap();await p.waitForTimeout(120);await visible(p.locator('[data-resume-expedition]'));await visible(p.locator('.atlas-node[aria-current]'));
  await p.screenshot({path:`${out}/resume-${viewport.width}.png`});await p.locator('[data-resume-expedition]').tap();await arrived(p,'forest');screens.push(viewport);
 }
 await p.locator('[data-map]').tap();await p.locator('[data-return-base]').tap();await arrived(p,'base');await p.waitForTimeout(2000);
 const performance=await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),sample=()=>({objects:s.children.list.length,textures:Object.keys(s.textures.list).length,tweens:s.tweens.getTweens().length});const before=sample(),fps=[];for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,500));fps.push(s.game.loop.actualFps)}return{before,after:sample(),meanFps:fps.reduce((a,b)=>a+b,0)/fps.length}});
 assert.deepEqual(performance.before,performance.after);assert.deepEqual(errors,[]);
 await writeFile(out+'/layout-performance.json',JSON.stringify({passed:true,screens,errors,performance,checks:['Explicit travel action and current map location remain visible without outer scrolling','DOM touch return/resume at all four resolutions','Ten-second isolated steady base sample'],method:'Chrome headless with emulated touch; no physical device.'},null,2));console.log({passed:true,screens,performance});
}finally{await browser.close()}
