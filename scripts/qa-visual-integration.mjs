import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5185',phase=process.env.QA_PHASE??'after',out=process.env.QA_OUT??`docs/visual-integration/qa/${phase}`;
await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile('docs/ice-transfer/qa/solo/loaded-fixture.json','utf8'));
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(90000);
const report={base,phase,at:new Date().toISOString(),method:'DEV inspection using the existing isolated Galerias loaded fixture. Earlier chapters/Warden/Soterrado and current cargo loading are staged explicitly; Vesper/Titan remain alive. DEV travel and positions only frame scenery. No real save is read or changed.',errors:[],scenes:[]};
page.on('pageerror',e=>report.errors.push(e.message));
await page.addInitScript(f=>{localStorage['echoes-of-dante.characters.v1']='visual-real-save';localStorage['echoes-of-dante.settings.v1']='visual-real-settings';const pre='dante-permanence-v1.icecave.warrior.';sessionStorage[pre+'local.echoes-of-dante.characters.v1']=JSON.stringify(f.profiles);sessionStorage[pre+'local.echoes-of-dante.journey.v1.character.'+f.profiles.selected]=JSON.stringify(f.journey);sessionStorage[pre+'arrived']='1';Element.prototype.requestFullscreen=undefined;},fixture);
async function ready(area){await page.waitForFunction(area=>{const s=window.__danteGame?.scene.keys.Game;return s?.missionUi&&!s.transitioning&&(!area||s.area===area);},area);for(let i=0;i<14;i++){const b=page.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();await page.waitForTimeout(100);}}
const stops=[['gallery','icecave',1020,1070],['collector','frost',940,1050],['base','base',740,830],['post','springs',1920,1080],['pipes','springs',1620,1040],['camp','terraces',1150,1100],['wind','arid',2550,795],['dunes','dunes',2060,1000]];
try{
 await page.goto(base+'/campaign-playtest.html?permanence=icecave');await ready();
 for(const[name,area,x,y]of stops){
  if(await page.evaluate(()=>window.__danteGame.scene.keys.Game.area)!==area){await page.evaluate(area=>window.__danteGame.scene.keys.Game.transitionArea(area),area);await ready(area);}
  await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x,y});s.player.invulnerableUntil=Infinity;},{x,y});
  await page.waitForTimeout(450);
  const snapshot=await page.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;return{area:s.area,bosses:{vesper:s.vesperDefeated,titan:s.titanDefeated},objects:s.children.list.filter(o=>o.getData?.('quest-prop')||/melt-pocket|water-return-pipe|prop-footing|survey-/.test(o.name??'')).map(o=>({name:o.name,kind:o.getData?.('quest-prop'),texture:o.texture?.key,x:o.x,y:o.y,width:o.displayWidth,height:o.displayHeight,alpha:o.alpha,visible:o.visible,depth:o.depth})),solids:s.arena.obstacles.map(o=>({...o})),credits:s.player.credits,receipts:s.missions.snapshot().receipts};});
  report.scenes.push({name,...snapshot});assert.equal(snapshot.bosses.vesper,false);assert.equal(snapshot.bosses.titan,false);
  for(const[width,height]of [[1280,720],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(350);await page.screenshot({path:`${out}/${name}-${width}.jpg`,type:'jpeg',quality:88});}
  await page.setViewportSize({width:1280,height:720});console.log('Captured',name);
 }
 assert.deepEqual(await page.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.settings.v1']]),['visual-real-save','visual-real-settings']);
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await page.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
