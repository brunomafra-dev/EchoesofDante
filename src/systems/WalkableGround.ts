import type {Vec2} from '../utils/math';

/** An authored ground contour, independent of the picture and of Phaser. */
export function insideGround(point:Vec2,contour:readonly Vec2[]):boolean{
 let inside=false;
 for(let i=0,j=contour.length-1;i<contour.length;j=i++){
  const a=contour[i],b=contour[j];
  if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}

// Navigation and arrival use the exact movement contour, including edge clearance.
export function fitsGround(position:Vec2,radius:number,contour:readonly Vec2[],footY=0):boolean{
 const probe={...position};constrainGround(probe,radius,contour,footY);
 return Math.hypot(probe.x-position.x,probe.y-position.y)<.01;
}

/** Keep a circular footprint inside a concave, connected walkable surface. */
export function constrainGround(position:Vec2,radius:number,contour:readonly Vec2[],footY=0):void{
 if(contour.length<3)return;
 const p={x:position.x,y:position.y+footY};
 for(let pass=0;pass<4;pass++){
  let best=Infinity,qx=0,qy=0,edgeX=0,edgeY=0;
  for(let i=0;i<contour.length;i++){
   const a=contour[i],b=contour[(i+1)%contour.length],dx=b.x-a.x,dy=b.y-a.y;
   const length2=dx*dx+dy*dy;if(!length2)continue;
   const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length2));
   const x=a.x+t*dx,y=a.y+t*dy,d=(p.x-x)**2+(p.y-y)**2;
   if(d<best){best=d;qx=x;qy=y;edgeX=dx;edgeY=dy;}
  }
  const inside=insideGround(p,contour),distance=Math.sqrt(best);
  if(inside&&distance>=radius-.001)break;
  let nx=p.x-qx,ny=p.y-qy;
  if(distance>.00001){const sign=inside?1:-1;nx=nx/distance*sign;ny=ny/distance*sign;}
  else{
   let area=0;for(let i=0;i<contour.length;i++){const a=contour[i],b=contour[(i+1)%contour.length];area+=a.x*b.y-b.x*a.y;}
   const length=Math.hypot(edgeX,edgeY),sign=area>=0?1:-1;nx=-edgeY/length*sign;ny=edgeX/length*sign;
  }
  p.x=qx+nx*(radius+.001);p.y=qy+ny*(radius+.001);
 }
 position.x=p.x;position.y=p.y-footY;
}
