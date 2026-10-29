/* Rasterized cube geometry. The BRDF body is supplied by the shared material preview. */
export class CubeMaterialPreview{
 constructor(gl,shading){this.gl=gl;const g=gl;this.program=g.createProgram();
 const vertex=`#version 300 es
 precision highp float;layout(location=0)in vec3 position;layout(location=1)in vec3 normal;layout(location=2)in vec3 tangent;layout(location=3)in vec3 bitangent;layout(location=4)in vec2 texcoord;uniform mat3 rotation;uniform float zoom;out vec3 faceN,faceT,faceB;out vec2 faceUV;
 vec3 world(vec3 v){return rotation*v;}
 void main(){vec3 p=world(position);faceN=world(normal);faceT=world(tangent);faceB=world(bitangent);faceUV=texcoord;gl_Position=vec4(p.xy*zoom/1.3,-p.z*.25,1);}`;
 const fragment=`#version 300 es
 precision highp float;out vec4 color;uniform sampler2D nmap,rmap,amap,omap,hmap,imap;uniform bool inspect;uniform vec3 light;uniform float intensity;uniform bool dx,showHeight;const float PI=3.14159265;
 vec3 linearRGB(vec3 x){return mix(x/12.92,pow((x+.055)/1.055,vec3(2.4)),step(vec3(.04045),x));}
 in vec3 faceN,faceT,faceB;in vec2 faceUV;void main(){vec3 N=normalize(faceN),T=normalize(faceT),B=normalize(faceB);vec2 st=faceUV;${shading}`;
 for(const [type,text]of [[g.VERTEX_SHADER,vertex],[g.FRAGMENT_SHADER,fragment]]){const shader=g.createShader(type);g.shaderSource(shader,text);g.compileShader(shader);if(!g.getShaderParameter(shader,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(shader));g.attachShader(this.program,shader);g.deleteShader(shader);}g.linkProgram(this.program);if(!g.getProgramParameter(this.program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(this.program));
 const vertices=[],faces=[[[1,0,0],[0,0,-1],[0,1,0]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[1,0,0],[0,0,-1]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[-1,0,0],[0,1,0]]];
 for(const [n,t,b]of faces)for(const [u,v]of [[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]])vertices.push(...n.map((x,i)=>.65*(x+u*t[i]+v*b[i])),...n,...t,...b,(u+1)/2,(1-v)/2);
 this.vao=g.createVertexArray();this.buffer=g.createBuffer();g.bindVertexArray(this.vao);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(vertices),g.STATIC_DRAW);for(let i=0;i<5;i++){g.enableVertexAttribArray(i);g.vertexAttribPointer(i,i===4?2:3,g.FLOAT,false,56,i*12);}g.bindVertexArray(null);
 }
 draw(textures,{azimuth,elevation,intensity,convention,showHeight,inspect=false,yaw=.6,pitch=.4,zoom=1}){const g=this.gl,p=this.program;g.useProgram(p);g.bindFramebuffer(g.FRAMEBUFFER,null);g.bindVertexArray(this.vao);g.enable(g.DEPTH_TEST);g.clearColor(.90,.86,.82,1);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);textures.forEach((t,i)=>{g.activeTexture(g.TEXTURE0+i);g.bindTexture(g.TEXTURE_2D,t);g.uniform1i(g.getUniformLocation(p,['nmap','rmap','amap','omap','hmap','imap'][i]),i);});const a=azimuth*Math.PI/180,e=elevation*Math.PI/180;g.uniform3f(g.getUniformLocation(p,'light'),Math.cos(e)*Math.sin(a),Math.sin(e),Math.cos(e)*Math.cos(a));g.uniform1f(g.getUniformLocation(p,'intensity'),intensity);g.uniform1f(g.getUniformLocation(p,'zoom'),zoom);g.uniform1i(g.getUniformLocation(p,'dx'),convention==='dx');g.uniform1i(g.getUniformLocation(p,'showHeight'),showHeight);const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);g.uniformMatrix3fv(g.getUniformLocation(p,'rotation'),false,new Float32Array([cy,0,-sy,sy*sx,cx,cy*sx,sy*cx,-sx,cy*cx]));g.uniform1i(g.getUniformLocation(p,'inspect'),inspect);g.drawArrays(g.TRIANGLES,0,36);g.bindVertexArray(null);g.disable(g.DEPTH_TEST);if(g.getError()!==g.NO_ERROR)throw Error('Cube material preview failed to draw.');}
 dispose(){const g=this.gl;g.deleteBuffer(this.buffer);g.deleteVertexArray(this.vao);g.deleteProgram(this.program);}
}
