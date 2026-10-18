import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const out=process.env.QA_OUT??'docs/complete-actors/revision-04/qa',base=process.env.QA_BASE??'http://localhost:5184';
await mkdir(out,{recursive:true});
// Freeze the rejected compositor for a real before/after comparison, not a
// reconstruction of what the new implementation is expected to draw.
const old=execFileSync('git',['show','6ad679e:src/visual/CompleteActorFrames.ts'],{encoding:'utf8'});
const oldJS=ts.transpileModule(old,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/^import .*;\r?$/gm,'').replace(/^export /gm,'');
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage({viewport:{width:1280,height:720}}),report={passed:false,errors:[],views:[]};
p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.url())});
try{
 await p.goto(base+'/character-cohesion.html?class=warrior&sex=female&kit=reinforced');
 await p.waitForFunction(()=>window.__danteGame?.scene.getScene('Game')?.player?.view.getData('completeActor'));
 const result=await p.evaluate(async oldJS=>{
  const s=window.__danteGame.scene.getScene('Game');s.scene.pause();
  const {composeCompleteAtlas,completeViewScale}=await import('/src/visual/CompleteActorFrames.ts');
  const {default:registration}=await import('/src/visual/actorRegistration.json');
  const before=Function('registration',oldJS+';return composeCompleteAtlas;')(registration),results=[];
  function area(c,row,scale){const d=c.getContext('2d').getImageData(0,row*192,192,192).data;let n=0;
   for(let y=0;y<183+(40-183)*scale;y++)for(let x=Math.ceil(96+(60-96)*scale);x<96+(132-96)*scale;x++)if(d[(y*192+x)*4+3]>80)n++;return n;}
  for(const [cls,sex]of [['warrior','female'],['hunter','male'],['hunter','female']])for(const style of ['none','basic','reinforced']){
   const sources=Object.fromEntries(['none','basic','reinforced'].map(t=>[t,s.textures.get(`complete-${cls}-${sex}-${t}`).getSourceImage()]));
   const look={helmet:style,torso:style,legs:style,boots:style,gloves:style},weapon=style==='none'?'starter':style==='basic'?'current':'advanced';
   const canvases=[before,composeCompleteAtlas].map(fn=>{const c=document.createElement('canvas');c.width=768;c.height=1536;fn(c.getContext('2d'),sources,look,weapon,cls,sex);return c;});
   const compare=document.createElement('canvas');compare.width=1152;compare.height=768;const ctx=compare.getContext('2d');ctx.fillStyle='#1b2b2d';ctx.fillRect(0,0,1152,768);
   const rows=cls==='hunter'?[0,1,7]:[2,4,7];
   for(let side=0;side<2;side++)for(let i=0;i<3;i++)for(let action=0;action<4;action++)ctx.drawImage(canvases[side],action*192,rows[i]*192,192,192,(side*3+i)*192,action*192,192,192);
   const metrics={cls,sex,style};
   if(cls==='hunter'){
    metrics.beforeRatios=rows.slice(1).map(row=>area(canvases[0],row,1)/area(canvases[0],0,1));
    metrics.afterRatios=rows.slice(1).map(row=>area(canvases[1],row,completeViewScale(cls,sex,row))/area(canvases[1],0,1));
    metrics.calibration=rows.map(row=>completeViewScale(cls,sex,row));
   }else{
    // Clean sky over E/N heads; old atlas has neighboring-cell strokes here.
    metrics.skyInk=[];
    for(const row of [2,4]){const pixels=canvases[1].getContext('2d').getImageData(60,row*192,80,19).data;metrics.skyInk.push(Array.from(pixels).filter((v,i)=>i%4===3&&v>64).length);}
    // Neck and torso must remain one connected silhouette in every action.
    metrics.connected=[];
    for(let row=0;row<8;row++)for(let col=0;col<4;col++){
     const pix=canvases[1].getContext('2d').getImageData(col*192,row*192,192,192).data,seen=new Uint8Array(192*192),q=[];
     for(let y=60;y<90&&!q.length;y++)for(let x=90;x<103&&!q.length;x++)if(pix[(y*192+x)*4+3]>32){seen[y*192+x]=1;q.push(y*192+x);}
     for(let i=0;i<q.length;i++){const k=q[i],x=k%192,y=Math.floor(k/192);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,j=yy*192+xx;if(xx>=0&&xx<192&&yy>=0&&yy<192&&!seen[j]&&pix[j*4+3]>32){seen[j]=1;q.push(j);}}}
     let total=0,joined=0;for(let y=24;y<44;y++)for(let x=76;x<116;x++){const k=y*192+x;if(pix[k*4+3]>32){total++;if(seen[k])joined++;}}
     metrics.connected.push({row,col,headFraction:joined/total});
    }
   }
   results.push({...metrics,image:compare.toDataURL()});
  }
  return results;
 },oldJS);
 for(const r of result){await writeFile(`${out}/${r.cls}-${r.sex}-${r.style}.png`,Buffer.from(r.image.split(',')[1],'base64'));delete r.image;
  if(r.cls==='hunter'){for(const n of r.afterRatios)assert.ok(n<=1.20&&n>=.72,JSON.stringify(r));assert.ok(Math.max(...r.afterRatios)<Math.max(...r.beforeRatios),JSON.stringify(r));}
  else{assert.ok(r.skyInk.every(n=>n===0),JSON.stringify(r.skyInk));assert.ok(r.connected.every(v=>v.headFraction>.98),JSON.stringify(r.connected.filter(v=>v.headFraction<=.98)));}
  report.views.push(r);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await b.close();await writeFile(out+'/head-scale.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,views:report.views.length,errors:report.errors}));}
