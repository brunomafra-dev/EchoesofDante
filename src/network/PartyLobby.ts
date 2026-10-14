import type { PartyMember } from './CoopSession';

// A short, read-only connection exposes occupied classes before a character is chosen.
// The relay still validates the seat atomically when joining; this is a preview.
export function inspectRoom(url:string,code:string):Promise<PartyMember[]> {
  return new Promise((resolve,reject)=>{
    const socket=new WebSocket(url);
    const timer=setTimeout(()=>finish(undefined,'Não foi possível consultar a sala. Tente novamente.'),60000);
    const finish=(members?:PartyMember[],error?:string)=>{
      clearTimeout(timer);socket.onclose=null;socket.onerror=null;socket.close();
      if(members)resolve(members);else reject(new Error(error));
    };
    socket.onopen=()=>socket.send(JSON.stringify({type:'inspect',code}));
    socket.onmessage=event=>{
      let m;try{m=JSON.parse(event.data);}catch{return;}
      if(m.type==='lobby'&&m.protocol===10&&Array.isArray(m.members)&&m.members.length<=4)finish(m.members);
      else if(m.type==='error')finish(undefined,String(m.message));
    };
    socket.onerror=()=>finish(undefined,'O servidor de salas está indisponível. Sua jornada solo continua disponível.');
    socket.onclose=()=>finish(undefined,'A consulta à sala foi interrompida.');
  });
}
