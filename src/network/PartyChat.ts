export type ChatMessage={id:string;author:string;name:string;text:string;at:number};
export const CHAT_LIMIT=200,CHAT_HISTORY=100,CHAT_DURATION=5000;
export function validChat(raw:unknown):raw is ChatMessage{
 const m=raw as ChatMessage|undefined;
 return !!m&&typeof m.id==='string'&&m.id.length<=64&&typeof m.author==='string'&&m.author.length<=64&&typeof m.name==='string'&&m.name.length<=24&&typeof m.text==='string'&&Array.from(m.text).length<=CHAT_LIMIT&&m.text.trim().length>0&&Number.isSafeInteger(m.at)&&m.at>0;
}
