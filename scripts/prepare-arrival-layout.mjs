// Snapshot the approved layout without importing campaign modules into the 3D bundle.
import ts from 'typescript';
import {readFile,writeFile,mkdir}from'node:fs/promises';
import {createHash}from'node:crypto';
const modules={};const sources={};
for(const name of['base','forest','earlyJourney','discovery','classes','game']){const source=await readFile('src/config/'+name+'.ts','utf8');sources[name]=createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;modules[name]=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));}
const {BASE}=modules.base,f=modules.forest,e=modules.earlyJourney,d=modules.discovery;
const data={scale:40,sources,base:BASE,forest:{size:e.FOREST_SIZE,contour:e.FOREST_CONTOUR,entry:f.FOREST_ENTRY,paths:[...f.FOREST_PATHS,...e.FOREST_BRANCH_PATHS],clearings:[...f.FOREST_CLEARINGS,...e.FOREST_BRANCH_CLEARINGS],rocks:f.FOREST_ROCKS,spawns:f.FOREST_SPAWNS,landmarks:e.EARLY_LANDMARKS.forest},discovery:d,classes:modules.classes,combat:modules.game};
await mkdir('src/experiments/arrival-3d',{recursive:true});await writeFile('src/experiments/arrival-3d/layout.json',JSON.stringify(data,null,2)+'\n');console.log('Canonical base/forest paths, contour, stations, discoveries and four class values snapshotted.');
