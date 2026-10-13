import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/caldera/expansion/qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const p=await browser.newPage({viewport:{width:1280,height:720}});
const report={method:'Chrome keyboard interactions with DEV positioning fixtures; local route/return check, not a physical playtest.',errors:[],travel:[]};p.on('pageerror',e=>report.errors.push(e.message));
const S=code=>p.evaluate(code=>new Function('s',code)(window.__danteGame.scene.getScene('Game')),code);
async function travel(from,to,point){assert.equal(await S('return s.area'),from);await S(`s.player.invulnerableUntil=Infinity;Object.assign(s.player.position,${JSON.stringify(point)})`);await p.keyboard.down('e');await p.waitForTimeout(130);await p.keyboard.up('e');await p.waitForFunction(a=>window.__danteGame.scene.getScene('Game').area===a,to);await p.waitForTimeout(650);report.travel.push({from,to})}
try{
 await p.goto('http://localhost:5184/caldera-playtest.html?region=caldera&kit=advanced');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.basePanel);await p.locator('.threat-lab').evaluate(e=>e.open=false);await p.waitForTimeout(500);
 await travel('caldera','obsidian',{x:220,y:950});await travel('obsidian','cinder',{x:230,y:980});await travel('cinder','icenest',{x:230,y:980});assert.equal(await S('return s.glacier.onward.active'),true);
 await travel('icenest','cinder',{x:2070,y:1000});await travel('cinder','obsidian',{x:2810,y:980});await travel('obsidian','caldera',{x:2990,y:970});
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/return.json',JSON.stringify(report,null,2)+'\n');console.log(report)}
