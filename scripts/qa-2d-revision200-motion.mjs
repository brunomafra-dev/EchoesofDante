import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const revision=process.env.QA_REVISION??'200';
const base=process.env.QA_BASE??'http://localhost:5186',out=process.env.QA_OUT??('docs/2d-refinement/qa/'+revision+'/motion');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),p=await browser.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(90000);
const report={passed:false,base,fixture:revision==='201'?'Native inputs with complete original figures; historical appearance query parameters must be ignored. Real campaign untouched.':'Native inputs in isolated character lab. Gear/appearance URLs are display fixtures only. Real campaign untouched.',cases:[],errors:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
try{
 await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='keep-real-motion';localStorage['echoes-of-dante.journey.v1']='keep-real-journey';});
 for(const cls of ['warrior','hunter','astral','xenobinder'])for(const sex of ['male','female'])for(const kit of cls==='warrior'?['clothes','basic','reinforced']:['clothes']){
  const id=cls+'-'+sex+'-'+kit,head=sex==='female'?'tied':'curly';
  await p.goto(base+'/character-playtest.html?refinement='+revision+'&class='+cls+'&sex='+sex+'&kit='+kit+'&head='+head+'&hair=copper&pet=symbiont');await p.waitForFunction(()=>window.__dante2dReview?.().ready);await p.locator('.playtest-navigation').evaluate(e=>e.open=false);await p.waitForTimeout(120);
  const before=await p.evaluate(()=>window.__dante2dReview());
  await p.evaluate(()=>{window.motionPhase='idle';window.motionSamples=[];window.motionTimer=setInterval(()=>{const s=window.__dante2dReview();window.motionSamples.push({phase:window.motionPhase,frame:s.actor.frame,width:s.actor.width,height:s.actor.height,bakes:s.actor.bakes,x:s.position.x,y:s.position.y});},16);});
  await p.screenshot({path:out+'/'+id+'-idle.jpg',type:'jpeg',quality:86});
  for(const [key,stage]of [['d','right'],['a','left']]){
   await p.evaluate(stage=>window.motionPhase=stage,stage);await p.keyboard.down(key);await p.waitForTimeout(900);await p.screenshot({path:out+'/'+id+'-'+stage+'.jpg',type:'jpeg',quality:86});await p.keyboard.up(key);
  }
  await p.mouse.move(940,350);await p.evaluate(()=>window.motionPhase='basic');await p.mouse.down();await p.waitForTimeout(420);await p.screenshot({path:out+'/'+id+'-basic.jpg',type:'jpeg',quality:86});await p.mouse.up();await p.waitForTimeout(400);
  await p.evaluate(()=>window.motionPhase='charge');await p.keyboard.down('q');await p.waitForTimeout(620);await p.screenshot({path:out+'/'+id+'-q.jpg',type:'jpeg',quality:86});await p.keyboard.up('q');await p.waitForTimeout(200);
  const samples=await p.evaluate(()=>{clearInterval(window.motionTimer);return window.motionSamples;});
  assert.ok(samples.every(s=>s.width===128&&s.height===128&&s.bakes===before.actor.bakes),'Actor scale and baked atlas remain fixed during walking/basic/Q');
  for(const stage of ['right','left']){const walk=samples.filter(s=>s.phase===stage),frames=[...new Set(walk.map(s=>s.frame))];assert.ok(frames.length>=2,id+' has changing '+stage+' walk frames');}
  if(cls==='warrior')for(const stage of ['right','left']){const walk=samples.filter(s=>s.phase===stage),frames=[...new Set(walk.map(s=>s.frame))];assert.ok(frames.length>=4,id+' uses four genuine lateral phases '+stage);}
  assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.journey.v1']]),['keep-real-motion','keep-real-journey']);
  report.cases.push({cls,sex,kit,head:revision==='201'?'original':head,bakes:before.actor.bakes,frames:Object.fromEntries(['right','left','basic','charge'].map(stage=>[stage,[...new Set(samples.filter(s=>s.phase===stage).map(s=>s.frame))]]))});console.log('200 poses',id);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e.stack??e);await p.screenshot({path:out+'/failure.jpg',type:'jpeg',quality:90}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');await browser.close();console.log('200 motion',report.passed);}
