import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/warden-revision-02/qa/layout';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(120000);const report={method:'Explicit paused slam pose for visual inspection at four viewports. No human visual approval.',errors:[],viewports:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 await p.goto(base+'/campaign-playtest.html?warden=1&v=0.1.150');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.warden);
 for(let i=0;i<12;i++){await p.waitForTimeout(200);const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await b.count())await b.click();else if(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').progression.upgradePointsAvailable===0))break;}
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:1070,y:735})});await p.waitForTimeout(700);
 await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden;s.scene.pause();b.introduced=true;b.beginAttack(s.time.now,'slam',s.player.position);b.render(s.time.now+700,0)});
 for(const[width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(350);const bounds=await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game'),b=s.warden.body.getBounds(),c=s.cameras.main;return{x:b.x-c.scrollX,y:b.y-c.scrollY,width:b.width,height:b.height,viewWidth:c.width,viewHeight:c.height}});assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=bounds.viewWidth&&bounds.y+bounds.height<=bounds.viewHeight,JSON.stringify(bounds));await p.screenshot({path:out+`/raised-${width}.png`});report.viewports.push({width,height,bounds});}
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/layout.json',JSON.stringify(report,null,2));}
