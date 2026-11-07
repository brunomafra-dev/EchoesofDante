import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const base='https://echosofdante.vercel.app',out='docs/2d-refinement/qa/203/publication-hashes.json';
const queued=new Set(['index.html','campaign-playtest.html','character-playtest.html','character-cohesion.html','test-library.html']);
for(const profession of ['warrior','astral','xenobinder'])for(const sex of ['female','male'])for(const style of ['none','basic','reinforced'])queued.add(`assets/visual/complete-actors/cross/hunter-${profession}-${sex}-${style}-v1.png`);
const files=[];
for(const file of queued){const data=await readFile('dist/'+file);files.push([file,data]);if(/\.(html|js)$/.test(file))for(const match of data.toString().matchAll(/(?:\.\/|assets\/)([A-Za-z0-9_.-]+\.(?:js|css))/g))queued.add('assets/'+match[1]);}
function canonical(data,file){return file.endsWith('.html')?Buffer.from(data.toString().replace(/\r\n?/g,'\n').split('\n').filter(line=>line.trim()).join('\n')+'\n'):data;}
const hash=data=>createHash('sha256').update(data).digest('hex'),report={passed:false,version:'0.1.203',base,at:new Date().toISOString(),htmlCanonicalization:'CR/CRLF to LF; discard whitespace-only empty lines. JS/CSS/PNG compared byte for byte.',files:[],errors:[]};
const work=[...files];async function worker(){for(;;){const pair=work.shift();if(!pair)return;const[file,local]=pair;try{const response=await fetch(base+'/'+file,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(40000)});if(!response.ok)throw Error(response.status+' '+file);const remote=Buffer.from(await response.arrayBuffer()),sha256=hash(canonical(local,file));if(hash(canonical(remote,file))!==sha256){if(file==='index.html'){await writeFile('.local/index-local-canonical.html',canonical(local,file));await writeFile('.local/index-public-canonical.html',canonical(remote,file));}throw Error('Hash mismatch '+file);}report.files.push({file,bytes:remote.length,sha256});}catch(e){report.errors.push(String(e));}}}
await Promise.all([worker(),worker(),worker(),worker()]);report.passed=report.errors.length===0;await mkdir(path.dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log('Public hashes',report.passed,report.files.length,report.errors);if(!report.passed)process.exitCode=1;
