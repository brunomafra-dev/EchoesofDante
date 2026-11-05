import * as T from 'three';
/** Visibility corridor on batched trees only. No transparent sorting or
 * per-tree geometry/material allocation. Physical objects stay unchanged. */
export class FoliageVisibility{
 private origin={value:new T.Vector3()};private direction={value:new T.Vector3()};private length={value:1};
 apply(material:T.Material){
  material.onBeforeCompile=shader=>{
   shader.uniforms.foliageOrigin=this.origin;shader.uniforms.foliageRay=this.direction;shader.uniforms.foliageLength=this.length;
   shader.vertexShader='varying vec3 foliagePosition;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nfoliagePosition=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='uniform vec3 foliageOrigin;uniform vec3 foliageRay;uniform float foliageLength;varying vec3 foliagePosition;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    vec3 sampleOffset=foliagePosition-foliageOrigin;float along=dot(sampleOffset,foliageRay);
    if(along>.1&&along<foliageLength+.15){
     vec3 offset=sampleOffset-foliageRay*along;float separationSquared=dot(offset,offset);
     float radius=mix(.45,1.05,clamp(along/foliageLength,0.,1.));
     if(separationSquared<radius*radius){
      if(separationSquared<(radius-.16)*(radius-.16))discard;
      float coverage=1.-smoothstep(radius-.16,radius,sqrt(separationSquared));
      float dither=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);
      if(coverage>dither)discard;
     }
    }
   `);
  };
  material.customProgramCacheKey=()=> 'dante-tree-visibility-193';material.needsUpdate=true;
 }
 update(target:T.Vector3,camera:T.Vector3){this.origin.value.copy(camera);this.direction.value.copy(target).sub(camera);this.length.value=Math.max(.001,this.direction.value.length());this.direction.value.divideScalar(this.length.value);}
}
