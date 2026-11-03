// Ballistic hop over the walkable surface. Solid walls/rocks still block X/Z.
// Position is transient: reloading/respawning always starts on the ground.
export class Jump {
 height=0;
 velocity=0;
 get airborne(){return this.height>0||this.velocity>0;}
 start(){if(this.airborne)return false;this.velocity=6.6;return true;}
 update(dt:number,ceiling=Infinity){
  if(!this.airborne)return;
  this.height+=this.velocity*dt-9.5*dt*dt;
  this.velocity-=19*dt;
  if(this.height>ceiling){this.height=ceiling;this.velocity=Math.min(0,this.velocity);}
  if(this.height<=0)this.reset();
 }
 reset(){this.height=0;this.velocity=0;}
}
