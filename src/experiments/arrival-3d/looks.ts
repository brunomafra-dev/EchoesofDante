import type{Appearance,Gender}from'./model';
export const HAIR_STYLES=[
 {id:0,name:'Sem cabelo'}, {id:1,name:'Curto'}, {id:2,name:'Repartido / coques'}, {id:3,name:'Longo'},
 {id:4,name:'Laterais raspadas'}, {id:5,name:'Rabo de cavalo'}, {id:6,name:'Cacheado curto'},
 {id:7,name:'Ondulado'}, {id:8,name:'Trança'}, {id:9,name:'Moicano curto'}, {id:10,name:'Coque alto'}, {id:11,name:'Entradas'},
] as const;
export const hairName=(id:number,gender:Gender)=>id===2?(gender==='female'?'Coques laterais':'Repartido'):HAIR_STYLES.find(s=>s.id===id)?.name??'Curto';
export const validHair=(id:unknown):id is number=>Number.isInteger(id)&&HAIR_STYLES.some(s=>s.id===id);
export type ArrivalNpcId='ivo'|'lia'|'nara'|'gui'|'elisa';
type NpcLook=Pick<Appearance,'gender'|'hair'|'beard'|'skin'|'hairColor'|'cloth'>&{beardColor?:string;age:string;reference:string};
/** One identity used in the world and workshop. References are the currently
 * shipped 2D actors; Gui also follows the user's requested older, bearded look. */
export const NPC_LOOKS:Record<ArrivalNpcId,NpcLook>={
 ivo:{gender:'male',hair:0,beard:true,skin:'#bc9778',hairColor:'#88847b',beardColor:'#aaa69b',cloth:'#747363',age:'Maduro · calvo, barba grisalha e óculos de oficina',reference:'ivo-work-r1'},
 lia:{gender:'female',hair:6,beard:false,skin:'#946748',hairColor:'#322b26',cloth:'#d2d0be',age:'Madura · cabelo curto cacheado e jaleco',reference:'lia-work-r1'},
 nara:{gender:'female',hair:10,beard:false,skin:'#c6a17f',hairColor:'#282522',cloth:'#797966',age:'Adulta · coque alto e lenço laranja',reference:'nara-work-r1'},
 gui:{gender:'male',hair:11,beard:true,skin:'#bf9572',hairColor:'#696158',beardColor:'#a09a8d',cloth:'#706a58',age:'Mais velho · entradas, bigode/barba grisalha e casaco',reference:'caio-motion-r4'},
 elisa:{gender:'female',hair:7,beard:false,skin:'#e0bd9b',hairColor:'#a94c28',cloth:'#c9c4b0',age:'Adulta · ruiva ondulada, camisa clara e colete',reference:'elisa-motion-r5'},
};
export const npcAppearance=(id:ArrivalNpcId,name:string):Appearance=>({name,classId:'warrior',...NPC_LOOKS[id]});
