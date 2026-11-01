import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://127.0.0.1:5185',out=process.env.QA_OUT??'docs/visual-integration/qa/lab',inspect=process.env.QA_INSPECT==='1',touch=process.env.QA_TOUCH==='1';await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),p=await b.newPage({viewport:{width:1280,height:720},isMobile:touch,hasTouch:touch});p.setDefaultTimeout(90000);
const r={base,inspect,touch,at:new Date().toISOString(),method:'Actual isolated visual lab buttons. Explicit advanced fixture and prepared current cargo only. No DEV globals unless inspect=true; inspection positions never defeat enemies or bosses. Native UI, real saves/settings sentinels.',errors:[],visits:[],opacity:[],layouts:[]};p.on('pageerror',e=>r.errors.push(e.message));
await p.addInitScript(()=>{localStorage['echoes-of-dante.characters.v1']='visual-lab-real-save';localStorage['echoes-of-dante.settings.v1']='visual-lab-real-settings';Element.prototype.requestFullscreen=undefined;});
async function upgrades(){for(let i=0;i<14;i++){const e=p.locator('.ability-upgrade-dialog[open] [data-upgrade]:not(:disabled)').first();if(await e.count())await e.click();await p.waitForTimeout(100);}}
async function saved(){return p.evaluate(()=>{const key=Object.keys(sessionStorage).find(k=>k.startsWith('dante-visual-integration-v1.')&&k.includes('local.echoes-of-dante.journey.v1.character.'));return key?JSON.parse(sessionStorage[key]):undefined;});}
async function activate(locator){if(touch)await locator.tap();else await locator.click();}
async function visit(id,area){await activate(p.locator('.campaign-lab-help summary'));await activate(p.locator(`[data-visual-stop=${id}]`));await p.waitForFunction(area=>{const k=Object.keys(sessionStorage).find(k=>k.startsWith('dante-visual-integration-v1.')&&k.includes('local.echoes-of-dante.journey.v1.character.'));return k&&JSON.parse(sessionStorage[k]).area===area&&!document.querySelector('.campaign-lab-help').open},area);await upgrades();await p.waitForTimeout(800);}
async function inspectScene(id){return p.evaluate(async id=>{
 const s=window.__danteGame.scene.keys.Game,marked=s.children.list.filter(o=>o.getData?.('environment-body')&&o.visible),canopies=s.children.list.filter(o=>o.texture&&['world-overhead','dante-canopy-green','dante-canopy-blue'].includes(o.texture.key)&&o.visible&&o.depth>10000),tests=[];
 const home={...s.player.position};
 for(const body of [...marked.slice(0,3),...canopies.slice(0,2)]){
  const alpha=body.alpha;let cover={x:body.x+(.5-body.originX)*body.displayWidth,y:body.y+(.5-body.originY)*body.displayHeight+30};
  const samples=[],coverage=[];
  const frame=body.frame,canvas=document.createElement('canvas');canvas.width=frame.cutWidth;canvas.height=frame.cutHeight;const ctx=canvas.getContext('2d');ctx.drawImage(body.texture.getSourceImage(),frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let selected=false;
  for(let v=.15;v<.9&&!selected;v+=.06)for(let u=.15;u<.9&&!selected;u+=.06){
   if(pixels[(Math.floor(v*canvas.height)*canvas.width+Math.floor(u*canvas.width))*4+3]<160)continue;
   const dx=((body.flipX?1-u:u)-body.originX)*body.displayWidth,dy=((body.flipY?1-v:v)-body.originY)*body.displayHeight,c=Math.cos(body.rotation),sn=Math.sin(body.rotation),q={x:body.x+c*dx-sn*dy,y:body.y+sn*dx+c*dy+45},bounds=s.movementBounds;
   if(q.y>=body.depth||bounds&&(q.x<bounds.left+30||q.x>bounds.right-30||q.y<bounds.top+30||q.y>bounds.bottom-70)||s.arena.obstacles.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<o.radius+s.player.radius+3))continue;
   cover=q;selected=true;
  }
  const points=[{x:body.x+240,y:body.y+150},cover,{x:body.x+240,y:body.y+150},cover];
  for(const point of points){Object.assign(s.player.position,point);await new Promise(r=>setTimeout(r,200));samples.push(body.alpha);let hits=0;
   if(body.depth>s.player.position.y)for(const[ox,oy]of [[0,-60],[-12,-40],[12,-40],[0,-15]]){const dx=s.player.position.x+ox-body.x,dy=s.player.position.y+oy-body.y,cos=Math.cos(body.rotation),sin=Math.sin(body.rotation);let u=(cos*dx+sin*dy)/body.displayWidth+body.originX,v=(-sin*dx+cos*dy)/body.displayHeight+body.originY;if(body.flipX)u=1-u;if(body.flipY)v=1-v;if(u>=0&&u<1&&v>=0&&v<1&&pixels[(Math.floor(v*canvas.height)*canvas.width+Math.floor(u*canvas.width))*4+3]>96)hits++;}
   coverage.push(hits);
  }tests.push({texture:body.texture.key,name:body.name,alpha,samples,coverage,cover,selectedCoverPoint:selected});
 }
 Object.assign(s.player.position,home);
 s.navigation.refreshGeometry();const targets=id==='gallery'?[...s.regional.sites.map(q=>({x:q.x,y:q.y})),{x:245,y:960},{x:2760,y:980}]:id==='collector'?[{x:840,y:1070},{x:1040,y:1070},{x:940,y:1110},{x:2640,y:930}]:id==='base'?[{x:395,y:755},{x:835,y:745},{x:1200,y:740}]:[];
 const routes=targets.map(q=>{const route=s.navigation.findRoute(s.navigation.nearest(home),s.navigation.nearest(q));return{q,steps:route.length,gap:route.length?Math.hypot(route.at(-1).x-q.x,route.at(-1).y-q.y):Infinity};});
 const companions=s.children.list.filter(o=>o.getData?.('quest-prop')).map(body=>{const g=body.getData('ground-footing');return{kind:body.getData('quest-prop'),visible:body.visible,groundVisible:g?.visible,ground:g?.texture.key,alpha:body.alpha,groundAlpha:g?.alpha,offset:g?Math.hypot(g.x-(body.x+(.5-body.originX)*body.displayWidth),g.y-(body.y+(232/256-body.originY)*body.displayHeight)):Infinity};});
 return{tests,routes,companions,solids:s.arena.obstacles.length,textures:Object.keys(s.textures.list).filter(k=>k.startsWith('prop-footing-')).length,bosses:[s.vesperDefeated,s.titanDefeated]};
 },id);}
try{
 await p.goto(base+'/campaign-playtest.html?visual-review=1&v=0.1.181');await p.locator('.mission-tracker').waitFor();await upgrades();await p.waitForTimeout(1500);
 if(!inspect)assert.equal(await p.evaluate(()=>typeof window.__danteGame),'undefined');
 await activate(p.locator('.campaign-lab-help summary'));const explain=p.getByRole('button',{name:'SIMULAÇÕES E INSTRUÇÕES',exact:true});await activate(explain);assert.equal(await explain.getAttribute('aria-expanded'),'true');await p.locator('#visual-review-instructions').waitFor();await activate(explain);assert.equal(await explain.getAttribute('aria-expanded'),'false');await activate(p.locator('.campaign-lab-help summary'));
 for(const[id,area]of [['base','base'],['post','springs'],['pipes','springs'],['camp','terraces'],['collector','frost'],['gallery','icecave'],['wind','arid'],['dunes','dunes'],['forest','forest']]){
  await visit(id,area);const state=await saved();assert.equal(state.flags.vesperDefeated,false);assert.equal(state.flags.titanDefeated,false);assert.equal(state.missionRewards.includes('settle-icecave'),false);assert.equal(state.economy.credits,300);r.visits.push({id,area,flags:state.flags,credits:state.economy.credits,receipts:state.missionRewards});
  await p.screenshot({path:`${out}/${id}-desktop.jpg`,type:'jpeg',quality:86});await p.setViewportSize({width:844,height:390});await p.waitForTimeout(400);await p.screenshot({path:`${out}/${id}-mobile.jpg`,type:'jpeg',quality:86});await p.setViewportSize({width:1280,height:720});
  if(inspect){const data=await inspectScene(id);r.opacity.push({id,...data});for(const t of data.tests)assert.ok(t.samples.every(a=>Math.abs(a-t.alpha)<.001),JSON.stringify(t));for(const route of data.routes)assert.ok(route.steps>0&&route.gap<110,JSON.stringify(route));for(const c of data.companions){assert.equal(c.visible,c.groundVisible);assert.equal(c.alpha,c.groundAlpha);assert.ok(c.offset<.1);}assert.deepEqual(data.bosses,[false,false]);
   if(['post','forest'].includes(id)){const covered=data.tests.find(t=>t.coverage[1]>0);if(covered){await p.evaluate(q=>Object.assign(window.__danteGame.scene.keys.Game.player.position,q),covered.cover);await p.waitForTimeout(300);await p.screenshot({path:`${out}/${id}-occluded.jpg`,type:'jpeg',quality:88});}}
  }
  console.log('Visual visit passed',id);
 }
 for(const[width,height]of [[568,320],[844,390],[852,393],[915,412],[393,852],[1024,768],[1920,1080]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(300);const continueButton=p.locator('[data-mobile=continue]');if(await continueButton.isVisible())await continueButton.click();if(!await p.locator('.campaign-lab-help').evaluate(e=>e.open))await activate(p.locator('.campaign-lab-help summary'));
  const layout=await p.locator('.campaign-lab-help').evaluate(e=>{const r=e.getBoundingClientRect();return{viewport:[innerWidth,innerHeight],right:r.right,bottom:r.bottom,overflow:document.documentElement.scrollWidth>innerWidth,buttonHeights:[...e.querySelectorAll('[data-visual-stop]')].map(b=>b.getBoundingClientRect().height)};});r.layouts.push(layout);assert.equal(layout.overflow,false);assert.ok(layout.right<=width+1&&layout.bottom<=height+1);assert.ok(layout.buttonHeights.every(h=>h>=44));if([568,393].includes(width))await p.screenshot({path:`${out}/selector-${width}.jpg`,type:'jpeg',quality:86});
 }
 await activate(p.locator('.campaign-lab-help summary'));await p.setViewportSize({width:1280,height:720});const before=await saved();await p.reload();await p.locator('.mission-tracker').waitFor();await upgrades();assert.deepEqual((await saved()).missionRewards,before.missionRewards);assert.equal((await saved()).area,before.area);
 assert.deepEqual(await p.evaluate(()=>[localStorage['echoes-of-dante.characters.v1'],localStorage['echoes-of-dante.settings.v1']]),['visual-lab-real-save','visual-lab-real-settings']);assert.deepEqual(r.errors,[]);r.passed=true;
}catch(e){r.failure=String(e);await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}
finally{await writeFile(out+'/report.json',JSON.stringify(r,null,2)+'\n');await b.close();}
