import assert from'node:assert/strict';
import{chromium}from'playwright';
import{mkdir,writeFile}from'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/2d-refinement/qa/199/poses';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),report={passed:false,base,method:'Actual keyboard/mouse movement and firing; read-only compiled lab diagnostics. Cosmetic/gear/region fixtures are explicit URL options. No real save writes.',cases:[],errors:[]};
const p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
try{
 await p.addInitScript(()=>{localStorage.setItem('echoes-of-dante.characters.v1','pose-real-save');localStorage.setItem('echoes-of-dante.journey.v1','pose-real-journey');});
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female']){
  const head={warrior:'practical',hunter:'stellar',astral:'astral',xenobinder:'practical'}[cls],skin=sex==='female'?'deep':'warm',hair=sex==='female'?'silver':'copper';
  await p.goto(`${base}/character-cohesion.html?refinement=199&class=${cls}&sex=${sex}&kit=clothes&head=${head}&skin=${skin}&hair=${hair}&pet=symbiont`);
  await p.waitForFunction(()=>window.__dante2dReview?.().ready);await p.locator('.playtest-navigation').evaluate(el=>el.open=false);await p.waitForTimeout(300);
  const before=await p.evaluate(()=>window.__dante2dReview());assert.equal(before.actor.identity,cls);assert.equal(before.actor.width,128);assert.equal(before.actor.height,128);assert.equal(before.sources.inputs,3);
  await p.screenshot({path:`${out}/${cls}-${sex}-idle.jpg`,type:'jpeg',quality:88});
  await p.evaluate(()=>{window.motionStage='walk';window.motionSamples=[];window.motionSample=setInterval(()=>{const s=window.__dante2dReview();window.motionSamples.push({stage:window.motionStage,frame:Number(s.actor.frame),bakes:s.actor.bakes,x:s.position.x,y:s.position.y});},16);});
  await p.mouse.move(950,360);await p.keyboard.down('d');await p.waitForTimeout(1000);await p.screenshot({path:`${out}/${cls}-${sex}-walking.jpg`,type:'jpeg',quality:88});await p.evaluate(()=>{window.motionStage='fire';});await p.mouse.down();await p.waitForTimeout(500);await p.screenshot({path:`${out}/${cls}-${sex}-moving.jpg`,type:'jpeg',quality:88});await p.mouse.up();await p.keyboard.up('d');
  const result=await p.evaluate(()=>{clearInterval(window.motionSample);return{state:window.__dante2dReview(),samples:window.motionSamples};});
  assert.ok(result.samples.some(s=>Math.hypot(s.x-before.position.x,s.y-before.position.y)>20),cls+' native movement');assert.equal(result.state.actor.bakes,before.actor.bakes,'No rebake during movement/attacks');
  const walk=result.samples.filter(s=>s.stage==='walk'),walkFrames=[...new Set(walk.map(s=>s.frame))];assert.ok(walk.some((s,i)=>i>0&&Math.hypot(s.x-walk[i-1].x,s.y-walk[i-1].y)>.05),cls+' walking without attacking');assert.ok(walkFrames.length>=2,cls+' changing gait during movement');
  const frames=[...new Set(result.samples.map(s=>s.frame))];assert.ok(frames.length>=4,cls+' continuous gait');
  if(cls!=='warrior'){
   // Compare frames only while displacement is occurring. Position offset from
   // the starting point remains large after keys are released; those final
   // standing attack frames are valid and must not be called a running pose.
   const fire=result.samples.filter(s=>s.stage==='fire'),moving=fire.filter((s,i)=>i>0&&Math.hypot(s.x-fire[i-1].x,s.y-fire[i-1].y)>.05);
   assert.ok(moving.length>0,cls+' samples walking while firing');
   assert.ok(moving.every(s=>s.frame>=32||s.frame%4!==3),'Running fire must not alternate into wide standing action pose');
  }
  assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.journey.v1']]),['pose-real-save','pose-real-journey']);
  report.cases.push({classId:cls,sex,head,skin,hair,frames,sources:before.sources,final:result.state.position,bakes:result.state.actor.bakes});console.log('Poses',cls,sex,frames.length);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:88}).catch(()=>{});throw e;}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('2D poses',report.passed);}
