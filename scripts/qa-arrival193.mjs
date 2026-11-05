import{spawn}from'node:child_process';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',root=process.env.QA_ROOT??'docs/frontier-3d/qa/0.1.193';
for(const[name,file,flags]of[
 ['identity-bridge','scripts/qa-arrival-identity193.mjs',{}],
 ['visual','scripts/qa-arrival-visual192.mjs',{}],
 ['motion-damage','scripts/qa-arrival-motion192.mjs',{}],
 ['route','scripts/qa-arrival3d.mjs',{QA_ROUTE_ONLY:'1'}],
 ['input','scripts/qa-arrival3d-input.mjs',{}],
 ['elements','scripts/qa-arrival3d-elements.mjs',{}],
 ['workshop','scripts/qa-arrival-workshop.mjs',{}],
 ['entry','scripts/qa-arrival-entry191.mjs',{QA_VERSION:'0.1.193'}],
 ['performance','scripts/qa-arrival3d-performance.mjs',{}],
]){if(process.env.QA_ONLY&&!process.env.QA_ONLY.split(',').includes(name))continue;console.log('ARRIVAL193',name);const code=await new Promise(resolve=>{const p=spawn(process.execPath,[file],{stdio:'inherit',env:{...process.env,QA_BASE:base,QA_VERSION:'0.1.193',QA_OUT:root+'/'+name,QA_ROUTE_ONLY:'',QA_CLASSES_ONLY:'',...flags}});p.on('exit',resolve);p.on('error',()=>resolve(1));});if(code!==0){process.exitCode=1;break;}}
