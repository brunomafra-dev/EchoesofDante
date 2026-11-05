import{fresh,defaults,type Trial}from'./model';
import{validMissions}from'../../systems/Missions';
export const lab=new URLSearchParams(location.search).get('lab');
export const reviewLab=lab==='cavern'||lab==='warden';
export const sessionKey=reviewLab?'dante.arrival3d.review196.'+lab:'dante.arrival3d.v1';
export function labTrial():Trial{const t=fresh();t.hero=defaults();t.hero.name='Explorador do laboratório';t.echoes=['northern-ruin','mineral-signal','unknown-trace'];t.source=t.mechanism=true;t.zone=lab==='warden'?'warden':'cavern';t.journey.missions=validMissions({schema:1,accepted:['recon','survival','signal','beyond','exp-cavern'],completed:['recon','survival','signal'],evidence:['clearing','roots','water','biology','echo1','echo2','echo3','passage']});t.journey.receipts=['recon','survival','signal'];t.journey.credits=90;t.journey.tracked='beyond';if(lab==='warden'){t.journey.depth=t.journey.deepSignal=t.journey.fragment=t.journey.firstEcho=t.journey.gate=true;t.journey.checkpoint='echo';}return t;}
