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
  const filename=location.pathname.split('/').pop()??'';
  const lab=['campaign-playtest.html','party-playtest.html','astral-playtest.html','threat-playtest.html','caldera-playtest.html','xenobinder-playtest.html'].includes(filename);
  const url = new URL(lab?filename:import.meta.env.BASE_URL, location.href);
  url.search = ''; url.hash = '';
  url.searchParams.set('sala', code);
  if(filename==='campaign-playtest.html'&&new URLSearchParams(location.search).has('chat'))url.searchParams.set('chat','1');
  if(filename==='campaign-playtest.html'&&new URLSearchParams(location.search).has('missions'))url.searchParams.set('missions','1');
  if(filename==='campaign-playtest.html'&&new URLSearchParams(location.search).has('settlement'))url.searchParams.set('settlement','1');
  if(filename==='campaign-playtest.html'&&new URLSearchParams(location.search).has('mobile'))url.searchParams.set('mobile','1');
  if(filename==='campaign-playtest.html'&&new URLSearchParams(location.search).has('journey'))url.searchParams.set('journey','1');
  if(filename==='campaign-playtest.html'&&new URLSearchParams(location.search).has('depth'))url.searchParams.set('depth','1');
  if(filename==='campaign-playtest.html')for(const flag of ['route','sirocco','boreal','embers','warden','soterrado','vesper'])if(new URLSearchParams(location.search).has(flag))url.searchParams.set(flag,'1');
  if(lab&&filename!=='campaign-playtest.html'){const params=new URLSearchParams(location.search);url.searchParams.set('region',params.get('region')??(filename==='caldera-playtest.html'?(params.get('boss')==='1'?'caldera':'cinder'):'forest'));url.searchParams.set('kit',params.get('kit')??'basic');url.searchParams.set('class',params.get('class')==='hunter'?'warrior':'hunter');if(params.get('boss')==='1')url.searchParams.set('boss','1');}
  return url.href;
}

export function clearInvitation(): void {
  const url = new URL(location.href);
  if (!url.searchParams.has('sala')) return;
  url.searchParams.delete('sala');
  history.replaceState(history.state, '', url);
}

export function setInvitation(code: string): void {
  const url = new URL(location.href);
  url.searchParams.set('sala', code);
  history.replaceState(history.state, '', url);
}
