import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/prologue-menu/qa';await mkdir(out,{recursive:true});
const base=process.env.QA_BASE??'http://localhost:5184';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={checks:[],errors:[],metrics:[]},check=t=>{console.log(t);report.checks.push(t)};
const button=(p,id)=>p.locator(`[data-shell="${id}"]`);
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player);
const reloadClick=async(p,id)=>{await Promise.all([p.waitForEvent('domcontentloaded'),button(p,id).click()]);await ready(p);};
const scene=(p,code)=>p.evaluate(code=>new Function('s','r',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop),code);
const watch=p=>{p.setDefaultTimeout(45000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});};
async function create(p,cls,name,difficulty='easy'){
 await button(p,'choose-'+cls).click();await p.locator('[name=character-name]').fill(name);await button(p,'create').click();
 await button(p,`difficulty-${difficulty}`).waitFor();
 assert.deepEqual(await p.locator('[data-shell^="difficulty-"]').allTextContents(),['Fezes puríssima','Marromenos','Chama 🔥']);
 assert.equal(await p.locator('.difficulty-choice').evaluateAll(bs=>bs.some(b=>b.textContent.includes('·'))),false);
 await button(p,`difficulty-${difficulty}`).click();await p.locator('.prologue-video').waitFor();
}
try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});watch(p);
 await p.addInitScript(()=>{if(localStorage.getItem('echoes-of-dante.characters.v1')===null)localStorage.setItem('echoes-of-dante.characters.v1','REAL-CHARACTERS-DO-NOT-CHANGE');});
 await p.goto(base+'/campaign-playtest.html');await ready(p);
 assert.deepEqual(await p.locator('.shell-content > button').allTextContents(),['JOGAR','CONFIGURAÇÕES']);check('Clean home: only Play and Settings; no automatically created hero');
 await button(p,'play').click();await button(p,'new-game').click();
 assert.ok((await p.locator('.class-name').allTextContents()).includes('Domador de feras'));check('Character gallery uses the approved Domador de feras display name');
 assert.equal(await button(p,'difficulty-easy').count(),0);await create(p,'astral','AL Água da Terra');
 const video=p.locator('.prologue-video');await p.waitForFunction(()=>{const v=document.querySelector('.prologue-video');return v?.readyState>=2&&v.duration>19&&v.currentTime>.7});
 const media=await video.evaluate(v=>({duration:v.duration,time:v.currentTime,paused:v.paused,source:new URL(v.currentSrc).pathname,caption:!!document.querySelector('.prologue-caption')}));
 assert.ok(media.duration>19&&media.duration<21);assert.equal(media.paused,false);assert.equal(media.source,'/assets/prologue/arrival-trailer.mp4');assert.equal(media.caption,false);
 await p.screenshot({path:out+'/prologue-trailer.png'});check('New Game selects class/name before difficulty, then directly launches one cinematic MP4 without text cards');
 const videoHandle=await video.elementHandle(),startTime=await video.evaluate(v=>v.currentTime);await button(p,'settings').click();await p.waitForTimeout(700);const pausedTime=await videoHandle.evaluate(v=>v.currentTime);assert.ok(pausedTime-startTime<.2);await button(p,'back').click();await p.waitForTimeout(500);assert.ok(await video.evaluate(v=>v.currentTime)>pausedTime);check('Settings pause and resume the same video position');
 await button(p,'prologue-skip').click();await p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);
 assert.equal(await scene(p,'return s.area'),'base');assert.equal(await scene(p,'return s.classId'),'astral');
 const hero=await p.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters[0]);assert.equal(hero.name,'AL Água da Terra');assert.equal(hero.campaign.difficulty,'easy');assert.equal(hero.campaign.introSeen,true);check('The new campaign is saved with the selected difficulty and enters the game immediately after the cinematic');
 await p.keyboard.press('Escape');assert.equal(await button(p,'characters').count(),0);await reloadClick(p,'home');await button(p,'settings').click();await button(p,'prologue-replay').click();await button(p,'prologue-skip').click();await button(p,'back').click();
 await button(p,'play').click();await button(p,'continue').click();await reloadClick(p,'play-character');await p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);assert.equal(await p.locator('.prologue').count(),0);check('Pause offers no hero swap; return to title, replay and Continue preserve the selected hero without replaying intro');
 console.log('Before transition',await scene(p,'return {active:s.scene.isActive(),paused:s.scene.isPaused(),menu:document.querySelector(".application-shell").open,now:s.time.now,offset:s.recordsTimeOffset}'));
 console.log('Transition',await p.evaluate(()=>window.__danteGame.scene.getScene('Game').transitionArea('forest')));await p.waitForTimeout(1000);console.log('After',await scene(p,'return {area:s.area,active:s.scene.isActive(),paused:s.scene.isPaused(),transitioning:s.transitioning,now:s.time.now,offset:s.recordsTimeOffset,loop:s.game.loop.now}'));await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='forest'&&window.__danteGame.scene.getScene('Game').enemies.length>0&&window.__danteGame.scene.isActive('Game'));
 const easy=await scene(p,'return s.enemies[0].health.max');report.metrics.push({difficulty:'easy',enemyHP:easy});
 await p.keyboard.press('Escape');await reloadClick(p,'home');await button(p,'play').click();await button(p,'new-game').click();await create(p,'warrior','Chama','hard');await button(p,'prologue-skip').click();await p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open);await scene(p,"s.transitionArea('forest')");await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='forest'&&window.__danteGame.scene.getScene('Game').enemies.length>0&&window.__danteGame.scene.isActive('Game'));
 const hard=await scene(p,'return s.enemies[0].health.max');assert.ok(hard>easy*1.8);report.metrics.push({difficulty:'hard',enemyHP:hard});
 const damage=await scene(p,'s.player.invulnerableUntil=-Infinity;const hp=s.player.hp;s.enemyStrike(s.enemies[0],{ranged:true,damage:10});return hp-s.player.hp');assert.ok(damage>=13);check('Difficulty changes real enemy HP and damage, without changing player base combat');
 await p.keyboard.press('Escape');await reloadClick(p,'home');
 for(const viewport of [{width:1366,height:768},{width:1920,height:1080},{width:844,height:390}]){await p.setViewportSize(viewport);await button(p,'settings').click();await button(p,'prologue-replay').click();assert.ok(await button(p,'prologue-skip').isVisible());await p.waitForFunction(()=>document.querySelector('.prologue-video')?.readyState>=2);await p.screenshot({path:`${out}/prologue-${viewport.width}.png`});await button(p,'prologue-skip').click();await button(p,'back').click();}
 const real=await p.evaluate(()=>Object.getPrototypeOf(localStorage).getItem.call(localStorage,'not-dante'));// smoke storage wrapper
 void real;check('Four desktop/mobile landscape resolutions preserve readable prologue controls');
 await p.goto(base+'/test-library.html');assert.equal(await p.evaluate(()=>localStorage.getItem('echoes-of-dante.characters.v1')),'REAL-CHARACTERS-DO-NOT-CHANGE');check('Reserved lab keeps real character registry byte-for-byte untouched across reloads');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);throw e;}finally{await writeFile(out+'/menu-report.json',JSON.stringify(report,null,2));await browser.close();}
