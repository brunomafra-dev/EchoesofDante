import{spawn}from'node:child_process';
const base=process.env.QA_BASE??'http://127.0.0.1:5193',root=process.env.QA_ROOT??'docs/frontier-3d/qa/0.1.195';
for(const[name,file]of[['crew','scripts/qa-arrival-crew195.mjs'],['looks','scripts/qa-arrival-looks194.mjs'],['identity-bridge','scripts/qa-arrival-identity193.mjs'],['camp-life','scripts/qa-arrival-camp-life.mjs'],['input','scripts/qa-arrival3d-input.mjs'],['workshop','scripts/qa-arrival-workshop.mjs'],['entry','scripts/qa-arrival-entry191.mjs'],['performance','scripts/qa-arrival3d-performance.mjs']]){
 if(process.env.QA_ONLY&&!process.env.QA_ONLY.split(',').includes(name))continue;console.log('ARRIVAL195',name);const code=await new Promise(resolve=>{const p=spawn(process.execPath,[file],{stdio:'inherit',env:{...process.env,QA_BASE:base,QA_VERSION:'0.1.195',QA_OUT:root+'/'+name}});p.on('exit',resolve);p.on('error',()=>resolve(1));});if(code!==0){process.exitCode=1;break;}
}
