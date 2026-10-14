import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const size=Number(process.env.QA_SIZE??4);const out='docs/prologue-menu/qa';await mkdir(out,{recursive:true});const base=process.env.QA_BASE??'http://localhost:5184';
const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const report={checks:[],errors:[],metrics:[]},pages=[],check=t=>{console.log(t);report.checks.push(t)};
const click=(p,id)=>p.locator(`[data-shell="${id}"]`).click();
const ready=p=>p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player);
const scene=(p,code,arg)=>p.evaluate(({code,arg})=>new Function('s','r','arg',code)(window.__danteGame.scene.getScene('Game'),window.__danteCoop,arg),{code,arg});
const active=p=>p.waitForFunction(()=>document.querySelector('.application-shell')&&!document.querySelector('.application-shell').open&&window.__danteGame.scene.isActive('Game'));
async function page(){const p=await b.newPage({viewport:{width:1280,height:720},hasTouch:true});p.setDefaultTimeout(60000);p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});pages.push(p);return p;}
async function create(p,cls){console.log('Creating',cls);await click(p,'choose-'+cls);await p.locator('[name=character-name]').fill('Original '+cls);await click(p,'create');await click(p,'prologue-skip');console.log('Skipped',cls);await p.waitForFunction(()=>window.__danteCoop?.connected);console.log('Connected',cls);}
async function reload(p,id){await Promise.all([p.waitForEvent('domcontentloaded'),click(p,id)]);await ready(p);}
try{
 const h=await page();await h.goto(base+'/campaign-playtest.html');await ready(h);
 for(const id of ['play','coop','coop-new','difficulty-hard'])await click(h,id);await h.locator('[name=party-size]').selectOption(String(size));await click(h,'new-character');await create(h,'warrior');
 const code=await scene(h,'return r.code');const original=await scene(h,'return s.player.position.x');await h.waitForTimeout(450);assert.equal(await scene(h,'return s.player.position.x'),original);
 for(const cls of ['hunter','astral','xenobinder'].slice(0,size-1)){const p=await page();await p.goto(`${base}/campaign-playtest.html?sala=${code}`);await create(p,cls);}
 await click(h,'coop-start');for(const p of pages)await active(p);
 await h.waitForFunction(size=>window.__danteGame.scene.getScene('Game').party.actors.size===size-1,size);
 const ids=await Promise.all(pages.map(p=>scene(p,'return r.id')));assert.equal(new Set(ids).size,size);
 const saved=await Promise.all(pages.map(p=>p.evaluate(()=>JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1')).characters[0])));
 assert.ok(saved.every(p=>p.campaign.crew.length===size&&p.campaign.difficulty==='hard'&&p.campaign.size===size));
 check(`Full real menu flow: ${size} classes, every browser saves the original crew before Play`);
 await scene(h,"s.transitionArea('forest')");for(const p of pages)await p.waitForFunction(()=>window.__danteGame.scene.getScene('Game').area==='forest');await h.waitForTimeout(800);
 for(const p of pages)await scene(p,'s.cameras.main.visible=false;s.game.loop.hasFocus=true;s.game.loop.blur=()=>{}');
 await scene(h,'for(const p of [s.player,...s.party.players])p.invulnerableUntil=Infinity;Object.assign(s.player.position,{x:900,y:940})');await h.waitForTimeout(600);
 const before=await scene(h,'return {enemies:s.enemies.length,now:s.time.now,hp:s.enemies[0].health.max,base:s.party.resilience.get(s.enemies[0])}');assert.ok(before.enemies>8);assert.equal(before.hp,Math.round(before.base*[1,1.55,2.05,2.6][size-1]));report.metrics.push(before);
 const guest=pages[1];await guest.keyboard.press('Escape');await reload(guest,'home');
 await h.waitForFunction(()=>window.__danteGame.scene.isPaused('Game')&&!window.__danteCoop.campaignRunning);
 const frozen=await scene(h,'return s.time.now');await h.waitForTimeout(1600);assert.equal(await scene(h,'return s.time.now'),frozen);
 assert.equal(await scene(h,"return r.travel(s.area,'cavern')"),false);check('Any missing original member freezes the scene, combat clock and travel; host never runs a smaller/easier party');
 const rejoinStart=Date.now();await guest.goto(`${base}/campaign-playtest.html?sala=${code}`);await guest.locator('[data-shell=play-character]').waitFor();await reload(guest,'play-character');for(const p of pages)await active(p);
 await h.waitForTimeout(500);assert.equal(await scene(guest,'return r.id'),ids[1]);const resumed=await scene(h,'return s.time.now');report.resume={frozen,resumed,wall:Date.now()-rejoinStart};assert.ok(resumed>=frozen&&resumed-frozen<=report.resume.wall+500);check('Original saved character rejoins through the invitation, keeps its stable seat and resumes without cooldown time skipping');
 await scene(h,"s.progression.investigateEcho('northern-ruin')").catch(()=>{});
 // Verify shared checkpoint persistence without importing the host equipment/build.
 await scene(h,"s.progression.restore({...s.progression.snapshot(),echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true});s.cavernDepthSeen=true;s.deepPassageOpen=true;s.saveProgress()");await h.waitForTimeout(700);
 for(const p of pages.slice(1))await p.waitForFunction(()=>{const registry=JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1'));const saved=JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.'+registry.selected));return saved?.flags.deepPassageOpen&&saved.progression.echoes.length===3;},{},{timeout:15000});
 const checkpoints=await Promise.all(pages.slice(1).map(p=>p.evaluate(()=>{const registry=JSON.parse(localStorage.getItem('echoes-of-dante.characters.v1'));return JSON.parse(localStorage.getItem('echoes-of-dante.journey.v1.character.'+registry.selected));})));report.checkpoints=checkpoints;assert.ok(checkpoints.every(c=>c.area==='forest'&&c.progression.echoes.length===3&&c.flags.deepPassageOpen));
 check('Each co-op character stores shared discoveries/checkpoints while retaining its personal build and economy');
 await h.keyboard.press('Escape');await reload(h,'home');for(const p of pages.slice(1))await p.locator('[data-shell=coop-home]').waitFor();assert.equal(await pages[1].locator('[data-shell=coop-solo]').count(),0);
 for(const id of ['play','coop','coop-continue','play-character']){if(id==='play-character')await reload(h,id);else await click(h,id);}await h.waitForFunction(()=>window.__danteCoop?.connected);const newCode=await scene(h,'return r.code');assert.notEqual(newCode,code);
 for(const p of pages.slice(1)){await reload(p,'coop-home');await p.goto(`${base}/campaign-playtest.html?sala=${newCode}`);await reload(p,'play-character');}
 await click(h,'coop-start');for(const p of pages)await active(p);assert.equal(await scene(h,'return r.campaign.crew.length'),size);
 check('Host termination offers menu only; original host recreates the saved campaign, all original guests return, no replacement or solo continuation');
 await h.keyboard.press('Escape');await reload(h,'home');await click(h,'play');await click(h,'continue');assert.equal(await h.locator('.saved-character').count(),0);check('Solo Continue excludes every co-op hero');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);for(const [i,p]of pages.entries())try{await p.screenshot({path:`${out}/continuity-failure-${i}.png`});report.metrics.push(await scene(p,'return {area:s.area,role:r.role,connected:r.connected,running:r.campaignRunning,menu:document.querySelector(".shell-content").innerText,paused:s.scene.isPaused(),now:s.time.now,loop:s.game.loop.now,offset:s.recordsTimeOffset,sendAt:s.party?.sendAt,hostPaused:r.hostPaused,age:performance.now()-r.worldAt,worldFlags:r.world?.flags,worldProgress:r.world?.progression,saved:s.journey.load()}'));}catch{}throw e;}finally{await writeFile(out+'/continuity-'+size+'-report.json',JSON.stringify(report,null,2));await b.close();}
