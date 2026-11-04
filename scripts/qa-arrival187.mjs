import{spawn}from'node:child_process';
process.env.QA_ROOT??='docs/frontier-3d/qa/0.1.187';
await import('./qa-arrival186.mjs');
if(!process.exitCode){const code=await new Promise(resolve=>{const child=spawn(process.execPath,['scripts/qa-arrival-creatures.mjs'],{stdio:'inherit',env:{...process.env,QA_BASE:process.env.QA_BASE??'http://127.0.0.1:5193',QA_OUT:process.env.QA_ROOT+'/creatures'}});child.on('exit',resolve);child.on('error',()=>resolve(1));});if(code!==0)process.exitCode=1;}
