import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.QA_BASE??'http://localhost:5190';
const out=process.env.QA_OUT??'docs/cinematic-pilot/revision-02/qa';
await mkdir(out,{recursive:true});
const report={base,method:'Chrome: static whole-scene reference only. Does NOT validate or claim a new video.',checks:[],errors:[],videoGenerated:false};
const browser=await chromium.launch({channel:'chrome'});
try{
 const p=await browser.newPage({viewport:{width:1280,height:720},hasTouch:true});
 p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
 await p.addInitScript(()=>{localStorage.setItem('sentinel','preserve');sessionStorage.setItem('sentinel','preserve')});
 await p.goto(base+'/cinematic-pilot.html?v=0.1.106');
 await p.locator('figure img').evaluate(img=>img.decode());
 const image=await p.locator('figure img').evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,source:img.currentSrc}));
 assert.deepEqual([image.width,image.height],[1672,941]);
 assert.match(await p.locator('figcaption').textContent(),/AINDA NÃO É O NOVO FILME/);
 assert.equal(await p.locator('video,canvas').count(),0);
 assert.equal(await p.evaluate(()=>window.__danteGame===undefined),true);
 report.checks.push('Whole-scene raster loads; explicit static-reference label; rejected movie not presented as current candidate');
 for(const [width,height]of [[1280,720],[1366,768],[1920,1080],[844,390]]){
  await p.setViewportSize({width,height});await p.evaluate(()=>scrollTo(0,0));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const r=await p.locator('figure img').boundingBox();assert.ok(r&&r.y>=0&&r.x>=0&&r.x+r.width<=width+.5&&r.y+r.height<=height);
  await p.screenshot({path:out+`/reference-${width}.png`});
 }
 report.checks.push('Four target resolutions: complete image fits, no horizontal overflow; touch opens historical disclosure');
 await p.locator('summary').last().tap();await p.locator('a[href$="bridge-pilot.mp4"]').waitFor({state:'visible'});
 const stores=await p.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
 assert.deepEqual(stores,{local:{sentinel:'preserve'},session:{sentinel:'preserve'}});
 report.checks.push('No character/campaign/save mutation; old MP4 is explicitly rejected history');
 assert.deepEqual(report.errors,[]);report.passed=true;report.image=image;
}catch(e){report.failure=String(e);throw e;}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
