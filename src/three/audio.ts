import * as Tone from 'tone';

// Sound for the new 3D: synthesized effects (Tone.js), a wind/lava/water/fire bed per region,
// and the 2D soundtrack (public/assets/audio) streamed per region and per boss.
export type Sfx='swing'|'slashHit'|'shot'|'charge'|'beam'|'fire'|'water'|'earth'|'energy'|'filament'|'dash'|'hurt'|'hit'|'death'|'spit'|'warn'|'roar'|'portal'|'bite'|'twist'|'heal'|'ui'|'step';
const MUSIC:Record<string,string>={camp:'base-journey.mp3',springs:'springs-journey.mp3',valley:'valley-journey.mp3',caldera:'caldera-journey.mp3',frost:'frost-journey.mp3',dunes:'sirocco-journey.mp3',domain:'warden-journey.mp3',
 titan:'titan-journey.mp3',vesper:'vesper-journey.mp3',soterrado:'soterrado-journey.mp3',warden:'warden-journey.mp3'};
type Voices=ReturnType<typeof makeVoices>;
function makeVoices(out:Tone.ToneAudioNode){
 const verb=new Tone.Reverb({decay:2.2,wet:.22}).connect(out);
 const bus=new Tone.Gain(1).connect(verb);
 const noise=(type:'white'|'pink'|'brown',a:number,d:number,filter:Tone.Filter)=>{const n=new Tone.NoiseSynth({noise:{type},envelope:{attack:a,decay:d,sustain:0,release:.05}});n.connect(filter);return n;};
 const bp=(f:number,q=1.2)=>new Tone.Filter({type:'bandpass',frequency:f,Q:q}).connect(bus);
 const lp=(f:number)=>new Tone.Filter({type:'lowpass',frequency:f}).connect(bus);
 const hp=(f:number)=>new Tone.Filter({type:'highpass',frequency:f}).connect(bus);
 const swingF=bp(1800,.9),swing=noise('pink',.005,.2,swingF);
 const dashF=lp(1400),dash=noise('pink',.02,.28,dashF);
 const metal=new Tone.MetalSynth({envelope:{attack:.001,decay:.18,release:.05},harmonicity:5.1,modulationIndex:22,resonance:3200,octaves:1.2}).connect(bus);metal.volume.value=-14;
 const click=noise('white',.001,.04,hp(2500));
 const zap=new Tone.FMSynth({harmonicity:3,modulationIndex:14,envelope:{attack:.002,decay:.12,sustain:0,release:.05},modulationEnvelope:{attack:.002,decay:.1,sustain:0,release:.05}}).connect(bus);zap.volume.value=-8;
 const riser=new Tone.Synth({oscillator:{type:'sawtooth'},envelope:{attack:.05,decay:.1,sustain:.8,release:.15}}).connect(lp(2400));riser.volume.value=-16;
 const boom=new Tone.MembraneSynth({pitchDecay:.08,octaves:5,envelope:{attack:.001,decay:.5,sustain:0,release:.2}}).connect(bus);boom.volume.value=-4;
 const rumbleF=lp(500),rumble=noise('brown',.01,.7,rumbleF);
 const crackleF=hp(1800),crackle=noise('white',.001,.03,crackleF);
 const blip=new Tone.Synth({oscillator:{type:'sine'},envelope:{attack:.002,decay:.08,sustain:0,release:.03}}).connect(bus);blip.volume.value=-10;
 const soft=new Tone.Synth({oscillator:{type:'triangle'},envelope:{attack:.01,decay:.15,sustain:0,release:.1}}).connect(bus);soft.volume.value=-12;
 const thud=new Tone.MembraneSynth({pitchDecay:.03,octaves:3,envelope:{attack:.001,decay:.18,sustain:0,release:.05}}).connect(bus);thud.volume.value=-8;
 const squelchF=lp(900),squelch=noise('pink',.01,.4,squelchF);
 const growl=new Tone.Synth({oscillator:{type:'fatsawtooth',count:3,spread:30},envelope:{attack:.08,decay:.4,sustain:.6,release:.5}}).connect(lp(700));growl.volume.value=-10;
 const chime=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:.005,decay:.6,sustain:0,release:.4}}).connect(bus);chime.volume.value=-14;
 const beep=new Tone.Synth({oscillator:{type:'triangle'},envelope:{attack:.005,decay:.12,sustain:0,release:.05}}).connect(bus);beep.volume.value=-22;
 return {bus,swing,swingF,dash,dashF,metal,click,zap,riser,boom,rumble,rumbleF,crackle,blip,soft,thud,squelch,squelchF,growl,chime,beep};
}

export class Sound{
 musicOn=true;sfxOn=true;private ready=false;private v!:Voices;private master!:Tone.Gain;private last=new Map<string,number>();
 private tracks:[HTMLAudioElement,HTMLAudioElement]=[new Audio(),new Audio()];private cur=0;private curUrl='';
 private bed:{n:Tone.Noise;f:Tone.Filter;g:Tone.Gain;lfo:Tone.LFO}|null=null;private hum:Tone.Oscillator|null=null;
 constructor(){
  for(const t of this.tracks){t.loop=true;t.volume=0;t.preload='auto';}
  try{const s=JSON.parse(localStorage.getItem('dante3d.audio')??'{}');this.musicOn=s.music??true;this.sfxOn=s.sfx??true;}catch{/* ignore */}
  const unlock=()=>{void this.unlock();removeEventListener('pointerdown',unlock);removeEventListener('keydown',unlock);};
  addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);
 }
 private save(){try{localStorage.setItem('dante3d.audio',JSON.stringify({music:this.musicOn,sfx:this.sfxOn}));}catch{/* ignore */}}
 async unlock(){
  if(this.ready)return;await Tone.start();
  this.master=new Tone.Gain(this.sfxOn?.9:0).toDestination();this.v=makeVoices(this.master);this.ready=true;
  if(this.curUrl)this.playTrack(this.curUrl,true);if(this.pendingBed)this.ambient(this.pendingBed);
 }
 toggleMusic(){this.musicOn=!this.musicOn;this.save();const t=this.tracks[this.cur];if(this.musicOn){void t.play().catch(()=>{});this.fade(t,.45);}else this.fade(t,0);}
 /** lowers the music while a film plays, and brings it back */
 hush(on:boolean){const t=this.tracks[this.cur];if(!this.musicOn)return;if(on)this.fade(t,0,()=>t.pause());else{void t.play().catch(()=>{});this.fade(t,.45);}}
 toggleSfx(){this.sfxOn=!this.sfxOn;this.save();if(this.ready)this.master.gain.rampTo(this.sfxOn?.9:0,.2);}
 // ---------- music ----------
 music(key:string){const f=MUSIC[key];if(!f)return;const url=import.meta.env.BASE_URL+'assets/audio/'+f;if(url===this.curUrl)return;this.curUrl=url;if(this.ready)this.playTrack(url,false);}
 private playTrack(url:string,force:boolean){
  const old=this.tracks[this.cur],next=this.tracks[1-this.cur];
  if(!force&&old.src.endsWith(url))return;
  next.src=url;next.currentTime=0;next.volume=0;this.cur=1-this.cur;
  if(this.musicOn){void next.play().catch(()=>{});this.fade(next,.45);}
  this.fade(old,0,()=>old.pause());
 }
 private fade(a:HTMLAudioElement,to:number,done?:()=>void){const from=a.volume,t0=performance.now(),d=1500;const step=()=>{const k=Math.min(1,(performance.now()-t0)/d);a.volume=from+(to-from)*k;if(k<1)requestAnimationFrame(step);else done?.();};step();}
 // ---------- ambient bed per region ----------
 private pendingBed='';
 ambient(kind:string){
  this.pendingBed=kind;if(!this.ready)return;
  if(this.bed){const b=this.bed;b.g.gain.rampTo(0,1);setTimeout(()=>{b.n.stop();b.lfo.stop();b.n.dispose();b.f.dispose();b.g.dispose();b.lfo.dispose();},1200);this.bed=null;}
  if(this.hum){const h=this.hum;h.volume.rampTo(-80,1);setTimeout(()=>{h.stop();h.dispose();},1200);this.hum=null;}
  const cfg:Record<string,[('white'|'pink'|'brown'),BiquadFilterType,number,number,number]>={
   camp:['white','highpass',2400,.035,9],springs:['pink','bandpass',1800,.05,.3],valley:['pink','bandpass',600,.06,.15],caldera:['brown','lowpass',180,.22,.25],
   frost:['pink','bandpass',900,.09,.12],dunes:['pink','bandpass',1300,.08,.2],domain:['brown','lowpass',220,.12,.1]};
  const c=cfg[kind];if(!c)return;
  const g=new Tone.Gain(0).connect(this.master),f=new Tone.Filter({type:c[1],frequency:c[2],Q:.7}).connect(g);
  const n=new Tone.Noise(c[0]).connect(f);n.start();
  // wind gusts / flicker: an LFO moves the filter (or the level for the campfire crackle)
  const lfo=new Tone.LFO(c[4],c[2]*.6,c[2]*1.5);lfo.connect(f.frequency);lfo.start();
  g.gain.rampTo(c[3],2);this.bed={n,f,g,lfo};
  if(kind==='domain'||kind==='caldera'){const h=new Tone.Oscillator(kind==='domain'?55:41,'sine').connect(this.master);h.volume.value=-80;h.start();h.volume.rampTo(kind==='domain'?-26:-30,2);this.hum=h;}
 }
 // ---------- effects ----------
 play(name:Sfx,dist=0){
  if(!this.ready||!this.sfxOn)return;
  const now=Tone.now(),k=performance.now(),gap=name==='hit'||name==='slashHit'?45:name==='warn'?120:25;
  if((this.last.get(name)??0)>k-gap)return;this.last.set(name,k);
  const att=Math.max(0,1-dist/26);if(att<=.03)return;const db=Tone.gainToDb(att);const v=this.v;
  const r=(a:number,b:number)=>a+Math.random()*(b-a);
  try{
  switch(name){
   case 'swing':v.swingF.frequency.setValueAtTime(r(2600,3200),now);v.swingF.frequency.exponentialRampToValueAtTime(500,now+.2);v.swing.volume.value=db-6;v.swing.triggerAttackRelease(.2,now);break;
   case 'twist':for(let i=0;i<4;i++){const t=now+i*.17;v.swingF.frequency.setValueAtTime(3000,t);v.swingF.frequency.exponentialRampToValueAtTime(600,t+.16);v.swing.triggerAttackRelease(.16,t);}break;
   case 'slashHit':v.metal.volume.value=db-16;v.metal.triggerAttackRelease(r(300,420),.12,now);v.thud.volume.value=db-10;v.thud.triggerAttackRelease('G2',.1,now);break;
   case 'hit':v.thud.volume.value=db-10;v.thud.triggerAttackRelease(r(70,110),.12,now);v.click.volume.value=db-20;v.click.triggerAttackRelease(.03,now);break;
   case 'shot':v.zap.volume.value=db-10;v.zap.triggerAttackRelease(r(900,1100),.1,now);v.zap.frequency.exponentialRampToValueAtTime(140,now+.12);break;
   case 'charge':v.riser.volume.value=db-14;v.riser.triggerAttack(90,now);v.riser.frequency.exponentialRampToValueAtTime(700,now+.55);v.riser.triggerRelease(now+.6);break;
   case 'beam':v.boom.volume.value=db-2;v.boom.triggerAttackRelease('C1',.6,now);v.rumbleF.frequency.value=1600;v.rumble.volume.value=db-4;v.rumble.triggerAttackRelease(.8,now);v.zap.triggerAttackRelease(220,.5,now);break;
   case 'fire':v.rumbleF.frequency.value=900;v.rumble.volume.value=db-6;v.rumble.triggerAttackRelease(.4,now);for(let i=0;i<6;i++){v.crackle.volume.value=db-14;v.crackle.triggerAttackRelease(.02,now+r(0,.35));}break;
   case 'water':for(let i=0;i<4;i++){const t=now+i*.06;v.blip.volume.value=db-10;v.blip.triggerAttackRelease(r(500,900),.06,t);v.blip.frequency.exponentialRampToValueAtTime(r(1200,1800),t+.05);}break;
   case 'earth':v.boom.volume.value=db-4;v.boom.triggerAttackRelease(r(40,55),.4,now);v.rumbleF.frequency.value=400;v.rumble.volume.value=db-6;v.rumble.triggerAttackRelease(.35,now);break;
   case 'energy':v.zap.volume.value=db-8;v.zap.triggerAttackRelease(r(1800,2400),.08,now);v.click.volume.value=db-12;v.click.triggerAttackRelease(.05,now);break;
   case 'filament':v.soft.volume.value=db-12;v.soft.triggerAttackRelease(r(500,600),.12,now);v.soft.frequency.exponentialRampToValueAtTime(1100,now+.1);break;
   case 'dash':v.dashF.frequency.setValueAtTime(600,now);v.dashF.frequency.exponentialRampToValueAtTime(2400,now+.25);v.dash.volume.value=db-8;v.dash.triggerAttackRelease(.28,now);break;
   case 'hurt':v.thud.volume.value=db-4;v.thud.triggerAttackRelease('D1',.25,now);v.growl.volume.value=db-24;v.growl.triggerAttackRelease(110,.12,now);break;
   case 'bite':v.click.volume.value=db-10;v.click.triggerAttackRelease(.04,now);v.thud.volume.value=db-12;v.thud.triggerAttackRelease('A2',.08,now);break;
   case 'death':v.squelchF.frequency.setValueAtTime(1200,now);v.squelchF.frequency.exponentialRampToValueAtTime(150,now+.5);v.squelch.volume.value=db-6;v.squelch.triggerAttackRelease(.5,now);v.growl.volume.value=db-16;v.growl.triggerAttack(180,now);v.growl.frequency.exponentialRampToValueAtTime(60,now+.5);v.growl.triggerRelease(now+.5);break;
   case 'spit':v.blip.volume.value=db-8;v.blip.triggerAttackRelease(500,.1,now);v.blip.frequency.exponentialRampToValueAtTime(150,now+.1);v.squelchF.frequency.value=1500;v.squelch.volume.value=db-14;v.squelch.triggerAttackRelease(.12,now);break;
   case 'warn':v.beep.volume.value=db-22;v.beep.triggerAttackRelease(220,.08,now);v.beep.triggerAttackRelease(165,.1,now+.1);break;
   case 'roar':v.growl.volume.value=db-4;v.growl.triggerAttack(140,now);v.growl.frequency.exponentialRampToValueAtTime(45,now+1.4);v.growl.triggerRelease(now+1.5);v.rumbleF.frequency.value=300;v.rumble.volume.value=db-2;v.rumble.triggerAttackRelease(1.4,now);break;
   case 'portal':v.chime.volume.value=db-12;['C5','G5','D6','A6'].forEach((n,i)=>v.chime.triggerAttackRelease(n,.6,now+i*.07));break;
   case 'heal':v.chime.volume.value=db-12;['E5','G#5','B5'].forEach((n,i)=>v.chime.triggerAttackRelease(n,.5,now+i*.08));break;
   case 'ui':v.soft.volume.value=-22;v.soft.triggerAttackRelease(880,.04,now);break;
   case 'step':break;
  }
  }catch{/* a voice can refuse overlapping events; skip it */}
 }
}
