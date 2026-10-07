import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out='docs/navigation-foundation/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}});
const report={errors:[],method:'Chrome headless, DEV area/positions; keyboard, touch emulation; no physical device'};
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
const state=()=>page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),n=s.navigation;return {area:s.area,target:n.target?.name,
  route:n.route,arrow:n.arrow.visible,objects:s.children.list.length,maps:document.querySelectorAll('.world-minimap').length,
  clear:n.route.every(p=>s.arena.obstacles.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>=o.radius+23))};});
try{
 await page.goto('http://localhost:5184/');await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.navigation?.route.length>0);
 const fresh=await state();assert.equal(fresh.maps,1);assert.ok(fresh.clear&&fresh.arrow);await page.screenshot({path:`${out}/forest.png`});
 await page.keyboard.press('m');assert.equal(await page.locator('.world-minimap button').getAttribute('aria-expanded'),'false');await page.keyboard.press('m');
 await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,s.navigation.target);});await page.waitForTimeout(400);assert.equal((await state()).arrow,false);
 await page.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),{JOURNEY_FLAGS}=await import('/src/systems/LocalJourney.ts');for(const f of JOURNEY_FLAGS)s[f]=true;
 s.progression.restore({xp:700,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[]});s.area='cavern';s.scene.restart();});await page.waitForTimeout(500);
 for(const area of ['cavern','valley','arid','dunes','sandpit']){
  await page.evaluate(area=>{const s=window.__danteGame.scene.getScene('Game');s.area=area;s.scene.restart();},area);await page.waitForTimeout(550);
  assert.equal((await state()).maps,1);assert.ok((await state()).clear);assert.ok((await state()).route.length>0,area);report[area]={target:(await state()).target,routePoints:(await state()).route.length};
 }
 await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.area='forest';s.scene.restart();});await page.waitForTimeout(600);
 report.resolutions=[];
 for(const[width,height]of[[1280,720],[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(250);const b=await page.locator('.world-minimap').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height);report.resolutions.push(`${width}x${height}`);}
 const before=(await state()).objects;await page.waitForTimeout(2500);assert.equal((await state()).objects,before);
 report.fps=await page.evaluate(()=>window.__danteGame.loop.actualFps);report.stableObjects=before;
 const mobile=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),m=await mobile.newPage();await m.goto('http://localhost:5184/');await m.waitForFunction(()=>document.querySelector('.world-minimap'));
 await m.locator('.world-minimap button').tap();assert.equal(await m.locator('.world-minimap button').getAttribute('aria-expanded'),'false');await m.locator('.world-minimap button').tap();await m.screenshot({path:`${out}/touch.png`});report.touchToggle=true;await mobile.close();
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();}console.log(report);
