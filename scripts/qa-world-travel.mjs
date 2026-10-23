import assert from 'node:assert/strict';import{chromium}from'playwright';import{mkdir,writeFile}from'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out='docs/world-finish/qa';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}}),report={method:'One persistent Phaser game, three complete cycles through 16 region constructors using explicit DEV area/restart fixtures. First cycle warms finite asset cache; next two compare objects, textures, listeners and tweens per area. Not a human campaign traversal.',cycles:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
const areas=['base','forest','cavern','warden','valley','springs','terraces','arid','dunes','sandpit','frost','icecave','icenest','cinder','obsidian','caldera'];
try{
 await p.goto(base+'/world-finish-playtest.html?area=base');await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.campaignEnvironment);
 for(let cycle=0;cycle<3;cycle++){
  const rows=[];
  for(const area of areas){await p.evaluate(area=>{const s=window.__danteGame.scene.getScene('Game');s.area=area;s.scene.restart()},area);await p.waitForFunction(area=>{const s=window.__danteGame?.scene.getScene('Game');return s?.campaignEnvironment?.area===area&&s.player?.view.active&&s.scene.isActive()},area,{timeout:120000});await p.waitForTimeout(350);await p.evaluate(()=>window.__danteGame.scene.getScene('Game').player.invulnerableUntil=Infinity);
   rows.push(await p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,objects:s.children.list.length,textures:Object.keys(s.textures.list).length,shutdown:s.events.listenerCount('shutdown'),resize:s.scale.listenerCount('resize'),tweens:s.tweens.getTweens().length,ground:s.children.list.filter(o=>o.name==='campaign-continuous-ground'&&o.visible).length}}));
  }
  report.cycles.push(rows);console.log('Persistent cycle '+cycle+' complete');
 }
 for(let i=0;i<areas.length;i++){assert.ok(report.cycles[2][i].ground>0);for(const key of ['objects','textures','shutdown','resize','tweens'])assert.equal(report.cycles[2][i][key],report.cycles[1][i][key],areas[i]+' '+key);}
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await b.close();await writeFile(out+'/travel.json',JSON.stringify(report,null,2));}
