import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.argv[2]??'docs/caldera/expansion/qa/public';await mkdir(out,{recursive:true});
const origin=process.argv[3]??'https://echosofdante.vercel.app';
const report={at:new Date().toISOString(),method:'Published build in Chrome headless, real keyboard/mouse and four viewports; public WebSocket check only if matching relay is deployed. Not physical/human approval.',errors:[],checks:[]},assets=new Set();
const browser=await chromium.launch({channel:'chrome',headless:true});
const h=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
let g,world,joined=[];
function observe(p){p.setDefaultTimeout(65000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());if(/caldera-ground|titan-motion|caldera-journey|titan-journey|cinder-ground|obsidian-ground|ember-hound-motion|fumarole-motion|slagback-motion|cinder-journey|obsidian-journey/.test(r.url()))assets.add(new URL(r.url()).pathname)});p.on('websocket',ws=>ws.on('framereceived',e=>{try{const m=JSON.parse(String(e.payload));if(m.type==='joined')joined.push(m);if(p===g&&m.type==='world')world=m.world}catch{}}))}
observe(h);
async function load(classId,boss,region=boss?'caldera':'cinder'){await h.goto(`${origin}/caldera-playtest.html?class=${classId}&region=${region}&boss=${boss?1:0}&kit=basic&element=water&v=0.1.95`,{waitUntil:'domcontentloaded',timeout:90000});await h.locator('.threat-lab').waitFor();assert.ok((await h.locator('.threat-lab summary').textContent()).includes('CALDEIRA'));await h.locator('.expedition-credits').waitFor();await h.locator('.threat-lab').evaluate(e=>e.open=false);await h.waitForTimeout(700)}
try{
 for(const classId of ['warrior','hunter','astral']){
  await load(classId,true);await h.mouse.move(950,320);await h.keyboard.down('d');await h.waitForTimeout(330);await h.keyboard.up('d');await h.mouse.click(950,320);await h.keyboard.press('Space');await h.waitForTimeout(450);await h.keyboard.down('q');await h.waitForTimeout(450);await h.keyboard.up('q');await h.waitForTimeout(250);
  if(classId==='astral'){assert.equal(await h.locator('.astral-panel').getAttribute('data-element'),'water');assert.ok(Number(await h.locator('.astral-panel meter').getAttribute('value'))<75)}
  await h.screenshot({path:`${out}/${classId}.png`});report.checks.push(`Published ${classId}: canvas, movement, primary, Dash and hold/release Q without JS errors`);
 }
 for(const region of ['cinder','obsidian','caldera']){await load('warrior',false,region);assert.equal(await h.locator('.threat-lab [data-region]').inputValue(),region);await h.mouse.click(950,320);await h.waitForTimeout(800);await h.screenshot({path:`${out}/${region}.png`});report.checks.push(`Published map ${region}, audio unlocked after real input`)}
 await load('warrior',false);
 for(const [width,height] of [[1280,720],[1366,768],[1920,1080],[844,390]]){await h.setViewportSize({width,height});await h.waitForTimeout(250);assert.equal(await h.locator('canvas').count(),1)}
 assert.equal(await h.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echoes-of-dante.')).length),0);report.checks.push('Four viewports; isolated laboratory leaves real saves untouched');
 for(const asset of ['/assets/visual/environment/cinder-ground.webp','/assets/visual/environment/obsidian-ground.webp','/assets/visual/characters/ember-hound-motion.png','/assets/visual/characters/fumarole-motion.png','/assets/visual/characters/slagback-motion.png','/assets/audio/cinder-journey.mp3','/assets/audio/obsidian-journey.mp3','/assets/visual/environment/caldera-ground.webp','/assets/visual/characters/titan-motion.png','/assets/audio/caldera-journey.mp3','/assets/audio/titan-journey.mp3']){const r=await h.request.get(origin+asset);assert.equal(r.status(),200)}
 assert.ok([...assets].some(a=>a.includes('cinder-journey')));assert.ok([...assets].some(a=>a.includes('obsidian-journey')));report.assets=[...assets];
 try{report.health=await(await fetch('https://echoes-of-dante-rooms.onrender.com/coop/health?check='+Date.now(),{signal:AbortSignal.timeout(65000)})).json()}catch(e){report.relayError=String(e)}
 if(report.health?.protocol===8){
  await h.setViewportSize({width:1280,height:720});await h.keyboard.press('Escape');await h.locator('[data-shell="coop"]').click();await h.locator('[data-shell="coop-create"]').click();await h.locator('[name="coop-invite"]').waitFor();const link=await h.locator('[name="coop-invite"]').inputValue();const u=new URL(link);assert.equal(u.pathname,'/caldera-playtest.html');u.searchParams.set('class','astral');g=await browser.newPage({viewport:{width:844,height:390},hasTouch:true});observe(g);await g.goto(u.href,{timeout:90000});await g.locator('[data-shell="play-character"]').click();await g.locator('.threat-lab').evaluate(e=>e.open=false);
  for(let i=0;i<300&&!world?.partner;i++)await g.waitForTimeout(100);assert.ok(world?.partner);assert.ok(joined.every(m=>m.protocol===8));assert.equal(world.area,'cinder');report.coop='passed-public-real-WebSocket';report.checks.push('Public room and isolated invite join the volcanic expedition with protocol 8');
 }else report.coop='blocked-relay-deployment';
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.passed=false;report.failure=String(e);throw e}finally{await browser.close();await writeFile(out+'/public.json',JSON.stringify(report,null,2)+'\n');console.log(report)}
