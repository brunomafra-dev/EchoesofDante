import '../../style.css';

// Both save namespaces stay in this tab's sessionStorage, across reloads. No
// character, setting or one-shot launch in the real game is read or modified.
const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
const missionTest=new URLSearchParams(location.search).has('missions');
const mobileTest=new URLSearchParams(location.search).has('mobile');
const mobileClass=new URLSearchParams(location.search).get('class');
const wardenTest=new URLSearchParams(location.search).has('warden');
const soterradoTest=new URLSearchParams(location.search).has('soterrado');
const vesperTest=new URLSearchParams(location.search).has('vesper');
const bossTest=wardenTest||soterradoTest||vesperTest;
const embersTest=new URLSearchParams(location.search).has('embers');
const borealTest=new URLSearchParams(location.search).has('boreal');
const siroccoTest=new URLSearchParams(location.search).has('sirocco');
const routeTest=new URLSearchParams(location.search).has('route')||siroccoTest||borealTest||embersTest;
const arrivalParam=new URLSearchParams(location.search).get('arrival');
const routeArrival=routeTest&&((!siroccoTest&&!borealTest&&!embersTest&&(arrivalParam==='forest'||arrivalParam==='cavern'))||(siroccoTest&&(arrivalParam==='valley'||arrivalParam==='arid'||arrivalParam==='dunes'||arrivalParam==='sandpit'))||(borealTest&&(arrivalParam==='frost'||arrivalParam==='icecave'||arrivalParam==='icenest'))||(embersTest&&(arrivalParam==='cinder'||arrivalParam==='obsidian'||arrivalParam==='caldera')))?arrivalParam:undefined;
const depthTest=new URLSearchParams(location.search).has('depth');
const settlementTest=new URLSearchParams(location.search).has('settlement');
const prefix=embersTest?`dante-embers-journey-v1.${routeArrival??'journey'}.`:borealTest?`dante-boreal-journey-v1.${routeArrival??'journey'}.`:siroccoTest?`dante-sirocco-journey-v1.${routeArrival??'journey'}.`:routeTest?`dante-early-route-v2.${routeArrival??'journey'}.`:depthTest?`dante-regional-lab.${mobileClass??'warrior'}.`:new URLSearchParams(location.search).has('journey')?'dante-journey-review-lab.':mobileTest?`dante-mobile-lab.${mobileClass??'warrior'}.`:settlementTest?'dante-settlement-lab-v2.':missionTest?'dante-missions-lab.':'dante-campaign-lab.';
const labPrefix=vesperTest?'dante-vesper-combat-v1.'+(mobileClass??'warrior')+'.':soterradoTest?'dante-soterrado-combat-v1.'+(mobileClass??'warrior')+'.':wardenTest?'dante-warden-combat-v2.'+ (mobileClass??'warrior')+'.':prefix;
const isolatedKey=(storage:Storage,key:string)=>labPrefix+(storage===localStorage?'local.':'session.')+key;
Storage.prototype.getItem=function(key){return key.startsWith('echoes-of-dante.')?get.call(sessionStorage,isolatedKey(this,key)):get.call(this,key)};
Storage.prototype.setItem=function(key,value){if(key.startsWith('echoes-of-dante.'))set.call(sessionStorage,isolatedKey(this,key),String(value));else set.call(this,key,value)};
Storage.prototype.removeItem=function(key){if(key.startsWith('echoes-of-dante.'))remove.call(sessionStorage,isolatedKey(this,key));else remove.call(this,key)};
const details=document.createElement('details');details.className='campaign-lab-help';
details.innerHTML='<summary>ETAPA 1 · SELETOR E INÍCIO · TESTE RESERVADO</summary><p>Crie seu personagem e clique na dificuldade para iniciar. No coop, escolha antes o tamanho da equipe (2–4). Envie o convite deste laboratório; a campanha exige a equipe original completa.</p><p>Confira os braços das quatro classes e as duas apresentações. A cinemática antiga ainda é provisória; o piloto de atuação pertence à etapa 3.</p><p>Seus personagens reais estão protegidos. Os testes ficam apenas nesta aba; fechar a aba apaga estes personagens temporários.</p><p><a href="character-cohesion.html">Movimento e peças de equipamento</a> · <a href="test-library.html">Biblioteca</a> · <button type="button">REINICIAR TESTE</button></p>';
if(new URLSearchParams(location.search).has('chat'))details.innerHTML='<summary>ETAPA 2 · NOMES E CHAT · TESTE RESERVADO</summary><p>Jogar → Cooperativo → Iniciar novo jogo. Crie a equipe de 2–4 pessoas e envie o convite deste laboratório. Os convidados criam classes diferentes.</p><p>Enter abre/envia; Esc cancela. Touch: CHAT. Gamepad: R3 abre o campo, B cancela. Confira nomes, falas sobre os personagens e Histórico. Escrever interrompe sua carga e bloqueia seus comandos; os aliados continuam jogando.</p><p>Limite: 200 caracteres, uma mensagem por segundo, 100 no histórico. O histórico acompanha viagens e reconexão. Falas ficam 5 segundos sobre o autor.</p><p>Seus saves reais estão protegidos; este teste usa apenas dados temporários da aba. <a href="test-library.html">Biblioteca</a> · <button type="button">REINICIAR TESTE</button></p>';
details.querySelector('button')!.onclick=()=>{const keys=Array.from({length:sessionStorage.length},(_,i)=>sessionStorage.key(i)).filter((k):k is string=>!!k&&k.startsWith(prefix));for(const key of keys)remove.call(sessionStorage,key);const url=new URL(location.href);url.searchParams.delete('sala');location.href=url.href;};
if(missionTest||routeTest||bossTest){
 details.innerHTML='<summary>ETAPA 4 · MISSÕES DA EXPEDIÇÃO · TESTE RESERVADO</summary><p>Comece com Nara: ! âmbar indica missão disponível; ✓ verde indica relatório pronto. E conversa/analisa. J ou o tracker abre o diário; M abre o atlas. No controle, L3 abre o diário.</p><p>Os quatro relatórios preparam a chegada de mais humanos. O teste começa na base; os botões abaixo simulam etapas anteriores para avaliar cada conversa sem repetir a campanha. Não são atalhos do jogo oficial.</p><p>Para testar em equipe: Esc → Voltar ao início → Jogar → Cooperativo → Iniciar novo jogo. Envie o convite deste laboratório. Qualquer integrante pode aceitar e entregar; os objetivos são do time.</p><p>Seus personagens reais estão protegidos. <a href="test-library.html">Biblioteca</a> · <button type="button" data-reset>REINICIAR TESTE</button></p><p class="mission-lab-stages"><button data-stage="recon">NARA · RECONHECIMENTO</button> <button data-stage="survival">LIA · ANÁLISES</button> <button data-stage="signal">IVO · ECOS</button> <button data-stage="beyond">NARA · RELATÓRIO FINAL SIMULADO</button></p><p data-lab-notice role="status"></p>';
 details.querySelector('[data-reset]')!.addEventListener('click',()=>{for(const key of Array.from({length:sessionStorage.length},(_,i)=>sessionStorage.key(i)))if(key?.startsWith(prefix))remove.call(sessionStorage,key);const url=new URL(location.href);url.searchParams.delete('sala');location.href=url.href;});
 const {characterProfiles}=await import('../../systems/CharacterProfiles');
 if(!new URLSearchParams(location.search).has('sala')){
  if(!characterProfiles.list.length){const selectedClass=(mobileTest||depthTest||routeTest||bossTest)&&['warrior','hunter','astral','xenobinder'].includes(mobileClass??'')?mobileClass as import('../../config/classes').PlayableClass:'warrior';const hero=characterProfiles.create('Pioneiro',selectedClass,'male',{mode:'solo',difficulty:'normal'});
   if(hero){characterProfiles.select(hero.id);characterProfiles.markIntroSeen(hero.id);sessionStorage.setItem('echoes-of-dante.launch-once',hero.id);}
  }
  if((routeArrival||bossTest)&&characterProfiles.list.length)sessionStorage.setItem('echoes-of-dante.launch-once',characterProfiles.active.id);
 }
}
document.body.append(details);
if(mobileTest){
 details.classList.add('is-mobile-lab');
 details.querySelector('summary')!.textContent='MOBILE · MIRA, HUD E SALAS · TESTE RESERVADO';
 const p=document.createElement('p');p.textContent='Esquerda: mover. Analógico direito: arraste em qualquer direção para mirar e atacar; solte para parar. Toque no cenário para olhar sem disparar. Habilidade: segure, arraste e solte; esquiva tem botão próprio. Vida/XP e atalhos ficam no topo; toque em RADAR para abrir o mapa local.';details.querySelector('summary')!.after(p);
 const links=document.createElement('p');for(const[id,label]of [['warrior','Guerreiro'],['hunter','Caçador estelar'],['astral','Astral'],['xenobinder','Domador']]){const a=document.createElement('a');a.href=`campaign-playtest.html?missions=1&mobile=1&class=${id}&v=0.1.131`;a.textContent=label+' · ';links.append(a);}const coop=document.createElement('a');coop.href='campaign-playtest.html?mobile=1&v=0.1.131';coop.textContent='Criar sala pelo celular/tablet';links.append(coop);details.append(links);
 if(!missionTest){const note=document.createElement('p');note.textContent='Jogar → Cooperativo → Criar sala e convidar. Crie seu personagem, escolha equipe e dificuldade. Após a abertura, compartilhe o convite. O líder inicia quando todos se conectarem. Dados temporários desta aba; nenhum save real é alterado.';details.append(note);}
}
if(settlementTest){
 details.querySelector('summary')!.textContent='ETAPA 5 · NASCENTES, TERRAÇOS E ACAMPAMENTO · TESTE RESERVADO';
 const intro=document.createElement('p');intro.textContent='O teste começa do zero, com o Warden vivo e regiões por descobrir. Para avaliar só o assentamento, abra este painel e escolha explicitamente SIMULAR. Essa escolha marca a campanha anterior como concluída apenas nesta aba.';details.querySelector('summary')!.after(intro);
 const stages=details.querySelector('.mission-lab-stages')!;stages.replaceChildren();
 for(const[id,text]of [['water-source','LIA · ÁGUA PARA PERMANECER'],['safe-route','IVO · ROTA DOS TERRAÇOS'],['shelter','NARA · PRIMEIRO ABRIGO']]){const b=document.createElement('button');b.dataset.stage=id;b.textContent='SIMULAR · '+text;stages.append(b);}
}
const {game}=await import('../../main');
if(bossTest){
 const label=vesperTest?'VÉSPER':soterradoTest?'SOTERRADO':'WARDEN',flag=vesperTest?'vesper':soterradoTest?'soterrado':'warden',version=vesperTest?'0.1.152':soterradoTest?'0.1.151':'0.1.150';
 const seed=(s:import('../../scenes/GameScene').GameScene)=>vesperTest?s.seedVesperPlaytest():soterradoTest?s.seedSoterradoPlaytest():s.seedWardenPlaytest();
 details.replaceChildren(); details.classList.add('is-mobile-lab');
 const summary=document.createElement('summary');summary.textContent=label+' · REVISÃO DO COMBATE · TESTE RESERVADO';details.append(summary);
 const note=document.createElement('p');note.textContent=vesperTest?'Chegada temporária ao Vésper vivo: três Ecos, mecanismo, Primeiro Eco, Warden, percurso do Siroco, Soterrado e sua pista, sinais da Fratura e das Galerias são simulados. Os quatro relatórios principais anteriores são entregues; os regionais continuam pendentes. Nenhuma vitória, recibo ou registro de Vésper é simulado. Seus personagens e configurações reais estão protegidos; os kits e controles da campanha continuam ativos.':soterradoTest?'Chegada temporária ao Soterrado vivo: três Ecos, mecanismo, Primeiro Eco, vitória do Warden, Vale, Siroco, ruínas e descida das Dunas são simulados. Os quatro relatórios principais anteriores são considerados entregues; relatórios regionais continuam pendentes. Nenhuma vitória, passagem ao frio ou recompensa do Soterrado é simulada. Os mesmos kits e controles da campanha estão ativos; seus personagens reais estão protegidos.':'Chegada temporária ao Warden vivo: três Ecos, mecanismo, percurso subterrâneo, Primeiro Eco e portão são simulados. Reconhecimento, sobrevivência e sinal anteriores são considerados entregues; a missão além do limiar continua aberta. Nenhuma vitória ou recompensa do Warden é simulada. Os mesmos controles e kits da campanha estão ativos; seus personagens reais estão protegidos.';details.append(note);
 const button=document.createElement('button');button.textContent='RECOMEÇAR '+label+' VIVO';button.onclick=()=>{const s=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;if(s?.sys.isActive())seed(s);};details.append(button);
 const links=document.createElement('p');
 for(const[id,name]of [['warrior','Guerreiro'],['hunter','Caçador estelar'],['astral','Astral'],['xenobinder','Domador']]){const a=document.createElement('a');a.href=`campaign-playtest.html?${flag}=1&class=${id}&v=${version}`;a.textContent=name;links.append(a,document.createTextNode(' · '));}details.append(links);
 const coop=document.createElement('p');coop.textContent='Coop: Esc → início → crie uma equipe e compartilhe o convite do laboratório. Com todos presentes, o anfitrião usa RECOMEÇAR '+label+' VIVO. O convite mantém o isolamento. A chegada preparada vale somente aqui.';details.append(coop);
 const audio=document.createElement('a');audio.href='soundtrack-playtest.html?v=0.1.149';audio.textContent='Ouvir trilhas e conferir a mixagem';details.append(audio);
 if(!get.call(sessionStorage,labPrefix+'arrived')&&!new URLSearchParams(location.search).has('sala')){
  const deadline=performance.now()+90000;
  const arrive=()=>{const s=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;if(s?.sys.isActive()&&seed(s))set.call(sessionStorage,labPrefix+'arrived','1');else if(performance.now()<deadline)setTimeout(arrive,150);};setTimeout(arrive,150);
 }
}
if(routeTest){
 const seed=(scene:import('../../scenes/GameScene').GameScene,area:string)=>embersTest?scene.seedEmbersRoutePlaytest(area as 'cinder'|'obsidian'|'caldera'):borealTest?scene.seedBorealRoutePlaytest(area as 'frost'|'icecave'|'icenest'):siroccoTest?scene.seedSiroccoRoutePlaytest(area as 'valley'|'arid'|'dunes'|'sandpit'):scene.seedEarlyRoutePlaytest(area as 'forest'|'cavern');
 details.classList.add('is-mobile-lab');details.querySelector('summary')!.textContent='PERCURSO E RITMO · BASE AO WARDEN · TESTE RESERVADO';
 details.querySelector('.mission-lab-stages')?.remove();
 for(const p of Array.from(details.querySelectorAll('p')))if(!p.querySelector('[data-reset]')&&!p.hasAttribute('data-lab-notice'))p.remove();
 const note=document.createElement('p');note.textContent='Começa do zero, na base, com o Warden vivo. Converse com Nara. Lia indica o circuito oriental e a margem sul da Floresta; Ivo indica três câmaras laterais nas cavernas. E analisa; J acompanha o relatório. Os desvios são opcionais: Ecos, mecanismo, Primeiro Eco e Warden mantêm a ordem. Seus saves reais estão protegidos.';details.querySelector('summary')!.after(note);
 const select=document.createElement('select');select.name='route-preview';select.setAttribute('aria-label','Trecho para avaliar');
 for(const[id,label]of embersTest?[['cinder','Costa das Cinzas'],['obsidian','Garganta de Obsidiana'],['caldera','Forjas · Incandescente vivo']]:borealTest?[['frost','Fratura Boreal'],['icecave','Galerias do Degelo'],['icenest','Vésper vivo']]:siroccoTest?[['valley','Vale · rota da caravana'],['arid','Siroco · umidade e sombra'],['dunes','Dunas · duas aproximações'],['sandpit','Soterrado · boss vivo']]:[['forest','Circuito da Floresta'],['cavern','Câmaras da caverna']]){const option=document.createElement('option');option.value=id;option.textContent=label;select.append(option);}
 const button=document.createElement('button');button.dataset.routePreview='';button.textContent='SIMULAR CHEGADA AO TRECHO';
 button.onclick=()=>{if(!confirm(embersTest?'Preparar somente este personagem temporário após Vésper? Warden, Soterrado, Vésper e os requisitos anteriores ao trecho serão simulados. O Incandescente continua vivo; as Forjas ainda exigem seu registro de basalto.':borealTest?'Preparar apenas este personagem temporário após o Soterrado? Warden, Soterrado e requisitos anteriores ao trecho serão simulados. Vésper continua vivo; os dois relatórios não serão concluídos.':siroccoTest?'Preparar somente este personagem temporário após o Warden? Apenas os pré-requisitos anteriores ao trecho serão simulados. Soterrado continua vivo; nenhum relatório regional é concluído.':'Reiniciar somente este personagem temporário no trecho escolhido? A Floresta simula o reconhecimento; a caverna simula os três Ecos e o mecanismo. Nenhum boss será derrotado. Para jogar do zero, cancele.'))return;const scene=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;const ok=scene?.sys.isActive()&&seed(scene,select.value);details.querySelector('[data-lab-notice]')!.textContent=ok?(embersTest?'Trecho preparado. Relatórios por investigar; Incandescente vivo.':borealTest?'Trecho preparado. Relatórios por investigar; Vésper vivo.':siroccoTest?'Trecho preparado. Relatórios por investigar; Soterrado vivo.':'Trecho preparado. Bosses vivos; desmoronamento e Primeiro Eco ainda precisam ser investigados.'):'Feche os menus. A prévia é solo; o cooperativo percorre a jornada completa.';if(ok){set.call(sessionStorage,prefix+'simulated','1');details.querySelector('summary')!.textContent='PRÉVIA DE TRECHO · PROGRESSO TEMPORÁRIO';details.open=false;}};
 details.append(select,button);
 const links=document.createElement('p');
 for(const[id,label]of embersTest?[['cinder','Costa das Cinzas'],['obsidian','Garganta de Obsidiana'],['caldera','Forjas · Incandescente vivo'],['','Campanha desde a base']]:borealTest?[['frost','Fratura Boreal'],['icecave','Galerias do Degelo'],['icenest','Vésper vivo'],['','Campanha desde a base']]:siroccoTest?[['valley','Vale'],['arid','Siroco'],['dunes','Duas rotas pelas Dunas'],['sandpit','Soterrado'],['','Campanha desde a base']]:[['forest','Entrar na Bacia do Leito Vivo'],['cavern','Entrar na Câmara da Condensação'],['','Jornada completa desde a base']]){
  const a=document.createElement('a');a.href=`campaign-playtest.html?route=1${embersTest?'&embers=1':''}${borealTest?'&boreal=1':''}${siroccoTest?'&sirocco=1':''}${id?'&arrival='+id:''}&v=${embersTest?'0.1.148':borealTest?'0.1.147':siroccoTest?'0.1.146':'0.1.142'}`;a.textContent=label;links.append(a,document.createTextNode(' · '));
 }details.append(links);
 if(routeArrival){
  select.value=routeArrival;
  note.textContent='Prévia temporária: chegada direta à expansão. Somente os pré-requisitos deste trecho são simulados; nenhum boss é derrotado. Explore o chão novo, contorne a água e encontre as análises com E. A caverna conserva o desmoronamento original antes das outras câmaras. Seus saves reais estão protegidos.';
  if(!get.call(sessionStorage,prefix+'arrived')&&!new URLSearchParams(location.search).has('sala')){
   const deadline=performance.now()+90000;
   const arrive=()=>{
    const scene=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;
    if(scene?.sys.isActive()&&seed(scene,routeArrival)){
     set.call(sessionStorage,prefix+'arrived','1');
     details.querySelector('[data-lab-notice]')!.textContent=embersTest?'Pré-requisitos anteriores simulados; Incandescente vivo; relatórios por investigar.':borealTest?'Pré-requisitos anteriores simulados; Vésper vivo; relatórios por investigar.':siroccoTest?'Pré-requisitos anteriores simulados; Soterrado vivo; relatórios por investigar.':'Trecho preparado. Bosses vivos; progresso apenas nesta aba.';
    }else if(performance.now()<deadline)setTimeout(arrive,150);
    else details.querySelector('[data-lab-notice]')!.textContent='Abra o painel e use SIMULAR CHEGADA AO TRECHO para tentar novamente.';
   };setTimeout(arrive,150);
  }
 }
 if(siroccoTest){
  details.querySelector('summary')!.textContent='VALE → SIROCO → SOTERRADO · TESTE RESERVADO';
  note.textContent='Explore nove desvios e seus retornos: abrigo da caravana, umidade/sombra e as duas rotas das Dunas. E analisa; J acompanha o relatório. Os relatórios foram aceitos para este teste; as nove descobertas e suas entregas continuam por fazer. Créditos e recibos antigos são preservados no jogo oficial. A chegada direta simula o Warden e somente os pré-requisitos anteriores à região; o Soterrado permanece vivo. Sem chegada selecionada, começa do zero na base. Seus personagens reais não são alterados. Para coop: volte ao início, crie a equipe e percorra a campanha; o convite mantém o laboratório.';
 }
 if(borealTest){
  details.querySelector('summary')!.textContent='FRATURA BOREAL → GALERIAS → VÉSPER · TESTE RESERVADO';
  note.textContent='Explore os abrigos do vento, a bifurcação seca e as margens rasas do degelo. Lia pesquisa água e abrigo; Ivo avalia transporte e estruturas. E analisa; J acompanha os dois relatórios, aceitos e ainda por investigar/entregar. No ninho, siga os vestígios até Vésper. Chegadas diretas simulam Warden, Soterrado e somente os requisitos anteriores ao trecho: Vésper continua vivo, sem recompensa ou registro final. Sem chegada selecionada, começa do zero na base. Seus personagens reais estão protegidos. Para coop, volte ao início, crie a equipe e percorra a campanha; o convite mantém o laboratório.';
 }

 if(embersTest){
  details.querySelector('summary')!.textContent='CINZAS → OBSIDIANA → INCANDESCENTE · TESTE RESERVADO';
  note.textContent='Explore nove desvios: condensação e calor da costa, canais de distribuição na garganta e apoios para cargas nas forjas. E analisa; J acompanha os três relatórios, aceitos e ainda por investigar/entregar. As inscrições e o registro de basalto originais continuam obrigatórios. Chegadas diretas simulam Warden, Soterrado, Vésper e apenas os requisitos anteriores ao trecho. O Incandescente continua vivo, sem recompensa ou registro final; sua arena não é liberada pela prévia. Sem chegada selecionada, começa do zero na base. Seus personagens e progresso reais estão protegidos. Para coop, volte ao início, crie a equipe e percorra a campanha; o convite conserva o laboratório.';
 }

}
if(depthTest){
 details.classList.add('is-mobile-lab');details.querySelector('summary')!.textContent='EXPEDIÇÕES REGIONAIS · DO ZERO · TESTE RESERVADO';details.querySelector('.mission-lab-stages')?.remove();
 for(const p of Array.from(details.querySelectorAll('p')))if(!p.querySelector('[data-reset]')&&!p.hasAttribute('data-lab-notice'))p.remove();
 const text=document.createElement('p');text.textContent='Comece com Nara. Lia e Ivo também oferecem expedições conforme a campanha avança. Há três descobertas em cada região ampliada: analise os locais, inclusive antes de aceitar o relatório. J abre as abas Campanha e Expedições regionais. Seus saves reais estão protegidos.';details.querySelector('summary')!.after(text);
 const {REGION_NAMES}=await import('../../config/economy'),{REGIONAL_MISSIONS}=await import('../../config/regionalExpeditions');
 const select=document.createElement('select');select.name='regional-preview';select.setAttribute('aria-label','Região para simular no laboratório');
 for(const m of REGIONAL_MISSIONS){const option=document.createElement('option');option.value=m.region!;option.textContent=REGION_NAMES[m.region!];select.append(option);}
 const button=document.createElement('button');button.textContent='SIMULAR EXPLORAÇÃO NESTA REGIÃO';button.dataset.preview='';
 button.onclick=()=>{if(!confirm('SIMULAÇÃO SOLO: preparar personagens temporários com a campanha anterior e os bosses concluídos? Use apenas para avaliar as novas descobertas. Para jogar do zero, cancele.'))return;const scene=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;const ok=scene.seedRegionalPlaytest(select.value as import('../../systems/LocalJourney').JourneyArea);details.querySelector('[data-lab-notice]')!.textContent=ok?'Simulação preparada nesta aba. Os bosses anteriores estão considerados derrotados.':'Feche os menus. A simulação rápida é exclusiva do teste solo; o coop percorre a campanha normalmente.';if(ok){set.call(sessionStorage,prefix+'simulated','1');details.querySelector('summary')!.textContent='SIMULAÇÃO REGIONAL · CAMPANHA E BOSSES CONCLUÍDOS';details.open=false;}};
 details.append(select,button);
}
if(new URLSearchParams(location.search).has('journey')){
 details.classList.add('is-mobile-lab');details.querySelector('summary')!.textContent='CAMPANHA DO ZERO · HUD E PROGRESSÃO · LAB';
 details.querySelector('.mission-lab-stages')?.remove();
 const note=document.createElement('p');note.textContent='Sem campanha pré-concluída: aceite a missão de Nara e explore a Floresta. O atlas só permite retornar a rotas já liberadas. Seus saves reais estão protegidos.';details.querySelector('summary')!.after(note);
}
if(get.call(sessionStorage,prefix+'simulated')==='1')details.querySelector('summary')!.textContent='SIMULAÇÃO ATIVA · PROGRESSO ANTERIOR PREPARADO';
if(missionTest)for(const b of Array.from(details.querySelectorAll<HTMLButtonElement>('[data-stage]')))b.onclick=()=>{
 if(!confirm('SIMULAÇÃO DE TESTE: concluir relatórios anteriores nesta aba? Etapas após o Warden também marcam esse boss como derrotado. Para jogar a jornada completa, cancele.'))return;
 const scene=game.scene.getScene('Game') as import('../../scenes/GameScene').GameScene;
 const ok=scene?.sys.isActive()&&scene.seedMissionPlaytest(b.dataset.stage as import('../../config/missions').MissionId);
 details.querySelector('[data-lab-notice]')!.textContent=ok?'Etapa preparada no teste temporário. Converse com o NPC indicado.':'Feche os menus e reúna a equipe; somente o anfitrião prepara etapas no cooperativo.';
 if(ok){set.call(sessionStorage,prefix+'simulated','1');details.querySelector('summary')!.textContent='SIMULAÇÃO ATIVA · PROGRESSO ANTERIOR PREPARADO';details.open=true;}
};
