// Invites contain only the public room code, never a resume credential or save.
export function roomCode(value: string): string | undefined {
  const clean = value.trim();
  if (/^[a-f\d\s]+$/i.test(clean)) {
    const code = clean.replace(/\s/g, '').toUpperCase();
    if (/^[A-F\d]{10}$/.test(code)) return code;
  }
  try {
    const url = new URL(clean);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    const code = url.searchParams.get('sala')?.toUpperCase();
    if (code && /^[A-F\d]{10}$/.test(code)) return code;
  } catch { /* Incomplete or invalid code: the menu explains how to retry. */ }
}

export function invitationLink(code: string): string {
  const url = new URL(import.meta.env.BASE_URL, location.href);
  url.search = ''; url.hash = '';
  url.searchParams.set('sala', code);
  return url.href;
}

export function clearInvitation(): void {
  const url = new URL(location.href);
  if (!url.searchParams.has('sala')) return;
  url.searchParams.delete('sala');
  history.replaceState(history.state, '', url);
}
