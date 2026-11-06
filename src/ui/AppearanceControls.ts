import{PRESENTATION,appearance,type CharacterAppearance}from'../config/characterPresentation';
/** Native labelled controls work with keyboard, touch and shell gamepad focus. */
export function appearanceControls(value:unknown,change:(look:CharacterAppearance)=>void):HTMLFieldSetElement{
 const state=appearance(value),root=document.createElement('fieldset');root.className='appearance-controls';
 const title=document.createElement('legend');title.textContent='Personalizar aparência';root.append(title);
 for(const key of ['head','skin','hair']as const){
  const label=document.createElement('label');label.textContent={head:'Rosto e corte',skin:'Tom de pele',hair:'Cor do cabelo'}[key];
  const select=document.createElement('select');select.name='appearance-'+key;
  for(const[id,text]of Object.entries(PRESENTATION[key])){const option=document.createElement('option');option.value=id;option.textContent=text;select.append(option);}
  select.value=state[key];select.addEventListener('change',()=>{Object.assign(state,{[key]:select.value});change(appearance(state));});label.append(select);root.append(label);
 }
 const note=document.createElement('small');note.textContent='Rosto e corte usam pinturas completas. Capacetes cobrem o cabelo.';root.append(note);return root;
}
