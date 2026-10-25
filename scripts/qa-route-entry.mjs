import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out='docs/route-identity/embers/qa';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(90000);const report={method:'Chrome DEV; real section selector and E back portal, explicit position only to shorten walking.',errors:[],checks:[]};p.on('pageerror',e=>report.errors.push(e.message));
const ready=()=>p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.scene.isActive()&&s.hud&&!s.transitioning});
try{
 await p.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','entry-real-save-sentinel'));
 await p.goto(base+'/world-finish-playtest.html?area=caldera&trails=1');await ready();
 assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').calderaRelaySeen),false);
 await p.locator('.world-finish-lab').evaluate(e=>e.open=true);await p.locator('[name=spot]').selectOption('2');await ready();
 await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.calderaRelaySeen&&s.titan.state!=='DORMANT'});
 assert.ok(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return !s.titan.isDead&&!s.titanDefeated&&!s.progression.bossRewards.has('titan')}));
 report.checks.push('Default preview keeps relay unrecorded; selecting arena prepares only relay and begins a living boss, no victory/XP receipt');
 await p.goto(base+'/world-finish-playtest.html?area=caldera&trails=1');await ready();await p.evaluate(()=>Object.assign(window.__danteGame.scene.getScene('Game').player.position,{x:220,y:950}));await p.keyboard.press('e',{delay:180});
 await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.scene.isActive()&&s.area==='obsidian'&&!s.transitioning});
 const at=await p.evaluate(()=>({...window.__danteGame.scene.getScene('Game').player.position}));assert.ok(Math.hypot(at.x-380,at.y-980)<60);report.checks.push('Real back portal uses the destination entry, not the source preview position');
 assert.equal(await p.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'entry-real-save-sentinel');assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await b.close();await writeFile(out+'/entries.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
