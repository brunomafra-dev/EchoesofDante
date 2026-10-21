import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.QA_OUT??'docs/arrival-missions/qa';await mkdir(out,{recursive:true});
const bundled=await build({stdin:{contents:"export * from './src/systems/Missions';export * from './src/systems/LocalJourney';export {characterProfiles} from './src/systems/CharacterProfiles';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.DEV':'false'}});
class MemoryStorage{data=new Map();fail=false;getItem(k){return this.data.get(k)??null}setItem(k,v){if(this.fail)throw Error('Quota');this.data.set(k,String(v))}removeItem(k){this.data.delete(k)}}
globalThis.localStorage=new MemoryStorage();
const {Missions,validMissions,LocalJourney,characterProfiles,JOURNEY_FLAGS}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const report={checks:[]},check=s=>{console.log(s);report.checks.push(s)};
try{
 const m=new Missions();assert.equal(m.status('recon'),'available');assert.equal(m.status('survival'),'locked');assert.equal(m.act('deliver','recon'),false);assert.equal(m.act('accept','signal'),false);
 assert.equal(m.act('accept','recon'),true);assert.equal(m.act('accept','recon'),false);m.record('roots');m.record('clearing');assert.equal(m.status('recon'),'ready');assert.equal(m.npcState('expedition'),'ready');
 assert.equal(m.act('deliver','recon'),true);assert.equal(m.act('deliver','recon'),false);assert.equal(m.status('survival'),'available');assert.equal(m.current,'survival');check('Prerequisites, acceptance, derived readiness, turn-in, automatic tracking and duplicate rejection');
 m.observe({echoes:3,passage:true,firstEcho:true,warden:true});m.record('water');m.record('biology');
 for(const id of ['survival','signal','beyond']){assert.ok(m.act('accept',id));assert.equal(m.status(id),'ready');assert.ok(m.act('deliver',id));}
 assert.equal(m.current,undefined);assert.deepEqual(m.claimable([]),{ids:['recon','survival','signal','beyond'],credits:150});assert.equal(m.claimable(['recon','survival','signal','beyond']).credits,0);check('Pre-existing discoveries satisfy later accepted missions; total bounded reward is 150 credits');
 for(const raw of [null,5,{},[],{accepted:3,completed:'oops',evidence:{}},{accepted:['beyond'],completed:['beyond'],evidence:['invalid'] }])assert.deepEqual(validMissions(raw),{schema:1,accepted:[],completed:[],evidence:[]});
 const clean=validMissions({...m.snapshot(),accepted:[...m.snapshot().accepted,'fake','recon'],evidence:['water','water','fake']});assert.deepEqual(clean.evidence,['water']);assert.equal(clean.accepted.length,4);check('Malformed/unknown fields are bounded and prerequisites normalized');
 const profile=characterProfiles.create('Pioneira','astral','female',{mode:'solo',difficulty:'normal'});assert.ok(profile);assert.ok(characterProfiles.select(profile.id));
 const journey=new LocalJourney();const flags=Object.fromEntries(JOURNEY_FLAGS.map(k=>[k,true]));
 const legacy={schema:1,updatedAt:Date.now(),area:'warden',hp:85,progression:{xp:800,echoes:['northern-ruin','mineral-signal','unknown-trace'],sourceLocated:true,passageOpen:true,rewardedHollows:[],rewardedRoutes:[]},flags,bestiary:{},valleyRoutes:[],valleyHabitats:[],aridHabitats:[],economy:{credits:90,materials:[5,6,7],potions:3,visited:['base','forest','cavern','warden']}};
 assert.ok(journey.save(legacy));const loaded=journey.load();assert.ok(loaded.flags.wardenDefeated);assert.equal(loaded.missions,undefined);assert.equal(loaded.progression.xp,800);check('Legacy campaign preserves Warden, access and personal progression without inventing mission rewards');
 loaded.missions=m.snapshot();assert.ok(journey.save(loaded));
 localStorage.fail=true;assert.equal(journey.claimMissionRewards(),undefined);localStorage.fail=false;assert.equal(journey.load().economy.credits,90);assert.deepEqual(journey.load().missionRewards,[]);
 assert.equal(journey.claimMissionRewards().credits,240);assert.equal(journey.claimMissionRewards().credits,240);assert.equal(journey.load().missionRewards.length,4);assert.deepEqual(journey.load().economy.materials,[5,6,7]);assert.equal(journey.load().progression.xp,800);check('Credit + receipt is atomic; storage failure retries, repeated claims/reload do not duplicate rewards');
 report.passed=true;
}catch(e){report.failure=String(e);throw e}finally{await writeFile(out+'/model.json',JSON.stringify(report,null,2));}
