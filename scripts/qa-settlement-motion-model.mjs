import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out='docs/settlement-motion/qa/model';await mkdir(out,{recursive:true});
const built=await build({entryPoints:['src/systems/SettlementMotion.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {ResidentMotion,ResidentPresentation}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const bounds={left:0,right:1000,top:0,bottom:1000},report={checks:[]};
try{
 const run=hz=>{const p={x:100,y:100},m=new ResidentMotion(2);m.mode='walk';let previous=0;for(let i=0;i<hz*3;i++){m.step(p,{x:800,y:100},1/hz,true,[],bounds,i/hz*1000);assert.ok(m.speed-previous<=91/hz);previous=m.speed}return{...p,speed:m.speed,gait:m.gait}};
 const a=run(30),b=run(60);assert.ok(Math.abs(a.x-b.x)<.6);assert.ok(Math.abs(a.gait-b.gait)<.03);
 const p={x:100,y:100},m=new ResidentMotion(0);m.mode='walk';for(let i=0;i<10;i++)m.step(p,{x:800,y:100},1/60,true,[],bounds,i*1000/60);assert.ok(m.speed>5&&m.speed<20);for(let i=0;i<20;i++)m.brake(p,1/60,[],bounds);assert.equal(m.speed,0);report.checks.push('Acceleration/braking are gradual; distance-based gait agrees at 30/60 Hz and stops with the body');
 const q={x:100,y:300},n=new ResidentMotion(1),obstacles=[{x:180,y:300,radius:30}];for(let i=0;i<600;i++){n.step(q,{x:450,y:300},1/60,true,obstacles,bounds,i*1000/60);assert.ok(Math.hypot(q.x-180,q.y-300)>=43.9)}assert.ok(q.x>220);report.checks.push('Steering passes a solid without entering its footprint');
 const buffer=new ResidentPresentation(),values=[];let packet=0;for(let t=0;t<3000;t+=1000/60){if(t>=packet*100){buffer.push({time:1000+packet*100,x:100+packet*3,y:200,frame:packet%8,flip:false},t);packet++;}const s=buffer.at(t);if(s)values.push(s.x)}const deltas=values.slice(1).map((v,i)=>v-values[i]);assert.ok(Math.max(...deltas)<1.1);assert.ok(deltas.filter(v=>v>.1).length>values.length*.8);assert.ok(Math.abs(buffer.at(3000).x-187)<5);const last=buffer.at(5000).x;assert.equal(buffer.at(10000).x,last);report.checks.push('100 ms network samples render continuously between packets and freeze safely when packets stop');
 const jitter=new ResidentPresentation(),shown=[];let sent=-1;for(let t=0;t<3500;t+=1000/60){const index=Math.floor(t/100);if(index!==sent&&!(t>900&&t<1300)){jitter.push({time:1000+index*100,x:100+index*3,y:200,frame:index%8,flip:false},t);sent=index}const sample=jitter.at(t);if(sample)shown.push(sample.x)}assert.ok(Math.max(...shown.slice(1).map((v,i)=>v-shown[i]))<1.1);report.checks.push('A 400 ms packet interruption catches up without a position step on return');
 report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(report)}
