// Scoped to the game surface. Leave browser gestures outside it untouched.
// touch-action is the primary policy; non-passive handlers also cover Safari gestures.
export function protectGameplayGestures(surface: HTMLElement): () => void {
  const prevent = (event: Event) => {
    if (event.cancelable) event.preventDefault();
  };
  const events = ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart', 'dragstart'];
  for (const type of events) surface.addEventListener(type, prevent, { passive: false });
  return () => {
    for (const type of events) surface.removeEventListener(type, prevent);
  };
}
