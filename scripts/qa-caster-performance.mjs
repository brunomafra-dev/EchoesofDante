import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/caster-motion-audit/performance';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}});
const report={method:'One Chrome page, paired same-build Warrior/Astral/Xenobinder region samples. Ten-second warm-up excludes asset-loading startup; Phaser smoothed FPS plus actual scene update count. Fixture invulnerability only for stable observation.',errors:[],samples:[]};
p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const region of['forest','cavern','caldera'])for(const cls of['warrior','astral','xenobinder']){
  await p.goto(`http://localhost:5184/xenobinder-playtest.html?region=${region}&class=${cls}&kit=advanced`);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.active);await p.locator('.threat-lab').evaluate(e=>e.open=false);
  for(let i=0;i<15;i++){const b=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)');if(!await b.count())break;await b.first().click();}
  await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity);await p.waitForTimeout(10000);
  const sample=await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),samples=[],counts=[];let frames=0;const count=()=>frames++;s.events.on('update',count);const start=performance.now();
   for(let i=0;i<12;i++){await new Promise(resolve=>setTimeout(resolve,250));samples.push(s.game.loop.actualFps);counts.push({objects:s.children.list.length,tweens:s.tweens.getTweens().length});}
   s.events.off('update',count);return{meanFps:samples.reduce((n,v)=>n+v,0)/samples.length,measuredFps:frames/((performance.now()-start)/1000),before:counts[0],after:counts.at(-1)};});
  report.samples.push({region,classId:cls,...sample});assert.equal(sample.before.objects,sample.after.objects);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
console.log(report);
