import * as T from 'three';
type NumberView={node:HTMLSpanElement;position:T.Vector3;age:number;amount:number;target:string;lane:number};
/** Confirmed HP changes only. Bounded DOM pool; no canvas textures per hit. */
export class DamageNumbers{
 private readonly pool:NumberView[]=[];private cursor=0;private sequence=0;private recent:{amount:number;target:string}[]=[];
 constructor(parent:HTMLElement){for(let i=0;i<28;i++){const node=document.createElement('span');node.className='damage-number';node.hidden=true;node.setAttribute('aria-hidden','true');parent.append(node);this.pool.push({node,position:new T.Vector3(),age:2,amount:0,target:'',lane:0});}}
 show(position:T.Vector3,amount:number,target:string){if(!Number.isFinite(amount)||amount<=0)return;const n=this.pool[this.cursor++%this.pool.length];n.position.copy(position);n.age=0;n.amount=amount;n.target=target;n.lane=(this.sequence++%3)-1;n.node.textContent=String(Math.max(1,Math.round(amount)));n.node.classList.toggle('is-hurt',target==='hero');n.node.hidden=false;this.recent.push({amount,target});if(this.recent.length>16)this.recent.shift();}
 update(dt:number,camera:T.Camera,width:number,height:number){const p=new T.Vector3();for(const n of this.pool){n.age+=dt;if(n.age>=.85){n.node.hidden=true;continue;}p.copy(n.position);p.y+=n.age*.85;p.project(camera);const visible=p.z>=-1&&p.z<=1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1;n.node.hidden=!visible;if(visible){n.node.style.transform=`translate(${(p.x*.5+.5)*width+n.lane*13}px,${(-p.y*.5+.5)*height}px) translate(-50%,-100%) scale(${1+Math.max(0,1-n.age/.14)*.22})`;n.node.style.opacity=String(Math.min(1,(.85-n.age)/.25));}}}
 clear(){for(const n of this.pool){n.age=2;n.node.hidden=true;}this.recent=[];}
 inspect(){return{active:this.pool.filter(n=>n.age<.85).map(n=>({amount:n.amount,target:n.target,text:n.node.textContent,visible:!n.node.hidden})),recent:this.recent.slice(),capacity:this.pool.length};}
 dispose(){this.pool.forEach(n=>n.node.remove());this.pool.length=0;}
}
