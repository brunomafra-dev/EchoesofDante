import type{Plugin}from'vite';import{existsSync,readFileSync}from'node:fs';import{resolve}from'node:path';
/** Licensed art stays ignored. Only an incorporated game module is emitted;
 * there is no standalone GLB URL or model download/library in the repo.
 * This is packaging, not an assertion of DRM or extraction-proof protection.
 */
export function arrivalHollow():Plugin{return{name:'arrival-incorporated-hollow',resolveId(id){if(id==='virtual:arrival-hollow')return'\0arrival-hollow';},load(id){if(id!=='\0arrival-hollow')return;const dir=process.env.DANTE_ARRIVAL_ART_DIR??'.local/combat188',file=resolve(dir,'spider-runtime.glb'),meta=resolve(dir,'spider-runtime.json');if(!existsSync(file)||!existsSync(meta))return'export default null;';this.addWatchFile(file);this.addWatchFile(meta);return'export default '+JSON.stringify({data:readFileSync(file).toString('base64'),meta:JSON.parse(readFileSync(meta,'utf8'))})+';';}};}
