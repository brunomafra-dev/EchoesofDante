import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const out='docs/settlement-motion/qa/service-pacing',base=process.env.QA_BASE??'http://localhost:5185';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1366,height:768}});
const report={base,method:'Actual DEV scene clock over 32 seconds, stationary services, keyboard dialogue and isolated reload. Position fixtures only for inspecting the existing service anchors.',checks:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
async function ready(){await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.settlementLife,{},{timeout:120000});for(let i=0;i<15;i++){await page.waitForTimeout(140);const button=page.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await button.count())await button.click();else if(i>6)break;}}
try{
 await page.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='service-pacing-real-sentinel';localStorage['echoes-of-dante.settings.v1']='service-pacing-settings-sentinel'});
 await page.goto(base+'/campaign-playtest.html?settlement-motion=1&v=0.1.163');await ready();
 const trace=await page.evaluate(()=>new Promise(resolve=>{
  const rows=[],s=window.__danteGame.scene.getScene('Game'),start=s.time.now;
  Object.assign(s.player.position,{x:650,y:700});
  function sample(){rows.push({time:s.time.now,people:[...s.settlementLife.people.values()].map(p=>({id:p.definition.id,x:p.position.x,y:p.position.y,frame:p.frame,offset:p.motion.offset}))});if(s.time.now-start<32000)requestAnimationFrame(sample);else resolve(rows)}requestAnimationFrame(sample);
 }));
 const legacy=t=>{const frames=[0,1,2,5,3,4,3,5,1,0],holds=[470,210,260,120,90,100,120,160,210,380];let phase=t%2120;for(let i=0;i<holds.length;i++){if(phase<holds[i])return frames[i];phase-=holds[i]}};
 assert.ok(trace.every(row=>{const n=row.people.find(n=>n.id==='ivo');return n.frame===legacy(row.time+n.offset)}),'Ivo keeps every original frame at the original clock phase');
 report.checks.push('Ivo matches the approved 0.1.162 sequence and timing on every observed scene frame');
 report.timing={};
 for(const[id,period,minimum]of [['lia',10700,650],['nara',12750,800]]){
  const segments=[];for(const row of trace){const n=row.people.find(n=>n.id===id),last=segments.at(-1);assert.equal(n.x,trace[0].people.find(p=>p.id===id).x);assert.equal(n.y,trace[0].people.find(p=>p.id===id).y);if(!last||last.frame!==n.frame)segments.push({frame:n.frame,start:row.time});}
  const complete=segments.slice(1,-1).map((n,i)=>({...n,duration:segments[i+2].start-n.start}));
  assert.equal(new Set(segments.map(n=>n.frame)).size,6);assert.ok(complete.every(n=>n.duration>=minimum));
  const resets=segments.filter((n,i)=>i>0&&n.frame===0).map(n=>n.start);assert.ok(resets.length>=2);assert.ok(Math.abs(resets[1]-resets[0]-period)<60);
  report.timing[id]={cycleMs:resets[1]-resets[0],shortestCompletePoseMs:Math.min(...complete.map(n=>n.duration)),segments:complete};
 }
 report.checks.push('Lia and Nara complete their own slow routines without moving their service anchors or rapidly cycling poses');
 for(const[id,x,y]of [['lia',320,700],['nara',1000,465]]){
  await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x,y:y+65})},{x,y});await page.waitForTimeout(500);
  const seen=new Set();for(const deadline=Date.now()+18000;seen.size<6&&Date.now()<deadline;){const frame=await page.evaluate(id=>window.__danteGame.scene.getScene('Game').settlementLife.people.get(id).frame,id);if(!seen.has(frame)){await page.screenshot({path:`${out}/${id}-${frame}.jpg`,type:'jpeg',quality:85});seen.add(frame)}await page.waitForTimeout(120)}assert.equal(seen.size,6);
  await page.keyboard.press('e',{delay:100});await page.locator('.mission-dialog[open],.base-dialog[open]').first().waitFor();await page.screenshot({path:`${out}/${id}-service.jpg`,type:'jpeg',quality:85});await page.keyboard.press('Escape');
 }
 const fog=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();return s.exploration.snapshot()});await page.reload();await ready();
 assert.ok(await page.evaluate(before=>Object.entries(before).every(([a,cells])=>cells.every(c=>window.__danteGame.scene.getScene('Game').exploration.snapshot()[a]?.includes(c))),fog));
 assert.deepEqual(await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return[s.soterradoDefeated,s.vesperDefeated,s.titanDefeated]}),[false,false,false]);
 assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.characters.v1']),'service-pacing-real-sentinel');assert.equal(await page.evaluate(()=>localStorage['echoes-of-dante.settings.v1']),'service-pacing-settings-sentinel');
 report.checks.push('Actual E still opens Lia/Nara services; isolated reload preserves exploration and later living bosses, real-save/settings sentinels untouched');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error}
finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks:report.checks,failure:report.failure,timing:report.timing},null,2));}
