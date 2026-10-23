import assert from 'node:assert/strict';import{chromium}from'playwright';import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out='docs/world-finish/qa';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1366,height:768}}),report={method:'One foreground Chrome page, no parallel browser QA. Eight-second warmup per region, five seconds without screenshots; count actual scene UPDATE events and sample Phaser actualFps. Explicit invulnerability only; no rendering bypass.',regions:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{
 for(const area of ['base','forest','cavern','arid','frost','cinder']){
  await p.goto(base+'/world-finish-playtest.html?area='+area);await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.hud,{},{timeout:120000});await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity);await p.waitForTimeout(8000);
  assert.equal(await p.locator('dialog[open]').count(),0);assert.equal(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').scene.isPaused()),false);
  const result=await p.evaluate(async()=>{const s=window.__danteGame.scene.getScene('Game'),fps=[];let updates=0;const count=()=>updates++;s.events.on('update',count);const start=performance.now();for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,500));fps.push(window.__danteGame.loop.actualFps)}const ms=performance.now()-start;s.events.off('update',count);return{fpsSamples:fps,meanFps:fps.reduce((a,b)=>a+b,0)/fps.length,sceneUpdates:updates,elapsedMs:ms,sceneFps:updates/(ms/1000),objects:s.children.list.length,textures:Object.keys(s.textures.list).length,tweens:s.tweens.getTweens().length}});
  report.regions.push({area,...result});console.log(area+': '+result.meanFps.toFixed(1)+' FPS / '+result.sceneFps.toFixed(1)+' actual scene updates/s');
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/performance.json',JSON.stringify(report,null,2));}
