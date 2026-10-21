import '../../style.css';

// Both save namespaces stay in this tab's sessionStorage, across reloads. No
// character, setting or one-shot launch in the real game is read or modified.
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
const missionTest=new URLSearchParams(location.search).has('missions');
const prefix=missionTest?'dante-missions-lab.':'dante-campaign-lab.';
const isolatedKey=(storage:Storage,key:string)=>prefix+(storage===localStorage?'local.':'session.')+key;
Storage.prototype.getItem=function(key){return key.startsWith('echoes-of-dante.')?get.call(sessionStorage,isolatedKey(this,key)):get.call(this,key)};
Storage.prototype.setItem=function(key,value){if(key.startsWith('echoes-of-dante.'))set.call(sessionStorage,isolatedKey(this,key),String(value));else set.call(this,key,value)};
Storage.prototype.removeItem=function(key){if(key.startsWith('echoes-of-dante.'))remove.call(sessionStorage,isolatedKey(this,key));else remove.call(this,key)};
const details=document.createElement('details');details.className='campaign-lab-help';
details.innerHTML='<summary>ETAPA 1 · SELETOR E INÍCIO · TESTE RESERVADO</summary><p>Crie seu personagem e clique na dificuldade para iniciar. No coop, escolha antes o tamanho da equipe (2–4). Envie o convite deste laboratório; a campanha exige a equipe original completa.</p><p>Confira os braços das quatro classes e as duas apresentações. A cinemática antiga ainda é provisória; o piloto de atuação pertence à etapa 3.</p><p>Seus personagens reais estão protegidos. Os testes ficam apenas nesta aba; fechar a aba apaga estes personagens temporários.</p><p><a href="character-cohesion.html">Movimento e peças de equipamento</a> · <a href="test-library.html">Biblioteca</a> · <button type="button">REINICIAR TESTE</button></p>';
if(new URLSearchParams(location.search).has('chat'))details.innerHTML='<summary>ETAPA 2 · NOMES E CHAT · TESTE RESERVADO</summary><p>Jogar → Cooperativo → Iniciar novo jogo. Crie a equipe de 2–4 pessoas e envie o convite deste laboratório. Os convidados criam classes diferentes.</p><p>Enter abre/envia; Esc cancela. Touch: CHAT. Gamepad: R3 abre o campo, B cancela. Confira nomes, falas sobre os personagens e Histórico. Escrever interrompe sua carga e bloqueia seus comandos; os aliados continuam jogando.</p><p>Limite: 200 caracteres, uma mensagem por segundo, 100 no histórico. O histórico acompanha viagens e reconexão. Falas ficam 5 segundos sobre o autor.</p><p>Seus saves reais estão protegidos; este teste usa apenas dados temporários da aba. <a href="test-library.html">Biblioteca</a> · <button type="button">REINICIAR TESTE</button></p>';
details.querySelector('button')!.onclick=()=>{const keys=Array.from({length:sessionStorage.length},(_,i)=>sessionStorage.key(i)).filter((k):k is string=>!!k&&k.startsWith(prefix));for(const key of keys)remove.call(sessionStorage,key);const url=new URL(location.href);url.searchParams.delete('sala');location.href=url.href;};
if(missionTest){
 details.innerHTML='<summary>ETAPA 4 · MISSÕES DA EXPEDIÇÃO · TESTE RESERVADO</summary><p>Comece com Nara: ! âmbar indica missão disponível; ✓ verde indica relatório pronto. E conversa/analisa. J ou o tracker abre o diário; M abre o atlas. No controle, L3 abre o diário.</p><p>Os quatro relatórios preparam a chegada de mais humanos. O teste começa na base; os botões abaixo simulam etapas anteriores para avaliar cada conversa sem repetir a campanha. Não são atalhos do jogo oficial.</p><p>Para testar em equipe: Esc → Voltar ao início → Jogar → Cooperativo → Iniciar novo jogo. Envie o convite deste laboratório. Qualquer integrante pode aceitar e entregar; os objetivos são do time.</p><p>Seus personagens reais estão protegidos. <a href="test-library.html">Biblioteca</a> · <button type="button" data-reset>REINICIAR TESTE</button></p><p class="mission-lab-stages"><button data-stage="recon">NARA · RECONHECIMENTO</button> <button data-stage="survival">LIA · ANÁLISES</button> <button data-stage="signal">IVO · ECOS</button> <button data-stage="beyond">NARA · RELATÓRIO FINAL SIMULADO</button></p><p data-lab-notice role="status"></p>';
 details.querySelector('[data-reset]')!.addEventListener('click',()=>{for(const key of Array.from({length:sessionStorage.length},(_,i)=>sessionStorage.key(i)))if(key?.startsWith(prefix))remove.call(sessionStorage,key);const url=new URL(location.href);url.searchParams.delete('sala');location.href=url.href;});
 const {characterProfiles}=await import('../../systems/CharacterProfiles');
 if(!new URLSearchParams(location.search).has('sala')){
  if(!characterProfiles.list.length){const hero=characterProfiles.create('Pioneiro','warrior','male',{mode:'solo',difficulty:'normal'});
   if(hero){characterProfiles.select(hero.id);characterProfiles.markIntroSeen(hero.id);sessionStorage.setItem('echoes-of-dante.launch-once',hero.id);}
  }
 }
}
document.body.append(details);
const {game}=await import('../../main');
if(missionTest)for(const b of Array.from(details.querySelectorAll<HTMLButtonElement>('[data-stage]')))b.onclick=()=>{
 const scene=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;
 const ok=scene?.sys.isActive()&&scene.seedMissionPlaytest(b.dataset.stage as import('../../config/missions').MissionId);
 details.querySelector('[data-lab-notice]')!.textContent=ok?'Etapa preparada no teste temporário. Converse com o NPC indicado.':'Feche os menus e reúna a equipe; somente o anfitrião prepara etapas no cooperativo.';
 if(ok)details.open=false;
};
