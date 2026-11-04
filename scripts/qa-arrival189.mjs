import {spawn} from 'node:child_process';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',root=process.env.QA_ROOT??'docs/frontier-3d/qa/0.1.189';
const stages=[
 ['grips','scripts/qa-arrival-grips189.mjs',{}],
 ['classes','scripts/qa-arrival3d.mjs',{QA_CLASSES_ONLY:'1'}],
 ['input','scripts/qa-arrival3d-input.mjs',{}],
 ['elements','scripts/qa-arrival3d-elements.mjs',{}],
 ['workshop','scripts/qa-arrival-workshop.mjs',{}],
 ['route','scripts/qa-arrival3d.mjs',{QA_ROUTE_ONLY:'1'}],
 ['performance','scripts/qa-arrival3d-performance.mjs',{}],
];
for(const [name,file,flags]of stages){
 console.log('ARRIVAL189',name);
 const code=await new Promise(resolve=>{const p=spawn(process.execPath,[file],{stdio:'inherit',env:{...process.env,QA_BASE:base,QA_OUT:root+'/'+name,QA_CLASSES_ONLY:'',QA_ROUTE_ONLY:'',...flags}});p.on('exit',resolve);p.on('error',()=>resolve(1));});
 if(code!==0){process.exitCode=1;break;}
}
