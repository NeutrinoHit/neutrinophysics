import {createWaveScene} from './scene.mjs';
import {field,polarization,NU_THETA,NU_OSC_KM,neutrinoDistance,vacuumProbabilities,neutrinoProbabilities,matterParameters,SOLAR_A,SOLAR_NE_CM3,NU_ENERGY_EV,NU_DM2,TAU} from './model.mjs';
import {mathHTML,rich,fontsReady} from './typeset.mjs';

const $=id=>document.getElementById(id),query=new URLSearchParams(location.search);
const solarPair=query.get('pair')==='solar'||document.body.dataset.pair==='solar';
if(solarPair)document.body.classList.add('solar');
if(query.has('embed'))document.body.classList.add('embed');
const solar=matterParameters();
// Words of the page, by <html lang>: anything not starting with "en" is Russian.
const T={
 ru:{
  comma:true,km:' км',
  webgl:'Для объёмной сцены нужен браузер с WebGL 2.',
  kind:{linear:'Линейная поляризация',circular:'Круговая поляризация',elliptical:'Эллиптическая поляризация'},
  inputLine:(sym,angle)=>`На входе $ν_e$ · $${sym}$ = ${angle}°`,
  title:'Нейтрино: вакуум и солнечное вещество',h1:'Вакуум и солнечное вещество',
  lead:'Один вход $ν_e$, одинаковый путь — разные собственные оси и фазы.',
  vacuum:'Вакуум',solarMatter:'Солнечное вещество',sum:'Сумма $ψ$',
  entry:'Вход: $ν_e$',measure:'Измерение',
  canvasLabel:vac=>'Собственные волны нейтрино: '+(vac?'вакуум':'постоянная плотность солнечного вещества'),
  viewVacuum:'Нейтрино в вакууме',viewSolar:'Нейтрино в однородном солнечном веществе',
  note0:'Пространство состояний · общая фаза условна',
  note1:angle=>'Плотность постоянна на всём пути · $θ_m$ = '+angle+'°',
  path:'Путь нейтрино ',
  chartLabel:'Вероятность Px на одинаковом пути: вакуум и солнечное вещество',
  chartHead:'$P_x(L)$: вещество меняет и размах, и период',
  keyVac:(a,t)=>`вакуум — размах ${a}, период ${t} км`,
  keyMat:(a,t)=>`солнечное вещество — размах ${a}, период ${t} км`,
  chartAria:'Кривые Px(L) для вакуума и солнечного вещества с точками при текущем пути',
  footer:(e,dm,ne,a)=>`$E$ = ${e} МэВ · $Δm^2$ = ${dm}·10$^{−5}$ эВ$^2$ · $N_e$ ≈ ${ne}·10$^{25}$ см$^{−3}$ · $A$ = ${a} · два состояния · источник и измерение в однородной среде`,
  solarZero:'Путь равен нулю: обе среды дают $P_e$ = 1 и $P_x$ = 0.',
  solarText:(a,b)=>`Вещество меняет и оси, и период. Размах $P_x$: вакуум ${a}; солнечное вещество ${b}. Сравниваем одинаковый путь.`,
  lightInput:beta=>'На входе: β = '+beta+'°',
  lightAria:kind=>kind+' света на выходе',
  zero:'Путь равен нулю: на выходе νₑ с вероятностью 1. Свет сохраняет входную поляризацию.',
  half:px=>'Полпериода: превращение νₑ → νₓ максимально для выбранного угла; Pₓ = '+px+'.',
  full:'Полный период: нейтрино снова νₑ. Свет также восстановил входную поляризацию.',
  generic:'Толщина и путь связаны по одинаковому |Δφ|. Два угловых ползунка меняют только свет; вход нейтрино — всегда νₑ.',
  pause:'Пауза',resume:'Продолжить'
 },
 en:{
  comma:false,km:' km',
  webgl:'The 3D scene needs a browser with WebGL 2.',
  kind:{linear:'Linear polarization',circular:'Circular polarization',elliptical:'Elliptical polarization'},
  inputLine:(sym,angle)=>`Input $ν_e$ · $${sym}$ = ${angle}°`,
  title:'Neutrinos: vacuum and solar matter',h1:'Vacuum and solar matter',
  lead:'One input $ν_e$, the same distance: different eigenaxes and phases.',
  vacuum:'Vacuum',solarMatter:'Solar matter',sum:'Sum $ψ$',
  entry:'Input: $ν_e$',measure:'Measurement',
  canvasLabel:vac=>'Neutrino eigenwaves: '+(vac?'vacuum':'constant density of solar matter'),
  viewVacuum:'Neutrino in vacuum',viewSolar:'Neutrino in uniform solar matter',
  note0:'State space · the overall phase is conventional',
  note1:angle=>'The density is constant along the whole path · $θ_m$ = '+angle+'°',
  path:'Neutrino path ',
  chartLabel:'Probability Px over the same distance: vacuum and solar matter',
  chartHead:'$P_x(L)$: matter changes both the amplitude and the period',
  keyVac:(a,t)=>`vacuum — amplitude ${a}, period ${t} km`,
  keyMat:(a,t)=>`solar matter — amplitude ${a}, period ${t} km`,
  chartAria:'Px(L) curves for vacuum and solar matter, with points at the current distance',
  footer:(e,dm,ne,a)=>`$E$ = ${e} MeV · $Δm^2$ = ${dm}×10$^{−5}$ eV$^2$ · $N_e$ ≈ ${ne}×10$^{25}$ cm$^{−3}$ · $A$ = ${a} · two states · source and detector in a uniform medium`,
  solarZero:'The distance is zero: both media give $P_e$ = 1 and $P_x$ = 0.',
  solarText:(a,b)=>`Matter changes both the axes and the period. Amplitude of $P_x$: vacuum ${a}; solar matter ${b}. We compare the same distance.`,
  lightInput:beta=>'Input: β = '+beta+'°',
  lightAria:kind=>kind+' of the light at the output',
  zero:'The distance is zero: the output is νₑ with probability 1. The light keeps its input polarization.',
  half:px=>'Half a period: the νₑ → νₓ conversion is maximal for the chosen angle; Pₓ = '+px+'.',
  full:'A full period: the neutrino is νₑ again. The light has also recovered its input polarization.',
  generic:'The thickness and the distance are tied to the same |Δφ|. The two angle sliders change only the light; the neutrino input is always νₑ.',
  pause:'Pause',resume:'Resume'
 }
}[/^en/i.test(document.documentElement.lang||'')?'en':'ru'];
const makeScene=(root,state)=>{
 try{return createWaveScene(root,state);}
 catch(error){root.querySelector('[data-id="error"]').textContent=T.webgl;throw error;}
};
const fmt=(n,d=0)=>T.comma?n.toFixed(d).replace('.',','):n.toFixed(d);
// Amplitudes and periods of P_x(L) follow from the model: sin^2 2theta and L_osc in vacuum, sin^2 2theta_m and L_osc/R in matter.
const vacuumMax=vacuumProbabilities(NU_OSC_KM/2).px;
const probabilityMarkup=prefix=>`<p class="muted">${mathHTML(T.inputLine(prefix==='vac'?'θ':'θ_m',fmt(prefix==='vac'?NU_THETA:solar.angle,1)))}</p><div class="probabilities" aria-live="polite"><div class="probability"><div>${mathHTML('$P_e$')}<output id="${prefix}-pe-value"></output></div><div class="track"><span id="${prefix}-pe-bar"></span></div></div><div class="probability"><div>${mathHTML('$P_x$')}<output id="${prefix}-px-value"></output></div><div class="track"><span id="${prefix}-px-bar"></span></div></div></div>`;
if(solarPair){
 document.title=T.title;
 document.querySelector('h1').textContent=T.h1;
 document.querySelector('header p').innerHTML=mathHTML(T.lead);
 const left=$('light-view'),right=$('neutrino-view');
 left.querySelector('h2').textContent=T.vacuum;right.querySelector('h2').textContent=T.solarMatter;
 left.querySelector('.legend').innerHTML=`<span class="one">${mathHTML('$ν_{vac,1}$')}</span><span class="two">${mathHTML('$ν_{vac,2}$')}</span><span>${mathHTML(T.sum)}</span>`;
 right.querySelector('.legend').innerHTML=`<span class="one">${mathHTML('$ν_{mat,1}$')}</span><span class="two">${mathHTML('$ν_{mat,2}$')}</span><span>${mathHTML(T.sum)}</span>`;
 for(const root of [left,right]){
  root.querySelector('[data-id="entry-label"]').innerHTML=mathHTML(T.entry);
  root.querySelector('[data-id="exit-label"]').textContent=T.measure;
  const kind=root===left?'vac':'mat';
  root.querySelector('[data-id="axis-one"]').innerHTML=mathHTML('$ν_{'+kind+',1}$');
  root.querySelector('[data-id="axis-two"]').innerHTML=mathHTML('$ν_{'+kind+',2}$');
  root.querySelector('canvas').setAttribute('aria-label',T.canvasLabel(kind==='vac'));
 }
 left.querySelector('.result').className='result neutrino-result';left.querySelector('.result').innerHTML=probabilityMarkup('vac');
 right.querySelector('.result').innerHTML=probabilityMarkup('mat');
 left.setAttribute('aria-label',T.viewVacuum);right.setAttribute('aria-label',T.viewSolar);
 const notes=document.querySelectorAll('.scene-notes span');notes[0].textContent=T.note0;notes[1].innerHTML=mathHTML(T.note1(fmt(solar.angle,1)));
 for(const id of ['input-angle','axes-angle'])$(id).closest('label').hidden=true;
 const label=$('length').closest('label');label.querySelector('span').firstChild.textContent=T.path;
 label.querySelector('.ticks').innerHTML=[0,NU_OSC_KM/2,NU_OSC_KM].map((d,i)=>`<span>${i?fmt(d,1):'0'}${T.km}</span>`).join('');
 // One graph of P_x(L) for both media above the common path slider; the pause button joins the slider row.
 const chart=document.createElement('section');chart.className='px-chart';chart.setAttribute('aria-label',T.chartLabel);
 chart.innerHTML=`<div class="chart-head"><span>${mathHTML(T.chartHead)}</span><span class="key vac">${mathHTML(T.keyVac(fmt(vacuumMax,3),fmt(NU_OSC_KM,1)))}</span><span class="key mat">${mathHTML(T.keyMat(fmt(solar.maxTransition,3),fmt(solar.periodKm,1)))}</span></div><canvas id="px-chart" role="img" aria-label="${T.chartAria}"></canvas>`;
 document.querySelector('.controls').before(chart);
 label.querySelector('span').append($('play'));
 document.querySelector('footer>span').innerHTML=mathHTML(T.footer(fmt(NU_ENERGY_EV/1e6,0),fmt(NU_DM2*1e5,1),fmt(SOLAR_NE_CM3/1e25,2),fmt(SOLAR_A,2)));
}

const number=(name,value,min,max)=>{
  const x=query.has(name)?Number(query.get(name)):value;
  return Number.isFinite(x)?Math.max(min,Math.min(max,x)):value;
};
const optical={input:number('input',0,0,180),axes:number('axes',45,0,180),length:number('length',1,0,4)};
if(solarPair){optical.mode='neutrino';optical.input=0;optical.axes=-NU_THETA;}
const neutrino={mode:solarPair?'matter':'neutrino',input:0,axes:solarPair?-solar.angle:-NU_THETA,length:optical.length};
let time=number('time',0,0,1000),playing=!query.has('paused')&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
const lightScene=makeScene($('light-view'),optical),neutrinoScene=makeScene($('neutrino-view'),neutrino);
function phaseLabel(delta) {
  const x=delta/Math.PI;
  for(const [v,label] of [[0,'0'],[.5,'π/2'],[1,'π'],[1.5,'3π/2'],[2,'2π']])if(Math.abs(x-v)<.006)return label;
  return fmt(x,2)+'π';
}

function drawOpticalOutput() {
  if(solarPair)return;
  const canvas=$('light-output'),ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const cx=w*.47,cy=h*.5,r=Math.min(w,h)*.35;
  ctx.strokeStyle='#263447';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx-r,cy);ctx.lineTo(cx+r,cy);ctx.moveTo(cx,cy-r);ctx.lineTo(cx,cy+r);ctx.stroke();
  ctx.fillStyle='#9eb3d1';ctx.font='11px Arial';ctx.textAlign='center';ctx.fillText('H',cx+r+11,cy+4);ctx.fillText('V',cx,cy-r-7);
  ctx.strokeStyle='#e6efff';ctx.lineWidth=1.7;ctx.beginPath();
  for(let i=0;i<=160;i++) {
    const v=field(optical.length,i/160,optical).total,x=cx+r*v[0],y=cy-r*v[1];
    if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
  }ctx.stroke();
  const f=field(optical.length,time,optical),v=f.total;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r*v[0],cy-r*v[1]);ctx.lineWidth=2.4;ctx.stroke();
  ctx.beginPath();ctx.arc(cx+r*v[0],cy-r*v[1],2.5,0,TAU);ctx.fillStyle='#fff';ctx.fill();
}

const chartColors={vac:'#e6efff',mat:'#ff8f6b',dim:'#9eb3d1',faint:'#263447'};
function drawChart(){
  const canvas=$('px-chart');if(!canvas)return;
  const ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
  if(w<2||h<2)return;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  // The plot spans the travel of the slider thumb below it (8 px inside the track ends).
  const left=CHART_LEFT+8,right=CHART_RIGHT+8,top=12,bottom=20,pw=w-left-right,ph=h-top-bottom,base=top+ph;
  const X=d=>left+pw*d/NU_OSC_KM,Y=v=>base-ph*v,distance=neutrinoDistance(optical.length),small=Math.max(11,Math.min(13,w/80));
  ctx.strokeStyle=chartColors.faint;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,base);ctx.lineTo(left+pw,base);ctx.moveTo(left,top);ctx.lineTo(left+pw,top);ctx.stroke();
  rich(ctx,'0',left-12,base+4,small,chartColors.dim,'right');rich(ctx,'1',left-12,top+4,small,chartColors.dim,'right');
  const curves=[['vac',d=>vacuumProbabilities(d).px,vacuumMax,NU_OSC_KM],['mat',d=>neutrinoProbabilities(d,'matter').px,solar.maxTransition,solar.periodKm]];
  for(const [kind,p,max,period] of curves){
    ctx.setLineDash([5,5]);ctx.strokeStyle=kind==='vac'?'rgba(230,239,255,.35)':'rgba(255,143,107,.45)';ctx.beginPath();ctx.moveTo(left,Y(max));ctx.lineTo(left+pw,Y(max));ctx.stroke();ctx.setLineDash([]);
    rich(ctx,fmt(max,3),left+pw,Y(max)-5,small,chartColors[kind],'right');
    if(period<NU_OSC_KM-1e-6){ctx.strokeStyle='rgba(255,143,107,.45)';ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(X(period),Y(0));ctx.lineTo(X(period),base+5);ctx.stroke();ctx.setLineDash([]);
      rich(ctx,fmt(period,1)+T.km,X(period),base+17,small,chartColors.mat,'center');}
    const full=new Path2D(),done=new Path2D(),n=240,m=Math.max(1,Math.round(n*distance/NU_OSC_KM));
    for(let i=0;i<=n;i++){const d=NU_OSC_KM*i/n;full[i?'lineTo':'moveTo'](X(d),Y(p(d)));}
    for(let i=0;i<=m;i++){const d=distance*i/m;done[i?'lineTo':'moveTo'](X(d),Y(p(d)));}
    ctx.strokeStyle=kind==='vac'?'rgba(230,239,255,.28)':'rgba(255,143,107,.35)';ctx.lineWidth=1.5;ctx.stroke(full);
    ctx.strokeStyle=chartColors[kind];ctx.lineWidth=2.4;ctx.stroke(done);
  }
  ctx.strokeStyle='rgba(158,179,209,.35)';ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(X(distance),top);ctx.lineTo(X(distance),base);ctx.stroke();ctx.setLineDash([]);
  for(const [kind,p] of curves){const x=X(distance),y=Y(p(distance));
    ctx.fillStyle=kind==='vac'?'rgba(230,239,255,.22)':'rgba(255,143,107,.28)';ctx.beginPath();ctx.arc(x,y,8,0,TAU);ctx.fill();
    ctx.fillStyle=chartColors[kind];ctx.beginPath();ctx.arc(x,y,4,0,TAU);ctx.fill();}
}
const CHART_LEFT=34,CHART_RIGHT=8;

function setProb(prefix,p){for(const [key,value] of [['pe',p.pe],['px',p.px]]){ $(prefix+'-'+key+'-value').textContent=fmt(value,3);$(prefix+'-'+key+'-bar').style.width=(100*value)+'%';}}
function updateReadouts() {
  if(solarPair){
   const distance=neutrinoDistance(optical.length),vac=vacuumProbabilities(distance),mat=neutrinoProbabilities(distance,'matter');
   $('light-length').textContent='L = '+fmt(distance,1)+T.km;$('neutrino-length').textContent='L = '+fmt(distance,1)+T.km;
   setProb('vac',vac);setProb('mat',mat);
   $('phase-value').textContent='L = '+fmt(distance,1)+T.km;
   $('explanation').innerHTML=mathHTML(distance<.01?T.solarZero:T.solarText(fmt(vacuumMax,3),fmt(solar.maxTransition,3)));
   return;
  }
  $('input-value').textContent=fmt(optical.input)+'°';$('axes-value').textContent=fmt(optical.axes)+'°';
  $('light-length').textContent='L = '+fmt(optical.length,2)+' λ₀';
  const distance=neutrinoDistance(optical.length),p=vacuumProbabilities(distance),light=polarization(optical);
  $('neutrino-length').textContent='L = '+fmt(distance,1)+T.km;
  $('pe-value').textContent=fmt(p.pe,3);$('px-value').textContent=fmt(p.px,3);
  $('pe-bar').style.width=(100*p.pe)+'%';$('px-bar').style.width=(100*p.px)+'%';
  $('phase-value').textContent='|Δφ| = '+phaseLabel(p.delta);
  $('light-input').textContent=T.lightInput(fmt(optical.input));
  const kind=T.kind[light.kind];
  $('light-kind').textContent=kind;
  $('light-output').setAttribute('aria-label',T.lightAria(kind));
  if(optical.length<.006)$('explanation').textContent=T.zero;
  else if(Math.abs(p.delta-Math.PI)<.02)$('explanation').textContent=T.half(fmt(p.px,3));
  else if(Math.abs(p.delta-TAU)<.02)$('explanation').textContent=T.full;
  else $('explanation').textContent=T.generic;
}

function render(){lightScene.render(time);neutrinoScene.render(time);drawOpticalOutput();drawChart();}
for(const [id,key] of [['input-angle','input'],['axes-angle','axes'],['length','length']]){
  $(id).value=optical[key];
  $(id).addEventListener('input',event=>{
    if(!solarPair||key==='length')optical[key]=Number(event.target.value);neutrino.length=optical.length;
    updateReadouts();render();
  });
}
let last=null;
function updatePlay(){$('play').textContent=playing?T.pause:T.resume;$('play').setAttribute('aria-pressed',String(playing));}
$('play').addEventListener('click',()=>{playing=!playing;last=null;updatePlay();});
if(!solarPair)new ResizeObserver(()=>drawOpticalOutput()).observe($('light-output'));
else new ResizeObserver(()=>drawChart()).observe($('px-chart'));
fontsReady.then(()=>{drawOpticalOutput();drawChart();});
function animate(now){
  if(playing&&document.visibilityState!=='hidden'){
    if(last!==null)time+=Math.min(70,now-last)/1000/3.6;
    render();
  }
  last=now;requestAnimationFrame(animate);
}
// Both views can be sampled at one exact time for a deterministic movie frame.
window.waveComparison={
  frame(t,parameters={}){
    for(const key of ['input','axes','length'])if(Number.isFinite(parameters[key])&&(!solarPair||key==='length'))optical[key]=parameters[key];
    neutrino.length=optical.length;time=t;playing=false;updatePlay();
    for(const [id,key] of [['input-angle','input'],['axes-angle','axes'],['length','length']])$(id).value=optical[key];
    updateReadouts();render();
  },
  get state(){return {optical:{...optical},neutrino:{...neutrino,distanceKm:neutrinoDistance(neutrino.length)},time,playing};}
};
updateReadouts();updatePlay();render();requestAnimationFrame(animate);
