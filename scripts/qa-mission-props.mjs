import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_BASE??'http://localhost:5185',out=process.env.QA_OUT??'docs/mission-props/qa';
await mkdir(out,{recursive:true});
const report={method:'Chrome DEV: real resource collection with controlled positions, isolated lab, material pooling/guest snapshots; static HTML crawler checks on compiled server.',checks:[],errors:[]},check=s=>{report.checks.push(s);console.log(s)};
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1280,height:720}});
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
try{
 await page.addInitScript(()=>localStorage.setItem('echoes-of-dante.characters.v1','real-save-sentinel'));
 await page.goto(base+'/inventory-playtest.html?props=1&v=0.1.129');
 await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game').children.getByName('lab-survey-gallery'));await page.waitForTimeout(2200);
 const data=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{props:s.children.list.filter(o=>o.name.startsWith('survey-')).map(o=>o.texture.key),drops:s.children.list.filter(o=>o.name==='material-drop').map(o=>o.texture.key),economy:structuredClone(s.economy)}});
 assert.equal(data.props.length,6);assert.equal(new Set(data.props).size,6);assert.deepEqual(data.drops,['material-alloy','material-amber-shell','material-boreal-core']);
 assert.equal(data.economy.credits,0);assert.deepEqual(data.economy.materials,[0,0,0]);check('Six distinct investigation props and three real material silhouettes; lab starts without collecting anything automatically');
 await page.screenshot({path:out+'/gallery-1280.png'});
 for(const tier of [1,2,3]){await page.evaluate(tier=>{const s=window.__danteGame.scene.getScene('Game'),p=s.resources.snapshot().find(p=>p.tier===tier);Object.assign(s.player.position,{x:p.x,y:p.y});},tier);await page.waitForTimeout(250)}
 const collected=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');return{credits:s.economy.credits,materials:s.economy.materials,drops:s.resources.snapshot().length}});
 assert.deepEqual(collected,{credits:24,materials:[1,1,1],drops:0});check('Actual collection preserves 4/8/12 credits, one material per tier, pickup radius and consumption');
 const stable=await page.evaluate(()=>{const s=window.__danteGame.scene.getScene('Game');Object.assign(s.player.position,{x:430,y:1130});const count=()=>({objects:s.children.list.length,textures:Object.keys(s.textures.list).length,entries:s.resources.entries.length});const before=count();for(let i=0;i<40;i++)s.seedMissionPropsPlaytest();return{before,after:count()}});
 assert.deepEqual(stable.before,stable.after);report.stability=stable;check('Forty laboratory replenishments reuse three pooled drops and the six original props');
 const guests=await page.evaluate(async()=>{const {ResourceDrops}=await import('/src/systems/ResourceDrops.ts'),s=window.__danteGame.scene.getScene('Game'),r=new ResourceDrops(s,'guest-test');const poses=[1,2,3].map(tier=>({uid:'guest-material-'+tier,x:400+tier*50,y:1000,owner:'guest-test',tier,credits:4*tier,amount:1}));r.render([...poses,{...poses[0],uid:'someone-else',owner:'host'},{...poses[0],uid:'bad-tier',tier:9}]);for(let i=0;i<100;i++)r.render(poses);const entries=r.entries.map(e=>({texture:e.image.texture.key,visible:e.image.visible}));r.retainOwners(new Set());const hidden=r.entries.every(e=>!e.image.visible);for(const e of r.entries)e.image.destroy();return{entries,hidden}});
 assert.equal(guests.entries.length,3);assert.ok(guests.entries.every(e=>e.visible));assert.deepEqual(guests.entries.map(e=>e.texture),data.drops);assert.ok(guests.hidden);check('Guest snapshots use the same art, filter other owners/invalid tiers and do not duplicate drops');
 report.fps=await page.evaluate(async()=>{const samples=[];for(let i=0;i<10;i++){await new Promise(r=>setTimeout(r,300));samples.push(window.__danteGame.loop.actualFps)}return{samples,average:samples.reduce((a,b)=>a+b)/samples.length}});
 for(const[width,height]of [[1366,768],[1920,1080],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(350);await page.screenshot({path:out+`/gallery-${width}.png`})}
 assert.equal(await page.evaluate(()=>localStorage.getItem('echoes-of-dante.characters.v1')),'real-save-sentinel');check('Four resolutions captured; real character save unchanged');
 const compiled=process.env.QA_COMPILED??'http://localhost:5192';
 for(const suffix of ['/', '/?sala=TESTE']){const r=await fetch(compiled+suffix,{headers:{'User-Agent':'facebookexternalhit/1.1'}});assert.equal(r.status,200);const html=await r.text();assert.match(html,/property="og:image" content="https:\/\/echosofdante.vercel.app\/assets\/share\/dante-expedition-v1.jpg"/);assert.match(html,/property="og:image:width" content="1200"/);assert.match(html,/property="og:image:height" content="630"/);assert.match(html,/name="twitter:card" content="summary_large_image"/);assert.doesNotMatch(html,/Exploração e combate/);}
 const image=await fetch(compiled+'/assets/share/dante-expedition-v1.jpg');assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/jpeg/);assert.ok((await image.arrayBuffer()).byteLength<500000);check('Compiled root and room-invitation URL contain server-visible social metadata; JPEG returns 200 with correct MIME and <500KB');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(e){report.failure=String(e);await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2))}
