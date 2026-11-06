export class Health {
  max: number;
  current: number;
  guardRemaining=0;
  guardReduction=0;

  constructor(max: number) {
    this.max = max;
    this.current = max;
  }

  damage(amount: number): boolean {
    if (this.current <= 0) return false;
    if(this.guardRemaining>0&&amount>0)amount=Math.max(1,Math.round(amount*(1-Math.max(0,Math.min(.45,this.guardReduction)))));
    this.current = Math.max(0, this.current - amount);
    return this.current === 0;
  }
  tickProtection(dt:number):void{this.guardRemaining=Math.max(0,this.guardRemaining-Math.max(0,Math.min(.1,dt)));if(!this.guardRemaining)this.guardReduction=0;}
  clearProtection():void{this.guardRemaining=this.guardReduction=0;}

  setMaxAndRestore(max: number): void {
    this.max = max;
    this.current = max;
  }

  get isDead(): boolean { return this.current === 0; }
}
