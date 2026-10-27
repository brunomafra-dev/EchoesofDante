import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/permanence/qa/model';await mkdir(out,{recursive:true});
const built=await build({stdin:{contents:"export * from './src/systems/Missions';export * from './src/config/permanence';export * from './src/config/missions';export * from './src/systems/LocalJourney';export {characterProfiles} from './src/systems/CharacterProfiles';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.DEV':'false'}});
class Storage{data=new Map();fail=false;getItem(k){return this.data.get(k)??null}setItem(k,v){if(this.fail)throw Error('quota');this.data.set(k,String(v))}removeItem(k){this.data.delete(k)}}
globalThis.localStorage=new Storage();
const {Missions,MISSIONS,PERMANENCE_MISSIONS,PERMANENCE_SITES,LocalJourney,characterProfiles,JOURNEY_FLAGS}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const report={checks:[]};
try{
 const m=new Missions();assert.equal(m.status('settle-water'),'locked');assert.equal(m.act('accept','settle-water'),false);
 const core=['recon','survival','signal','beyond','water-source','safe-route','shelter'];m.restore({schema:1,accepted:core,completed:core,evidence:MISSIONS.filter(d=>core.includes(d.id)).flatMap(d=>d.goals.map(g=>g.id))});assert.equal(m.status('settle-water'),'available');
 let total=325;
 for(const d of PERMANENCE_MISSIONS){assert.equal(m.act('deliver',d.id),false);assert.ok(m.act('accept',d.id));assert.equal(m.act('accept',d.id),false);for(const g of d.goals)m.record(g.id);assert.equal(m.status(d.id),'ready');assert.ok(m.act('deliver',d.id));assert.equal(m.act('deliver',d.id),false);total+=d.credits;}
 assert.equal(m.claimable([]).credits,total);const n=new Missions();n.restore(m.snapshot());assert.deepEqual(n.snapshot(),m.snapshot());assert.equal(n.claimable(n.snapshot().completed).credits,0);report.checks.push('Original shelter prerequisite, ordered chapters, no premature/duplicate delivery and stable restore');
 for(const site of PERMANENCE_SITES){assert.ok(MISSIONS.some(d=>d.id===site.mission));assert.ok(site.radius>=50);for(const required of site.needs??[])assert.ok(MISSIONS.some(d=>d.goals.some(g=>g.id===required)));}
 const p=characterProfiles.create('Pioneira','astral','female',{mode:'solo',difficulty:'normal'});characterProfiles.select(p.id);const j=new LocalJourney();
 const old={schema:1,updatedAt:Date.now(),area:'base',hp:120,progression:{xp:350,echoes:[],sourceLocated:false,passageOpen:false,rewardedHollows:[],rewardedRoutes:[]},flags:Object.fromEntries(JOURNEY_FLAGS.map(k=>[k,false])),bestiary:{},valleyRoutes:[],valleyHabitats:[],aridHabitats:[],economy:{credits:100,materials:[1,2,3],potions:4,visited:['base']}};
 assert.ok(j.save(old));assert.equal(j.load().missions,undefined);assert.equal(j.load().progression.xp,350);const saved=j.load();saved.missions=m.snapshot();saved.missionRewards=core;assert.ok(j.save(saved));localStorage.fail=true;assert.equal(j.claimMissionRewards(),undefined);localStorage.fail=false;assert.equal(j.load().economy.credits,100);assert.equal(j.claimMissionRewards().credits,100+total-325);assert.equal(j.claimMissionRewards().credits,100+total-325);assert.equal(j.load().progression.xp,350);assert.deepEqual(j.load().economy.materials,[1,2,3]);report.checks.push('Legacy schema preserves story/resources; atomic credit+receipt retries after storage failure and never duplicates');
 report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await writeFile(out+'/model.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
