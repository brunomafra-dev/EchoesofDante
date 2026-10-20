import './bridge';

const takes = {
  film: { file: 'arrival-whole-scene.mp4', title: 'Abertura completa',
    caption: '54 SEGUNDOS · NARA ORIENTA A EQUIPE · TRÊS VOZES EM PORTUGUÊS · CONCAT',
    description: 'Nara aparece na rampa durante sua fala final, orientando os quatro pioneiros à frente. Vozes e ritmo aprovados preservados; revisão da imagem e menor compressão. Mesma versão na campanha.',
    end: 'Fim da abertura. A expedição começa agora.' },
  landing: { file: 'landing-heroes.mp4', title: 'Nara e os quatro pioneiros',
    caption: 'NARA NA RAMPA · OS QUATRO HERÓIS À FRENTE · CENA INTEIRA ANIMADA',
    description: 'Nara, de jaqueta bege e lenço laranja, acompanha a saída da equipe e dá a ordem de reconhecimento. Confira sua presença durante a fala, a continuidade dos cinco personagens e os detalhes em movimento.',
    end: 'Fim do desembarque. A equipe abre o caminho.' },
  voices: { file: 'bridge-voice-proof.mp4', title: 'Ponte dublada em português',
    caption: 'IVO E NARA · VOZES EM PORTUGUÊS · TESTE EDITADO NO CONCAT',
    description: 'Prova de 12 segundos com três falas e duas vozes locais. Avalie naturalidade, clareza e volume. A atuação já aprovada foi preservada; este teste não adiciona sincronização labial.',
    end: 'Fim da ponte. Estas vozes também estão na abertura completa.' },
} as const;
type Take = keyof typeof takes;
const video = document.querySelector<HTMLVideoElement>('video')!;
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-take]'));
const status = document.querySelector<HTMLElement>('#playback-status')!;
function select(key: Take) {
  const take = takes[key];
  video.pause();
  video.src = `${import.meta.env.BASE_URL}assets/cinematic-opening/${take.file}`;
  video.setAttribute('aria-label', take.title);
  video.dataset.endMessage = take.end;
  video.load();
  document.querySelector('#take-caption')!.textContent = take.caption;
  document.querySelector('#take-description')!.textContent = take.description;
  document.querySelector<HTMLAnchorElement>('#download')!.href = video.src;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.take === key)));
  const url = new URL(location.href);
  url.searchParams.set('take', key);
  history.replaceState(null, '', url);
  status.textContent = `${take.title}. Pronto para reproduzir com som.`;
}
buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.take as Take)));
const initial = new URLSearchParams(location.search).get('take');
select(initial && Object.hasOwn(takes, initial) ? initial as Take : 'film');
