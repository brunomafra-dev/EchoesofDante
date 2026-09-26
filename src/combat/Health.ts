export class Health {
  readonly max: number;
  current: number;

  constructor(max: number) {
    this.max = max;
    this.current = max;
  }

  damage(amount: number): boolean {
    if (this.current <= 0) return false;
    this.current = Math.max(0, this.current - amount);
    return this.current === 0;
  }

  get isDead(): boolean { return this.current === 0; }
}
