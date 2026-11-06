// Browser-local native gamepad driver: avoids CDP latency becoming held movement.
// Reads diagnostics and writes only the mock Gamepad axes/buttons, never game state.
export async function driveFight(p){return p.evaluate(()=>new Promise(resolve=>{
 const start=performance.now(),history=[],damage=[],phases=[],attacks=new Set();let oldState='',oldHp,oldPhase=0,last=0,charging=false,dodgeAt=-10,potion=false,done=false;
 const blocked=(s,x,z)=>s.solids.some(o=>o.zone==='warden'&&Math.hypot(x-o.x,z-o.z)<o.radius+.48);
 const button=(i,on)=>{window.__qaPad.buttons[i]={pressed:on,value:on?1:0};};
 function frame(now){if(done)return;const s=window.__arrivalJourney(),b=s.boss,id=s.trial.hero.classId,t=(now-start)/1000;if(now-last<65){requestAnimationFrame(frame);return;}last=now;
  if(b.state!==oldState){history.push({state:b.state,attack:b.attack,hp:b.hp,hero:s.trial.hp,position:s.position,boss:b.position});oldState=b.state;}
  if(b.phase!==oldPhase){phases.push(b.phase);oldPhase=b.phase;}if(b.attack)attacks.add(b.attack);if(oldHp!==undefined&&s.trial.hp<oldHp)damage.push({damage:oldHp-s.trial.hp,attack:b.attack,at:b.active});oldHp=s.trial.hp;
  if(!s.trial.hp||s.trial.journey.warden||t>240){done=true;window.__qaPad.axes=[0,0,0,0];for(let i=0;i<17;i++)button(i,false);resolve({frames:history,damage,phases,attacks:[...attacks],result:{hp:s.trial.hp,potions:s.trial.potions,boss:b.hp,won:s.trial.journey.warden,seconds:t,timeout:t>240}});return;}
  const px=s.position[0],pz=s.position[2],bx=b.position[0],bz=b.position[2],dx=px-bx,dz=pz-bz,dist=Math.hypot(dx,dz),angle=Math.atan2(dz,dx),vulnerable=b.state==='RECOVER'&&b.exposed;
  let radius=id==='astral'?9:id==='hunter'?5:2.22,extra=.13;
  if(b.state==='TELEGRAPH'||b.state==='EXECUTE'){radius=b.attack==='slam'?9.8:b.attack==='sweep'?5.65:b.attack==='signal'?7:b.attack==='echoes'?6:5;extra=b.attack==='rush'?.8:.28;}
  if(vulnerable)extra=0;
  let target,score=Infinity;
  for(let i=-16;i<=16;i++){const a=angle+extra+i*Math.PI/24,x=bx+Math.cos(a)*radius,z=bz+Math.sin(a)*radius;if(x<13.6||x>40.4||z<11.2||z>26.3||blocked(s,x,z))continue;
   if(b.attack==='echoes'&&['TELEGRAPH','EXECUTE'].includes(b.state)&&b.marks.some(m=>Math.hypot(x-m[0],z-m[2])<2.7))continue;
   // Reject a route that crosses the guardian's physical footprint.
   const vx=x-px,vz=z-pz,l=vx*vx+vz*vz,k=l?Math.max(0,Math.min(1,((bx-px)*vx+(bz-pz)*vz)/l)):0;if(Math.hypot(px+vx*k-bx,pz+vz*k-bz)<Math.min(1.88,dist-.03))continue;
   // A clear destination can still lie behind a native obstacle. Reject paths
   // through those footprints; permit an outward escape when already at an edge.
   let crosses=false;for(const o of s.solids){if(o.zone!=='warden')continue;const k=l?Math.max(0,Math.min(1,((o.x-px)*vx+(o.z-pz)*vz)/l)):0,closest=Math.hypot(px+vx*k-o.x,pz+vz*k-o.z),initial=Math.hypot(px-o.x,pz-o.z);if(closest<Math.min(o.radius+.42,initial-.015)){crosses=true;break;}}if(crosses)continue;
   const cost=Math.hypot(x-px,z-pz)+Math.abs(i)*.08;if(cost<score){score=cost;target=[x,z];}
  }
  target??=[Math.max(14,Math.min(39,px-dz*.25)),Math.max(12,Math.min(25,pz+dx*.25))];if(b.state==='DORMANT')target=[22.1,19];
  for(let i=0;i<17;i++)button(i,false);
  if(vulnerable)button(7,true);
  if(vulnerable&&s.combat.cooldown<=0&&b.hp>340&&!charging)charging=true;
  if(charging){if(!vulnerable||s.combat.charge>=.72)charging=false;else button(6,true);}
  if(s.trial.hp<48&&s.trial.potions&&!potion){button(3,true);potion=true;}else potion=false;
  if(b.state==='EXECUTE'&&t-dodgeAt>1.8){const waveHit=b.attack==='slam'&&b.active>.94&&Math.abs(dist-(1.75+(b.active-.98)/.52*7))<1.4,closeStrike=b.attack==='sweep'&&dist<5.1&&(b.active<.25||b.active>.82&&b.active<1.02),rush=b.attack==='rush'&&dist<4;if(waveHit||closeStrike||rush){button(5,true);dodgeAt=t;}}
  const fx=s.target[0]-s.camera[0],fz=s.target[2]-s.camera[2],fl=Math.hypot(fx,fz),vx=target[0]-px,vz=target[1]-pz,vl=Math.hypot(vx,vz),ax=bx-px,az=bz-pz,al=Math.hypot(ax,az),right=(x,z)=>(x*-fz+z*fx)/fl,forward=(x,z)=>(x*fx+z*fz)/fl;
  const speed=Math.min(1,vl/.5);window.__qaPad.axes=[vl>.1?right(vx,vz)/vl*speed:0,vl>.1?-forward(vx,vz)/vl*speed:0,right(ax,az)/al,-forward(ax,az)/al];window.__qaPad.timestamp=now;requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
}));}
