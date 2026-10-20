import './bridge';

const takes = {
  film: { file: 'arrival-whole-scene.mp4', title: 'Abertura completa',
    caption: '54 SEGUNDOS · TRILHA ORIGINAL · MOTORES E AMBIENTE · DUBLAGEM EM PRIMEIRO PLANO',
    description: 'Motores revistos: aceleração na decolagem (6–12 s) e propulsores na descida (40,5–49,5 s), com mais presença nos intervalos da conversa. Trilha, ambiente e vozes aprovados preservados. Mesma versão na campanha.',
    end: 'Fim da abertura. A expedição começa agora.' },
  landing: { file: 'landing-heroes.mp4', title: 'Nara e os quatro pioneiros',
    caption: 'NARA E OS PIONEIROS · APOIO DO MÓDULO · PASSOS E FLORESTA · FUNDO SUAVE',
    description: 'Nara orienta o reconhecimento enquanto a nave assenta, os pioneiros saem e a clareira ganha som. A fala permanece na frente da trilha e dos efeitos.',
    end: 'Fim do desembarque. A equipe abre o caminho.' },
  voices: { file: 'bridge-voice-proof.mp4', title: 'Ponte dublada em português',
    caption: 'IVO E NARA · INTERIOR DA NAVE · NOVA TRILHA AO FUNDO · CONCAT',
    description: 'Trecho da ponte com ventilação e motor distante, música discreta e as três falas aprovadas. Confira a clareza da conversa e o volume do fundo.',
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
