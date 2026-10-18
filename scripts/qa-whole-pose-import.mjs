import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import ts from 'typescript';
import {chromium} from 'playwright';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const out=process.env.QA_OUT??'docs/complete-actors/revision-05/pose-qa';
const base=process.env.QA_BASE??'http://localhost:5184',ref='c57d61f';
await mkdir(out,{recursive:true});
const show=path=>execFileSync('git',['show',`${ref}:${path}`],{maxBuffer:32*1024*1024});
const oldJS=ts.transpileModule(show('src/visual/CompleteActorFrames.ts').toString(),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import .*;\r?$/gm,'').replace(/^export /gm,'');
const old={js:oldJS,registration:JSON.parse(show('src/visual/actorRegistration.json')),heads:JSON.parse(show('src/visual/warriorFemaleHeads.json')),images:{}};
for(const actor of ['warrior-female','hunter-male','hunter-female'])for(const style of ['none','basic','reinforced'])old.images[`${actor}-${style}`]='data:image/png;base64,'+show(`public/assets/visual/complete-actors/${actor}-${style}.png`).toString('base64');
const browser=await chromium.launch({channel:'chrome',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),report={passed:false,baseline:ref,errors:[],cases:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.url());});
try{
 await page.goto(base+'/character-cohesion.html?class=warrior&sex=female&kit=clothes',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
 const results=await page.evaluate(async old=>{
  const s=window.__danteGame.scene.getScene('Game');s.scene.pause();
  const {composeCompleteAtlas,completeRegistration}=await import('/src/visual/CompleteActorFrames.ts');
  const before=Function('registration','warriorFemaleHeads',old.js+';return composeCompleteAtlas;')(old.registration,old.heads);
  const previous={};for(const [key,url]of Object.entries(old.images)){const image=new Image();image.src=url;await image.decode();previous[key]=image;}
  const results=[];
  for(const [cls,sex,rows]of [['warrior','female',[0,1,2,7]],['hunter','male',[7]],['hunter','female',[7]]])for(const style of ['none','basic','reinforced']){
   const actor=`${cls}-${sex}`,tiers=['none','basic','reinforced'];
   const sources=Object.fromEntries(tiers.map(t=>[t,s.textures.get(`complete-${actor}-${t}`).getSourceImage()]));
   const oldSources=Object.fromEntries(tiers.map(t=>[t,previous[`${actor}-${t}`]]));
   const look={helmet:style,torso:style,legs:style,boots:style,gloves:style},weapon=style==='none'?'starter':style==='basic'?'current':'advanced';
   const atlases=[before,composeCompleteAtlas].map((fn,i)=>{const c=document.createElement('canvas');c.width=768;c.height=1536;fn(c.getContext('2d'),i?sources:oldSources,look,weapon,cls,sex);return c;});
   for(const row of rows){
    const comparison=document.createElement('canvas');comparison.width=768;comparison.height=420;const ctx=comparison.getContext('2d');
    ctx.fillStyle='#213133';ctx.fillRect(0,0,768,420);ctx.fillStyle='#e2e9dc';ctx.font='16px sans-serif';ctx.fillText('0.1.114',18,22);ctx.fillText('0.1.115',402,22);
    for(let i=0;i<2;i++)ctx.drawImage(atlases[i],384,row*192,192,192,i*384,30,384,384);
    const raw=document.createElement('canvas');raw.width=raw.height=192;const rc=raw.getContext('2d'),p=completeRegistration(cls,sex,style,row*4+2);
    rc.translate(p.x,p.y);rc.scale(p.scale,p.scale);rc.drawImage(sources[style],384,row*192,192,192,0,0,192,192);
    const a=atlases[1].getContext('2d').getImageData(384,row*192,192,192).data,b=rc.getImageData(0,0,192,192).data;
    // Below the head, dressing must preserve the authored whole silhouette.
    let bodyAlphaMismatch=0,opaque=0;
    for(let y=60;y<192;y++)for(let x=0;x<192;x++){const k=(y*192+x)*4+3;if(a[k]!==b[k])bodyAlphaMismatch++;if(a[k]>128)opaque++;}
    results.push({actor,style,row,frame:row*4+2,bodyAlphaMismatch,opaque,image:comparison.toDataURL()});
   }
  }
  return results;
 },old);
 for(const r of results){await writeFile(`${out}/${r.actor}-${r.style}-${r.row}.png`,Buffer.from(r.image.split(',')[1],'base64'));delete r.image;report.cases.push(r);assert.equal(r.bodyAlphaMismatch,0,JSON.stringify(r));assert.ok(r.opaque>2000,JSON.stringify(r));}
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.errors}));}
