import {coopSession as room} from '../network/CoopSession';
import {CHAT_LIMIT} from '../network/PartyChat';

// One DOM surface across scene travel. All content from the wire uses textContent.
export class CoopChat{
 readonly root=document.createElement('section');
 private readonly toggle=document.createElement('button');
 private readonly historyButton=document.createElement('button');
 private readonly log=document.createElement('ol');
 private readonly form=document.createElement('form');
 private readonly input=document.createElement('input');
 private readonly send=document.createElement('button');
 private readonly cancel=document.createElement('button');
 private readonly status=document.createElement('p');
 private readonly count=document.createElement('small');
 private expanded=false;private editing=false;private previousFocus?:HTMLElement;
 private awaitingDelivery?:number;
 get typing():boolean{return this.editing;}
 constructor(private readonly block:(typing:boolean)=>void){
  this.root.className='coop-chat';this.root.hidden=true;this.root.setAttribute('aria-label','Chat da equipe');
  this.toggle.type='button';this.toggle.textContent='CHAT · Enter / R3';this.toggle.dataset.chat='open';this.toggle.onclick=()=>this.open();
  this.historyButton.type='button';this.historyButton.textContent='HISTÓRICO';this.historyButton.dataset.chat='history';this.historyButton.setAttribute('aria-expanded','false');this.historyButton.onclick=()=>{this.expanded=!this.expanded;this.layout();};
  this.log.className='coop-chat-log';this.log.setAttribute('aria-label','Mensagens da equipe');this.log.setAttribute('aria-live','polite');this.log.setAttribute('aria-relevant','additions');
  this.input.type='text';this.input.name='team-message';this.input.maxLength=400;this.input.autocomplete='off';this.input.enterKeyHint='send';this.input.setAttribute('aria-label','Mensagem para a equipe');this.input.placeholder='Fale com a equipe…';
  this.input.oninput=()=>{this.input.value=Array.from(this.input.value).slice(0,CHAT_LIMIT).join('');this.counter();};
  this.send.type='submit';this.send.textContent='ENVIAR';this.send.dataset.chat='send';
  this.cancel.type='button';this.cancel.textContent='CANCELAR';this.cancel.dataset.chat='cancel';this.cancel.onclick=()=>this.close();
  this.form.append(this.input,this.count,this.send,this.cancel);this.form.onsubmit=e=>{e.preventDefault();this.submit();};
  this.status.setAttribute('role','status');this.status.className='coop-chat-status';
  this.root.append(this.toggle,this.historyButton,this.log,this.form,this.status);
  for(const event of ['pointerdown','pointerup','click','touchstart','touchend'])this.root.addEventListener(event,e=>e.stopPropagation());
  window.addEventListener('keydown',this.key,true);window.addEventListener('keyup',this.keyUp,true);
  window.addEventListener('dante-chat',this.refresh);window.addEventListener('dante-coop',this.session);
  document.body.append(this.root);this.refresh();this.layout();
 }
 private available():boolean{return (room.role==='host'||room.role==='guest')&&!room.endedMessage;}
 private counter():void{this.count.textContent=Array.from(this.input.value).length+'/200';}
 private layout():void{this.root.classList.toggle('is-writing',this.editing);this.form.hidden=!this.editing;this.toggle.hidden=this.editing;this.log.hidden=!this.expanded;this.historyButton.setAttribute('aria-expanded',String(this.expanded));this.counter();}
 private session=():void=>{this.root.hidden=!this.available();if(this.root.hidden)this.close(false);this.refresh();};
 private refresh=():void=>{
  this.input.readOnly=room.chatPending;this.send.disabled=room.chatPending;
  if(this.awaitingDelivery!==undefined&&room.chatDelivered>this.awaitingDelivery){this.awaitingDelivery=undefined;this.close();}
  else if(!room.chatPending)this.awaitingDelivery=undefined;
  const atBottom=this.log.scrollHeight-this.log.scrollTop-this.log.clientHeight<30;
  const ids=new Set(room.chatHistory.map(m=>m.id)),existing=new Set<string>();
  for(const li of Array.from(this.log.children) as HTMLElement[]){if(!ids.has(li.dataset.messageId!))li.remove();else existing.add(li.dataset.messageId!);}
  for(const m of room.chatHistory)if(!existing.has(m.id)){const li=document.createElement('li');li.dataset.messageId=m.id;const name=document.createElement('strong');name.textContent=m.name+': ';li.append(name,document.createTextNode(m.text));this.log.append(li);}
  if(atBottom||this.editing)this.log.scrollTop=this.log.scrollHeight;
  this.status.textContent=room.chatError||(room.chatPending?'Enviando…':!room.connected&&this.available()?'Reconectando a sala…':'');
 };
 open():void{if(!this.available()||this.editing)return;this.previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:undefined;this.editing=true;room.chatTyping=true;this.block(true);this.layout();this.input.focus({preventScroll:true});this.log.scrollTop=this.log.scrollHeight;}
 close(restore=true):void{if(!this.editing)return;this.awaitingDelivery=undefined;this.editing=false;room.chatTyping=false;this.input.value='';this.block(false);this.layout();if(restore&&this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});this.previousFocus=undefined;}
 private submit():void{if(!this.editing||room.chatPending)return;this.awaitingDelivery=room.chatDelivered;if(!room.sendChat(this.input.value))this.awaitingDelivery=undefined;}
 private key=(e:KeyboardEvent):void=>{
  if(!this.available())return;
  if(this.editing){
   e.stopImmediatePropagation();
   if(e.isComposing)return;
   if(e.code==='Escape'){e.preventDefault();this.close();}
   else if(e.code==='Enter'||e.code==='NumpadEnter'){e.preventDefault();if(!e.repeat)this.submit();}
   return;
  }
  if((e.code==='Enter'||e.code==='NumpadEnter')&&!e.repeat&&!(e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,[contenteditable="true"]'))&&!document.querySelector('dialog[open]:not(.application-shell)')){e.preventDefault();e.stopImmediatePropagation();this.open();}
 };
 private keyUp=(e:KeyboardEvent):void=>{if(this.editing)e.stopImmediatePropagation();};
 // Called by the existing shell gamepad loop, even while a lobby pauses Phaser.
 frame(parent:HTMLElement,down:boolean[],previous:boolean[]):boolean{
  if(this.root.parentElement!==parent){parent.append(this.root);if(this.editing)this.input.focus({preventScroll:true});}
  this.root.hidden=!this.available();if(this.root.hidden){this.close(false);return false;}
  const height=this.editing?Math.max(80,(window.visualViewport?.height??window.innerHeight)-16)+'px':'';if(this.root.style.maxHeight!==height)this.root.style.maxHeight=height;
  if(down[11]&&!previous[11])this.open();
  if(this.editing){
   const controls=[this.input,this.send,this.cancel],index=Math.max(0,controls.indexOf(document.activeElement as HTMLInputElement));
   if(down[13]&&!previous[13])controls[(index+1)%controls.length].focus();
   if(down[12]&&!previous[12])controls[(index+controls.length-1)%controls.length].focus();
   if(down[1]&&!previous[1])this.close();
   if(down[0]&&!previous[0]&&document.activeElement!==this.input)(document.activeElement as HTMLElement)?.click();
   return true;
  }return false;
 }
 destroy():void{this.close(false);window.removeEventListener('keydown',this.key,true);window.removeEventListener('keyup',this.keyUp,true);window.removeEventListener('dante-chat',this.refresh);window.removeEventListener('dante-coop',this.session);this.root.remove();}
}
