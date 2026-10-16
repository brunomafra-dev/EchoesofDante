import '../../style.css';

// Both save namespaces stay in this tab's sessionStorage, across reloads. No
// character, setting or one-shot launch in the real game is read or modified.
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
const prefix='dante-campaign-lab.';
const isolatedKey=(storage:Storage,key:string)=>prefix+(storage===localStorage?'local.':'session.')+key;
Storage.prototype.getItem=function(key){return key.startsWith('echoes-of-dante.')?get.call(sessionStorage,isolatedKey(this,key)):get.call(this,key)};
Storage.prototype.setItem=function(key,value){if(key.startsWith('echoes-of-dante.'))set.call(sessionStorage,isolatedKey(this,key),String(value));else set.call(this,key,value)};
Storage.prototype.removeItem=function(key){if(key.startsWith('echoes-of-dante.'))remove.call(sessionStorage,isolatedKey(this,key));else remove.call(this,key)};
const details=document.createElement('details');details.className='campaign-lab-help';
details.innerHTML='<summary>ETAPA 1 · SELETOR E INÍCIO · TESTE RESERVADO</summary><p>Crie seu personagem e clique na dificuldade para iniciar. No coop, escolha antes o tamanho da equipe (2–4). Envie o convite deste laboratório; a campanha exige a equipe original completa.</p><p>Confira os braços das quatro classes e as duas apresentações. A cinemática antiga ainda é provisória; o piloto de atuação pertence à etapa 3.</p><p>Seus personagens reais estão protegidos. Os testes ficam apenas nesta aba; fechar a aba apaga estes personagens temporários.</p><p><a href="character-cohesion.html">Movimento e peças de equipamento</a> · <a href="test-library.html">Biblioteca</a> · <button type="button">REINICIAR TESTE</button></p>';
details.querySelector('button')!.onclick=()=>{const keys=Array.from({length:sessionStorage.length},(_,i)=>sessionStorage.key(i)).filter((k):k is string=>!!k&&k.startsWith(prefix));for(const key of keys)remove.call(sessionStorage,key);const url=new URL(location.href);url.searchParams.delete('sala');location.href=url.href;};
document.body.append(details);
await import('../../main');
