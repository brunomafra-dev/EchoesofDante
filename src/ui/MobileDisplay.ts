// Fullscreen/orientation are browser permissions, invoked only by a real tap.
// Keep the document untransformed: CSS-rotating it breaks touch coordinates.
export class MobileDisplay {
  private readonly dialog = document.createElement('dialog');
  private readonly status = document.createElement('p');
  private readonly enter = document.createElement('button');
  private readonly portrait = matchMedia('(orientation: portrait)');
  private dismissed = false;
  private busy = false;
  private locked = false;
  private disposed = false;

  constructor() {
    this.dialog.className = 'mobile-display';
    this.dialog.setAttribute('aria-labelledby', 'mobile-display-title');
    const title = document.createElement('h2'); title.id = 'mobile-display-title'; title.textContent = 'Dante na horizontal';
    this.status.textContent = 'Toque para entrar em tela cheia e jogar com o aparelho deitado.';
    this.enter.type = 'button'; this.enter.textContent = 'ENTRAR EM TELA CHEIA'; this.enter.dataset.mobile = 'enter';
    this.enter.onclick = () => { void this.request(); };
    const skip = document.createElement('button'); skip.type = 'button'; skip.textContent = 'CONTINUAR NO NAVEGADOR';
    skip.dataset.mobile = 'continue'; skip.onclick = () => { this.dismissed = true; this.sync(); };
    this.dialog.append(title, this.status, this.enter, skip);
    this.dialog.addEventListener('cancel', this.cancel);
    document.body.append(this.dialog);
    window.addEventListener('resize', this.sync);
    document.addEventListener('fullscreenchange', this.sync);
    // A landscape visitor can start from any menu action without an extra gate.
    document.addEventListener('click', this.gesture, true);
    this.sync();
  }

  private mobile(): boolean { return matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0; }
  private cancel = (event: Event): void => { event.preventDefault(); this.dismissed = true; this.sync(); };
  private gesture = (event: MouseEvent): void => {
    if (!event.isTrusted || this.dialog.open || this.dismissed || this.busy || !this.mobile()) return;
    if (!(event.target instanceof HTMLElement) || event.target.closest('input,textarea,select,[contenteditable]')) return;
    if (!document.fullscreenElement) void this.request();
  };
  private sync = (): void => {
    if (this.disposed) return;
    const show = this.mobile() && this.portrait.matches && !this.dismissed;
    if (show && !this.dialog.open) this.dialog.showModal();
    else if (!show && this.dialog.open) this.dialog.close();
  };

  private async request(): Promise<void> {
    if (this.busy || this.disposed) return;
    this.busy = true;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      const orientation = screen.orientation as ScreenOrientation & { lock?: (mode: string) => Promise<void> };
      if (orientation?.lock && !this.disposed) {
        await orientation.lock('landscape'); this.locked = true;
        if (this.disposed) { orientation.unlock(); this.locked = false; }
      }
    } catch { /* iOS, browser settings and embedded browsers can reject either request. */ }
    finally {
      this.busy = false;
      if (!this.disposed) {
        this.status.textContent = 'Se a tela não girou, vire o aparelho para a horizontal. A abertura também pode ser vista em pé.';
        this.enter.textContent = 'TENTAR TELA CHEIA';
        this.sync();
      }
    }
  }

  destroy(): void {
    this.disposed = true;
    window.removeEventListener('resize', this.sync);
    document.removeEventListener('fullscreenchange', this.sync);
    document.removeEventListener('click', this.gesture, true);
    this.dialog.removeEventListener('cancel', this.cancel); this.dialog.remove();
    if (this.locked) { try { screen.orientation.unlock(); } catch { /* Already released. */ } }
  }
}
