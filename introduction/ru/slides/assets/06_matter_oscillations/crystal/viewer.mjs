import * as THREE from './vendor/three.module.js';
import {field, coefficients, eigenbasis, polarization, TAU, N1, N2, sampleFrame} from './model.mjs';
import {mathHTML, rich, fontsReady} from './typeset.mjs';

const $ = id => document.getElementById(id);
// Words of the page, by <html lang>: anything not starting with "en" is Russian.
const T = {
  ru: {
    comma: true,
    webgl: 'Для объёмной сцены нужен браузер с WebGL 2.',
    kinds: {linear: 'Линейная поляризация', circular: 'Круговая поляризация', elliptical: 'Эллиптическая поляризация'},
    single: n => 'Вход вдоль оси ' + n + ': возбуждено одно собственное состояние. Поляризация сохраняется.',
    zero: 'Толщина равна нулю: на выходе та же линейная поляризация, что на входе.',
    circular: shift => 'Две равные составляющие со сдвигом ' + shift + ' дают круговую поляризацию.',
    restored: 'Относительная фаза набежала на полный период: входная поляризация восстановилась.',
    turned: 'Сумма снова линейно поляризована; направление на выходе изменилось.',
    elliptical: 'Две составляющие колеблются с разными фазами. Конец суммарного вектора описывает эллипс.',
    aria: (kind, shift) => kind + ' на выходе; разность фаз ' + shift,
    pause: 'Пауза',
    resume: 'Продолжить'
  },
  en: {
    comma: false,
    webgl: 'The 3D scene needs a browser with WebGL 2.',
    kinds: {linear: 'Linear polarization', circular: 'Circular polarization', elliptical: 'Elliptical polarization'},
    single: n => 'Input along axis ' + n + ': a single eigenstate is excited. The polarization is preserved.',
    zero: 'The thickness is zero: the output has the same linear polarization as the input.',
    circular: shift => 'Two equal components shifted in phase by ' + shift + ' give circular polarization.',
    restored: 'The relative phase has advanced by a full period: the input polarization is restored.',
    turned: 'The sum is linearly polarized again; its direction at the output has changed.',
    elliptical: 'The two components oscillate with different phases. The tip of the total vector traces an ellipse.',
    aria: (kind, shift) => kind + ' at the output; phase difference ' + shift,
    pause: 'Pause',
    resume: 'Resume'
  }
}[/^en/i.test(document.documentElement.lang || '') ? 'en' : 'ru'];
const query = new URLSearchParams(location.search);
if(query.has('embed'))document.body.classList.add('embed');
const numeric = (key, fallback, min, max) => {
  const n = query.has(key) ? Number(query.get(key)) : fallback;
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const state = {
  input: numeric('input', 0, 0, 180),
  axes: numeric('axes', 45, 0, 180),
  length: numeric('length', 1, 0, 4)
};
let time = numeric('time', .22, 0, 1000);
let playing = !query.has('paused') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
const colors = {one: '#59e6f2', two: '#ffd659', sum: '#f7faff', dim: '#9eb3d1', bg: '#03060c'};
const worldWavelength = 2.2, amplitude = .92;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas: $('crystal'), antialias: true, alpha: false, preserveDrawingBuffer: true});
} catch (error) {
  $('error').hidden = false;
  $('error').textContent = T.webgl;
  throw error;
}
renderer.setClearColor(colors.bg);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-8, 8, 4, -4, .1, 100);
camera.position.set(5.5, 4.2, 15);
camera.lookAt(0, 0, 0);
scene.add(new THREE.AmbientLight(0xb7d8ff, 1.1));
const light = new THREE.DirectionalLight(0xd0e9ff, 2.0);
light.position.set(-2, 7, 8); scene.add(light);
const rim = new THREE.DirectionalLight(0x66a8e8, 1.4);
rim.position.set(4, -3, -5); scene.add(rim);

const crystal = new THREE.Group(); scene.add(crystal);
const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 2.65, 2.65),
  new THREE.MeshPhongMaterial({color: 0x64b9df, transparent:true, opacity:.09,
    shininess:80, specular:0xa8d5f5, side:THREE.DoubleSide, depthWrite:false}));
cube.renderOrder = 0; crystal.add(cube);
const edges = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry),
  new THREE.LineBasicMaterial({color:0x7ba5c3, transparent:true, opacity:.48, depthWrite:false}));
crystal.add(edges);
// Faint polarization planes inside the crystal show the two distinct directions.
const polarizationPlanes = [colors.one, colors.two].map(color => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.35), new THREE.MeshBasicMaterial({color,
    transparent:true, opacity:.035, side:THREE.DoubleSide, depthWrite:false}));
  scene.add(p); return p;
});

function line(points, color, opacity = 1, dashed = false) {
  const geom = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
  const mat = dashed ? new THREE.LineDashedMaterial({color, transparent:true, opacity,
    dashSize:.09, gapSize:.09, depthWrite:false}) :
    new THREE.LineBasicMaterial({color, transparent:true, opacity, depthWrite:false});
  const l = new THREE.Line(geom, mat); if (dashed) l.computeLineDistances(); scene.add(l); return l;
}
const beam = line([[-7.0,0,0],[7.0,0,0]], 0x72869b, .36, true);
const tip = new THREE.Mesh(new THREE.ConeGeometry(.045, .20, 12), new THREE.MeshBasicMaterial({color:0x8ca5bd}));
tip.rotation.z = -Math.PI/2; tip.position.set(6.95,0,0); scene.add(tip);
const endAxes = [];
for (let side = 0; side < 2; side++) {
  const g = new THREE.Group(); scene.add(g);
  const l1 = line([[0,-1.4,0],[0,1.4,0]], colors.one, .65);
  const l2 = line([[0,0,-1.4],[0,0,1.4]], colors.two, .65);
  scene.remove(l1,l2); g.add(l1,l2); endAxes.push(g);
}

function tube(count, radius, color, opacity=1) {
  const sides = 7, vertices = new Float32Array((count + 1) * sides * 3), indices = [];
  for(let i=0;i<count;i++) for(let j=0;j<sides;j++) {
    const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
    indices.push(a,c,b,b,c,d);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(vertices,3).setUsage(THREE.DynamicDrawUsage));
  geom.setIndex(indices);
  const mesh = new THREE.Mesh(geom,new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
  mesh.frustumCulled=false; mesh.renderOrder=3; scene.add(mesh);
  return {mesh,geom,vertices,count,sides,radius};
}
const waves = [tube(230,.013,colors.one),tube(230,.013,colors.two),tube(560,.020,colors.sum)];
const stems = [0,1,2].map((kind) => {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.BufferAttribute(new Float32Array(42*6),3).setUsage(THREE.DynamicDrawUsage));
  const l = new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:kind===0?colors.one:kind===1?colors.two:colors.sum,
    transparent:true,opacity:kind===2?.15:.20,depthWrite:false}));
  l.frustumCulled=false; scene.add(l); return l;
});
const outputTrace = line(Array.from({length:161},()=>[0,0,0]),colors.sum,.40);
outputTrace.frustumCulled = false;
const instant = [colors.one, colors.two, colors.sum].map(color => {
  const g=new THREE.Group();
  const mat=new THREE.MeshBasicMaterial({color,depthWrite:false});
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.013,.013,1,8),mat);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.045,.14,12),mat);
  g.add(shaft,head);scene.add(g); return {g,shaft,head};
});

function arrow3d(a,start,end) {
  const from=new THREE.Vector3(...start),to=new THREE.Vector3(...end),dir=to.clone().sub(from),length=dir.length();
  a.g.visible=length>.015; if(!a.g.visible)return;
  const headLength=Math.min(.14,length*.4);dir.normalize();
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  a.shaft.quaternion.copy(rotation);a.shaft.scale.y=Math.max(.001,length-headLength);
  a.shaft.position.copy(from).addScaledVector(dir,(length-headLength)/2);
  a.head.quaternion.copy(rotation);a.head.scale.setScalar(headLength/.14);
  a.head.position.copy(from).addScaledVector(dir,length-headLength/2);
}

let width=1,height=1;
const entry = () => -state.length*worldWavelength/2;
const exit = () => state.length*worldWavelength/2;
function sample(x,t) {return field((x-entry())/worldWavelength,t,state);}

function fillTube(w,kind,start,end) {
  const {vertices:p,count,sides,radius} = w;
  w.mesh.visible = end-start>.001;
  if(!w.mesh.visible)return;
  for(let i=0;i<=count;i++) {
    const x=start+(end-start)*i/count, f=sample(x,time), vec=kind===2?f.total:f.components[kind];
    const eps=.0005,f2=sample(x+eps,time),v2=kind===2?f2.total:f2.components[kind];
    let ty=amplitude*(v2[0]-vec[0])/eps,tz=amplitude*(v2[1]-vec[1])/eps;
    const tl=Math.hypot(1,ty,tz),tx=1/tl;ty/=tl;tz/=tl;
    const nl=Math.hypot(ty,tx),ny=tx/nl,nx=-ty/nl;
    const bx=-tz*ny,by=tz*nx,bz=tx*ny-ty*nx;
    for(let j=0;j<sides;j++) {
      const a=TAU*j/sides,c=radius*Math.cos(a),s=radius*Math.sin(a),k=(i*sides+j)*3;
      p[k]=x+c*nx+s*bx;p[k+1]=amplitude*vec[0]+c*ny+s*by;p[k+2]=amplitude*vec[1]+s*bz;
    }
  }
  w.geom.attributes.position.needsUpdate=true;
}

function updateStems(l,kind,start,end) {
  const p=l.geometry.attributes.position.array,n=kind===2?34:16;
  l.visible=end-start>.001;
  for(let i=0;i<n;i++) {
    const x=start+(end-start)*(i+.5)/n,f=sample(x,time),v=kind===2?f.total:f.components[kind];
    p.set([x,0,0,x,amplitude*v[0],amplitude*v[1]],i*6);
  }
  l.geometry.setDrawRange(0,n*2);l.geometry.attributes.position.needsUpdate=true;
}

function placeLabel(id,point,dx=0,dy=0) {
  const p=new THREE.Vector3(...point).project(camera),el=$(id);
  const x=(p.x+1)*width/2+dx, y=(1-p.y)*height/2+dy;
  el.style.left=Math.max(30,Math.min(width-30,x))+'px';el.style.top=Math.max(20,Math.min(height-42,y))+'px';
}

function draw3d() {
  const L=state.length*worldWavelength,a=state.axes*Math.PI/180;
  crystal.rotation.x=a;cube.scale.x=Math.max(.002,L);edges.scale.x=Math.max(.002,L);
  cube.visible=L>.005;
  endAxes.forEach((g,i)=>{g.position.x=i?exit():entry();g.rotation.x=a;});
  polarizationPlanes.forEach((p,i)=>{p.scale.x=L;p.rotation.x=a+i*Math.PI/2;p.visible=L>.005;});
  fillTube(waves[0],0,entry(),exit());fillTube(waves[1],1,entry(),exit());fillTube(waves[2],2,-6.75,6.75);
  updateStems(stems[0],0,entry(),exit());updateStems(stems[1],1,entry(),exit());updateStems(stems[2],2,-6.75,6.75);
  const p=outputTrace.geometry.attributes.position.array;
  for(let i=0;i<=160;i++) {
    const v=field(state.length,i/160,state).total;
    p.set([exit()+.025,amplitude*v[0],amplitude*v[1]],i*3);
  }
  outputTrace.geometry.attributes.position.needsUpdate=true;
  const f=field(state.length,time,state),x=exit()+.035;
  const v1=f.components[0].map(v=>v*amplitude),v2=f.components[1].map(v=>v*amplitude),sum=f.total.map(v=>v*amplitude);
  arrow3d(instant[0],[x,0,0],[x,...v1]);
  arrow3d(instant[1],[x,...v1],[x,...sum]);
  arrow3d(instant[2],[x,0,0],[x,...sum]);
  const u=eigenbasis(state.axes);
  placeLabel('entry-label',[-5.35,1.6,0]);placeLabel('exit-label',[5.15,1.6,0]);
  placeLabel('axis-one',[entry(),u[0][0]*1.65,u[0][1]*1.65],-10,-4);
  placeLabel('axis-two',[entry(),u[1][0]*1.65,u[1][1]*1.65],-10,-4);
  renderer.render(scene,camera);
}

function arrow2d(ctx,x,y,dx,dy,color,width=2) {
  const l=Math.hypot(dx,dy);if(l<1.5)return;
  const a=Math.atan2(dy,dx),head=Math.min(8,l*.32);
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+dx,y+dy);
  ctx.lineTo(x+dx-head*Math.cos(a-.4),y+dy-head*Math.sin(a-.4));
  ctx.lineTo(x+dx-head*Math.cos(a+.4),y+dy-head*Math.sin(a+.4));ctx.closePath();ctx.fill();
}

function drawSection(id,z,isOutput) {
  const canvas=$(id),ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const size=Math.max(13,Math.min(16,w/15)),cx=w*.48,cy=h*.5+size*.3,r=Math.max(10,Math.min(w*.36,h/2-size-6));
  ctx.strokeStyle='#263447';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  ctx.strokeStyle='#263447';ctx.beginPath();ctx.moveTo(cx-r-5,cy);ctx.lineTo(cx+r+5,cy);ctx.moveTo(cx,cy-r-5);ctx.lineTo(cx,cy+r+5);ctx.stroke();
  rich(ctx,'$H$',cx+r+10,cy+size*.35,size,colors.dim);rich(ctx,'$V$',cx,cy-r-10,size,colors.dim,'center');
  const u=eigenbasis(state.axes);
  if(isOutput)u.forEach((v,i)=>{
    ctx.strokeStyle=i?colors.two:colors.one;ctx.globalAlpha=.27;ctx.setLineDash([3,5]);ctx.beginPath();
    ctx.moveTo(cx-r*v[0],cy+r*v[1]);ctx.lineTo(cx+r*v[0],cy-r*v[1]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  });
  ctx.strokeStyle=isOutput?'#b9c9da':'#75889f';ctx.lineWidth=1.5;ctx.beginPath();
  for(let i=0;i<=160;i++) {
    const v=field(z,i/160,state).total,x=cx+r*v[0],y=cy-r*v[1];
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
  }ctx.stroke();
  const f=field(z,time,state);
  if(isOutput) {
    const a=f.components[0],b=f.components[1],s=f.total;
    ctx.strokeStyle='#526174';ctx.globalAlpha=.6;ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();
    ctx.moveTo(cx,cy);ctx.lineTo(cx+r*b[0],cy-r*b[1]);ctx.lineTo(cx+r*s[0],cy-r*s[1]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
    arrow2d(ctx,cx,cy,r*a[0],-r*a[1],colors.one,2.5);
    arrow2d(ctx,cx+r*a[0],cy-r*a[1],r*b[0],-r*b[1],colors.two,2.5);
  }
  arrow2d(ctx,cx,cy,r*f.total[0],-r*f.total[1],colors.sum,2.8);
}

const fmt=(n,d=0)=>T.comma?n.toFixed(d).replace('.',','):n.toFixed(d);
function phaseLabel(delta) {
  const x=delta/Math.PI;
  for(const [v,text] of [[0,'0'],[.5,'π/2'],[1,'π'],[1.5,'3π/2'],[2,'2π']])if(Math.abs(x-v)<.006)return text;
  return fmt(x,2)+'π';
}
function updateReadouts() {
  $('input-value').textContent=fmt(state.input)+'°';$('axes-value').textContent=fmt(state.axes)+'°';
  $('length-value').innerHTML=mathHTML(fmt(state.length,2)+' $λ_0$');
  const p=polarization(state),c=coefficients(state.input,state.axes);
  $('phase').innerHTML=mathHTML('$Δφ$ = $'+phaseLabel(p.delta)+'$');
  const kind=T.kinds[p.kind];
  $('output-kind').textContent=kind;
  if(Math.min(Math.abs(c[0]),Math.abs(c[1]))<.015) {
    const n=Math.abs(c[0])>Math.abs(c[1])?1:2;
    $('explanation').textContent=T.single(n);
  } else if(state.length<.006) {
    $('explanation').textContent=T.zero;
  } else if(p.kind==='circular') {
    $('explanation').textContent=T.circular(phaseLabel(p.delta));
  } else if(p.kind==='linear') {
    const diff=Math.abs(((p.tilt-state.input+270)%180)-90);
    $('explanation').textContent=diff<1?T.restored:T.turned;
  } else {
    $('explanation').textContent=T.elliptical;
  }
  $('output-section').setAttribute('aria-label',T.aria(kind,phaseLabel(p.delta)));
}

function draw() {draw3d();drawSection('input-section',0,false);drawSection('output-section',state.length,true);}
function resize() {
  const box=$('scene').getBoundingClientRect();width=box.width;height=box.height;
  const aspect=width/height,vertical=Math.max(4.9,15.4/aspect);
  camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);draw();
}
for(const [id,key] of [['input-angle','input'],['axes-angle','axes'],['length','length']]) {
  $(id).value=state[key];$(id).addEventListener('input',event=>{state[key]=Number(event.target.value);updateReadouts();draw();});
}
function updatePlay() {$('play').textContent=playing?T.pause:T.resume;$('play').setAttribute('aria-pressed',String(playing));}
$('play').addEventListener('click',()=>{playing=!playing;last=null;updatePlay();});
new ResizeObserver(resize).observe($('scene'));
let last=null;
function animate(now) {
  if(playing&&document.visibilityState!=='hidden') {
    if(last!==null)time+=(Math.min(70,now-last)/1000)/3.6;
    draw();
  }
  last=now;requestAnimationFrame(animate);
}
// Film exporters can request the same state at an exact optical phase.
window.crystalOptics={
  frame(t,parameters={}) {
    for(const k of ['input','axes','length'])if(Number.isFinite(parameters[k]))state[k]=parameters[k];
    time=t;playing=false;updatePlay();
    for(const [id,key] of [['input-angle','input'],['axes-angle','axes'],['length','length']])$(id).value=state[key];
    updateReadouts();draw();
  },
  sample:(parameters,t,count)=>sampleFrame(parameters,t,count),
  get state(){return {...state,time,playing};}
};
updateReadouts();updatePlay();resize();fontsReady.then(draw);requestAnimationFrame(animate);
