import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',arc=process.env.QA_ARC??'boreal',out=process.env.QA_OUT??'docs/boreal-journey/qa/coop';
const areas={sirocco:['valley','arid','dunes','sandpit'],boreal:['frost','icecave','icenest'],embers:['cinder','obsidian','caldera']}[arc];await mkdir(out,{recursive:true});
const browsers=[],pages=[],report={arc,method:'Two independent Chrome processes with real local relay; explicit post-Soterrado lab arrival, living Vesper; guest activates original relays. Guest uses real E inputs for canonical discoveries; no public relay or physical-device claim.',errors:[],regions:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 for(const cls of ['warrior','hunter']){const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});browsers.push(b);const p=await b.newPage({viewport:{width:1280,height:720}});pages.push(p);p.setDefaultTimeout(90000);await(await p.context().newCDPSession(p)).send('Emulation.setFocusEmulationEnabled',{enabled:true});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/campaign-playtest.html?boreal=1&arrival=frost&class='+cls);await p.waitForFunction(()=>{const s=window.__danteGame?.scene.getScene('Game');return s?.player?.view.active&&s.area==='frost'&&!s.transitioning&&s.regional?.sites.length===3});for(let i=0;i<10;i++){const button=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(!await button.count())break;await button.click()}}
 const[h,g]=pages;
 const campaign=await h.evaluate(async()=>{const{createCampaign}=await import('/src/systems/Campaign.ts'),{characterProfiles:p}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/systems/CharacterProfiles.ts').name);p.active.campaign=createCampaign(p.active.id,{mode:'coop',difficulty:'normal',size:2});p.active.campaign.introSeen=true;p.select(p.active.id);return p.active.campaign});
 await h.evaluate(async url=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();await window.__danteCoop.connect(url,'create',{name:'Guilherme',classId:'warrior',sex:'male'},s.area)},base.replace(/^http/,'ws')+'/coop');
 const code=await h.evaluate(()=>window.__danteCoop.code);
 await g.evaluate(async campaign=>{const{createCampaign}=await import('/src/systems/Campaign.ts'),{characterProfiles:p}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/systems/CharacterProfiles.ts').name);p.active.campaign=createCampaign(p.active.id,{mode:'coop',difficulty:'normal',joining:campaign});p.active.campaign.introSeen=true;p.select(p.active.id)},campaign);
 await g.evaluate(async({url,code})=>{const s=window.__danteGame.scene.getScene('Game');s.saveProgress();await window.__danteCoop.connect(url,'join',{name:'Lúcia',classId:'hunter',sex:'female'},s.area,code)},{url:base.replace(/^http/,'ws')+'/coop',code});await h.evaluate(()=>window.__danteCoop.startCampaign());
 await h.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party?.actors.size===1);await g.waitForFunction(()=>window.__danteGame.scene.getScene('Game').party?.mirrors.size>0);
 const invite=await h.evaluate(async()=>{const {invitationLink}=await import('/src/network/CoopInvitation.ts');return invitationLink(window.__danteCoop.code)});assert.equal(new URL(invite).searchParams.get('boreal'),'1');assert.equal(new URL(invite).searchParams.has('arrival'),false);

 for(const area of areas){
  console.log('Coop',area);if(area!==areas[0])assert.ok(await h.evaluate(a=>{const s=window.__danteGame.scene.getScene('Game');if(a==='icecave')s.icecaveVisited=true;if(a==='icenest')s.icenestVisited=true;return s.transitionArea(a)},area),'Adjacent campaign travel accepted');
  for(const p of pages)await p.waitForFunction(a=>{const s=window.__danteGame.scene.getScene('Game');return s.scene.isActive()&&s.area===a&&!s.transitioning&&s.children.list.some(o=>o.getData?.('route-identity')===a)},area);
  await sleep(700);await h.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');for(const p of[s.player,...s.party.players])p.invulnerableUntil=Infinity});
  const inspect=p=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,ground:s.children.list.filter(o=>o.getData?.('route-identity')).map(o=>[o.texture.key,o.displayWidth,o.displayHeight]),obstacles:s.arena.obstacles.map(o=>[o.x,o.y,o.radius]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),boss:s.soterrado?.isDead??s.vesper?.isDead??s.titan?.isDead}});
  const host=await inspect(h),guest=await inspect(g);assert.deepEqual(guest.ground,host.ground);assert.deepEqual(guest.obstacles,host.obstacles);if(['sandpit','icenest','caldera'].includes(area)){assert.equal(host.boss,false);assert.equal(guest.boss,false);}
  const sites=await h.evaluate(()=>window.__danteGame.scene.getScene('Game').regional?.sites??[]);
  for(const site of sites){console.log('Guest scan',site.id);await h.evaluate(q=>{const s=window.__danteGame.scene.getScene('Game'),p=[...s.party.actors.values()][0].player;Object.assign(p.position,q)},site);await sleep(650);await g.keyboard.press('e',{delay:240});for(const p of pages)await p.waitForFunction(id=>window.__danteGame.scene.getScene('Game').missions.has(id),site.id);if(site.id==='exp-dunes-3')for(const p of pages)assert.ok(await p.evaluate(()=>window.__danteGame.scene.getScene('Game').dunes.tremor.alpha>0),'Sand responds for host and guest');}
  if(area!=='icenest'){
   await h.evaluate(a=>{const s=window.__danteGame.scene.getScene('Game'),guest=[...s.party.actors.values()][0].player;Object.assign(guest.position,a==='frost'?{x:1810,y:650}:{x:1760,y:700})},area);await sleep(650);await g.keyboard.press('e',{delay:220});
   for(const p of pages)await p.waitForFunction(a=>{const s=window.__danteGame.scene.getScene('Game');return a==='frost'?s.frostSignalSeen:s.icecaveSignalSeen},area);
  }
  report.regions.push({area,ground:host.ground,sharedPhysics:true,guestScans:sites.map(s=>s.id),bossAlive:host.boss===false});
 }
 // Actual guest dialogs and personal reward replication after the scans.
 await h.evaluate(()=>window.__danteGame.scene.getScene('Game').transitionArea('base'));
 for(const p of pages)await p.waitForFunction(()=>{const s=window.__danteGame.scene.getScene('Game');return s.area==='base'&&s.scene.isActive()&&!s.transitioning&&!!s.regional});
 await sleep(800);const before=await Promise.all(pages.map(p=>p.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits)));
 for(const[id,npc]of [['exp-frost','medic'],['exp-icecave','smith']]){
  await h.evaluate(async npc=>{const s=window.__danteGame.scene.getScene('Game'),c=(await import('/src/config/base.ts')).BASE.services.find(c=>c.id===npc),guest=[...s.party.actors.values()][0].player;Object.assign(guest.position,{x:c.x+65,y:c.y+55});guest.invulnerableUntil=Infinity;},npc);
  await sleep(800);await g.keyboard.press('e',{delay:220});const select=g.locator('[data-mission-action=select-'+id+']');await g.locator('.mission-dialog[open]').waitFor();if(await select.count())await select.click();await g.locator('[data-mission-action=deliver]').click();
  for(const p of pages)await p.waitForFunction(id=>window.__danteGame.scene.getScene('Game').missionRewards.includes(id),id);
 }
 const after=await Promise.all(pages.map(p=>p.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits)));for(let i=0;i<2;i++)assert.equal(after[i],before[i]+165);
 await g.evaluate(()=>window.__danteCoop.socket.close());await g.waitForFunction(()=>window.__danteCoop.campaignRunning&&window.__danteGame.scene.getScene('Game').missionRewards.includes('exp-icecave'));await sleep(1800);assert.equal(await g.evaluate(()=>window.__danteGame.scene.getScene('Game').economy.credits),after[1]);
 report.turnIn={creditsPerPlayer:165,reconnected:true,duplicateReward:false};
 await g.screenshot({path:out+'/guest.jpg',type:'jpeg',quality:85});assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);report.states=await Promise.all(pages.map(p=>p.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{area:s.area,player:s.player.position,dead:s.player.isDead,modal:s.inputModalOpen,paused:s.scene.isPaused(),role:window.__danteCoop.role,missions:s.missions.snapshot(),actors:[...(s.party?.actors.values()??[])].map(a=>({position:a.player.position,dead:a.player.isDead})),sites:s.regional?.sites}}).catch(e=>String(e))));for(let i=0;i<pages.length;i++)await pages[i].screenshot({path:out+'/failure-'+i+'.jpg'}).catch(()=>{});throw e}finally{for(const b of browsers)await b.close();await writeFile(out+'/coop.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
