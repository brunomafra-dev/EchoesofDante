import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const out='docs/frontend-ux-audit-178/evidence',local=process.env.QA_LOCAL??'http://127.0.0.1:5185',publicBase=process.env.QA_BASE??'https://echosofdante.vercel.app';
await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={date:'2026-11-01',release:'0.1.178',publicBase,local,errors:[],layouts:[],scenes:[],audio:[]};
const page=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});page.setDefaultTimeout(90000);
page.on('pageerror',e=>report.errors.push(e.message));
async function shot(name){await page.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:86});}
const tap=id=>page.locator(`[data-shell="${id}"]`).tap();
async function metrics(){return page.evaluate(()=>({
 viewport:[innerWidth,innerHeight],body:[document.documentElement.scrollWidth,document.documentElement.clientWidth],
 dialog:(()=>{const d=document.querySelector('.application-shell');return {scroll:d.scrollTop,height:d.clientHeight,total:d.scrollHeight};})(),
 controls:[...document.querySelectorAll('.application-shell[open] button,.application-shell[open] input,.application-shell[open] select')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {key:e.dataset.shell??e.dataset.volume??e.name,label:e.getAttribute('aria-label')??e.textContent,width:Math.round(r.width),height:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom),visible:r.bottom>0&&r.top<innerHeight};}),
 fonts:document.fonts.status
}));}
try{
 await page.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='audit-real-character-sentinel';localStorage['echoes-of-dante.settings.v1']='audit-real-settings-sentinel';Element.prototype.requestFullscreen=undefined;});
 await page.goto(publicBase+'/campaign-playtest.html?audio-review=1&v=0.1.178');await tap('settings');
 for(const [width,height]of [[844,390],[852,393],[915,412],[568,320],[393,852],[1024,768],[1920,1080]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(250);
  if(await page.locator('.mobile-display[open]').count())await page.locator('[data-mobile=continue]').tap();
  await page.evaluate(()=>document.querySelector('.application-shell').scrollTop=0);
  await shot(`settings-${width}-${height}`);const m=await metrics();
  await page.evaluate(()=>document.querySelector('[data-shell=back]')?.scrollIntoView({block:'nearest'}));m.afterScroll=await metrics();
  report.layouts.push(m);
 }
 await page.setViewportSize({width:844,height:390});await tap('back');await tap('play');await tap('new-game');
 await page.locator('.class-gallery canvas').first().waitFor();await page.waitForTimeout(1800);await shot('creation-mobile');
 report.creation=await metrics();await page.locator('[data-shell=choose-warrior]').tap();await page.locator('[name=character-sex]').selectOption('female');await page.waitForTimeout(500);await shot('creation-female-mobile');
 await tap('back');await tap('back');await tap('settings');
 await page.locator('[data-volume=master]').focus();await page.keyboard.press('Home');
 await tap('prologue-replay');await page.locator('.prologue-video').waitFor();await page.waitForTimeout(1000);
 report.prologue=await page.evaluate(()=>{const v=document.querySelector('.prologue-video');return {volume:v.volume,muted:v.muted,paused:v.paused,button:document.querySelector('[data-shell=prologue-sound]')?.textContent,sources:[v.currentSrc]};});await shot('prologue-master-zero');await tap('prologue-skip');
 report.realStorage=await page.evaluate(()=>({characters:localStorage['echoes-of-dante.characters.v1'],settings:localStorage['echoes-of-dante.settings.v1']}));
 console.log('Public UI layouts and prologue captured');

 await page.goto(local+'/campaign-playtest.html?mobile-review=1');await tap('settings');
 for(const scenario of ['normal','unlock-while-muted','unlock-while-paused']){
  await page.evaluate(async scenario=>{
   const {AudioManager}=await import('/src/systems/Sound.ts');const s=new AudioManager();s.setArea('base');
   s.setVolumes(scenario==='unlock-while-muted'?0:.8,.48,.9);
   if(scenario==='unlock-while-paused')s.setMusicFocus(0);
   window.__auditSound=s;const button=document.createElement('button');button.id='audit-unlock';button.textContent='Audio audit gesture';button.onclick=()=>s.unlock();document.querySelector('.shell-content').append(button);
  },scenario);
  await page.locator('#audit-unlock').tap();
  await page.waitForFunction(()=>window.__auditSound.context?.state==='running'&&!window.__auditSound.music.paused);
  await page.evaluate(()=>{const s=window.__auditSound;s.setVolumes(.8,.48,.9);s.setMusicFocus(1);const a=s.context.createAnalyser();a.fftSize=2048;s.musicNodes.get(s.music).gain.connect(a);window.__auditAnalyser=a;});
  await page.waitForTimeout(1700);
  const result=await page.evaluate(async()=>{const s=window.__auditSound,a=window.__auditAnalyser;let peak=0;for(let i=0;i<12;i++){const data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);peak=Math.max(peak,...data.map(Math.abs));await new Promise(r=>setTimeout(r,50));}return {muted:s.music.muted,paused:s.music.paused,currentTime:s.music.currentTime,mediaVolume:s.music.volume,gain:s.musicNodes.get(s.music).gain.gain.value,peak,context:s.context.state};});
  report.audio.push({scenario,...result});await page.evaluate(()=>{window.__auditSound.destroy();document.querySelector('#audit-unlock').remove();});
 }
 console.log('Audio output signal scenarios',JSON.stringify(report.audio));

 const ice=JSON.parse(await readFile('docs/ice-transfer/qa/solo/loaded-fixture.json','utf8'));
 await page.setViewportSize({width:1280,height:720});
 await page.addInitScript(f=>{const prefix='dante-permanence-v1.icecave.warrior.';if(!sessionStorage[prefix+'arrived']){sessionStorage[prefix+'local.echoes-of-dante.characters.v1']=JSON.stringify(f.profiles);sessionStorage[prefix+'local.echoes-of-dante.journey.v1.character.'+f.profiles.selected]=JSON.stringify(f.journey);sessionStorage[prefix+'arrived']='1';}},ice);
 await page.goto(local+'/campaign-playtest.html?permanence=icecave');
 await ready();
 const scenes=[
  ['gallery-cargo','icecave',1100,1180],['gallery-fissure','icecave',940,1010],
  ['base-cluster','base',650,750],['base-supply','base',830,1030],
  ['post-archive','springs',1860,1060],['post-building','springs',2020,1050],
  ['terrace-camp','terraces',1150,1100],['terrace-habitat','terraces',1890,1500],
  ['wind-platform','arid',2550,795],['dune-probe','dunes',2060,1000],['cold-collector','frost',940,1050],
 ];
 for(const[name,area,x,y]of scenes){
  if(await page.evaluate(()=>window.__danteGame.scene.keys.Game.area)!==area){await page.evaluate(area=>window.__danteGame.scene.keys.Game.transitionArea(area),area);await ready(area);}
  await page.evaluate(({x,y})=>{const s=window.__danteGame.scene.keys.Game;Object.assign(s.player.position,{x,y});s.player.invulnerableUntil=Infinity;}, {x,y});
  await page.waitForTimeout(500);
  await shot(name+'-desktop');
  const observed=await page.evaluate(()=>{const s=window.__danteGame.scene.keys.Game;return {area:s.area,player:{...s.player.position},bosses:{vesper:s.vesperDefeated,titan:s.titanDefeated},objects:s.children.list.filter(o=>o.getData?.('quest-prop')||/survey-|melt-pocket|cold-collector|ice-transfer/.test(o.name??'')).map(o=>({name:o.name,kind:o.getData?.('quest-prop'),x:o.x,y:o.y,width:o.displayWidth,height:o.displayHeight,depth:o.depth,visible:o.visible,alpha:o.alpha})),solids:s.arena.obstacles.map(o=>({...o}))};});
  report.scenes.push({name,...observed});
  if(['base-cluster','gallery-cargo','cold-collector','terrace-camp','wind-platform'].includes(name)){
   await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);await shot(name+'-mobile');await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(300);
  }
  console.log('Scene captured',name,area);
 }
 await page.evaluate(()=>window.__danteGame.scene.keys.Game.transitionArea('base'));await ready('base');
 await page.keyboard.press('j');await page.locator('.mission-dialog[open]').waitFor();await shot('journal-desktop');await page.setViewportSize({width:844,height:390});await page.waitForTimeout(350);await shot('journal-mobile');await page.keyboard.press('Escape');
 await page.keyboard.press('m');await page.waitForTimeout(400);await shot('atlas-mobile');await page.keyboard.press('Escape');
 report.completed=true;
}catch(e){report.failure=String(e);await shot('audit-failure').catch(()=>{});throw e;}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await b.close();}

async function ready(area){await page.waitForFunction(area=>{const s=window.__danteGame?.scene.keys.Game;return s?.missionUi&&!s.transitioning&&(!area||s.area===area);},area);for(let i=0;i<12;i++){const btn=page.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await btn.count())await btn.click();else if(i>4)break;await page.waitForTimeout(130);}await page.waitForTimeout(300);}
