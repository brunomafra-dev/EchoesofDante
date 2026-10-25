import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/embers-journey/qa/visibility';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1366,height:768}});p.setDefaultTimeout(60000);
const report={method:'DEV isolated lab. Combat disabled only for scenery inspection; real E from a nearby stand position. Screenshots require visual inspection, not automatic aesthetic approval.',errors:[],sites:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const area of ['cinder','obsidian','caldera']){
  await p.goto(base+'/campaign-playtest.html?embers=1&arrival='+area,{waitUntil:'domcontentloaded'});await p.waitForFunction(a=>{const s=window.__danteGame?.scene.getScene('Game');return s?.area===a&&s.regional?.sites.length===3&&!s.transitioning},area);await p.waitForTimeout(1100);
  for(let i=0;i<12;i++){const btn=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await btn.count())await btn.click();await p.waitForTimeout(200);if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break}
  const sites=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.spawnRegionalResidents=()=>{};s.renewSiroccoHabitats=()=>{};for(const e of s.enemies)if(e!==s.titan)e.die();s.enemies=s.titan?[s.titan]:[];s.player.invulnerableUntil=0;return s.regional.sites});
  for(const site of sites){const stand=await p.evaluate(async q=>{const s=window.__danteGame.scene.getScene('Game'),{safeExpeditionPosition}=await import('/src/systems/ExpeditionReturn.ts');const stand=safeExpeditionPosition({x:q.x,y:Math.min(q.y+55,s.movementBounds.bottom-24)},18,s.arena.obstacles,s.movementBounds);if(!stand)throw Error('No stand');Object.assign(s.player.position,stand);return stand},site);assert.ok(Math.hypot(stand.x-site.x,stand.y-site.y)<85);await p.waitForTimeout(1000);await p.keyboard.press('e',{delay:180});assert.ok(await p.evaluate(id=>window.__danteGame.scene.getScene('Game').missions.has(id),site.id));await p.screenshot({path:out+'/'+site.id+'.jpg',type:'jpeg',quality:87});report.sites.push({id:site.id,stand,evidence:true});}
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/visibility.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
