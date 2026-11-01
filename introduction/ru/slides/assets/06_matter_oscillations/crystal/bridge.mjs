import {createWaveScene} from './scene.mjs';
import {bridgeStates,bridgeResults,BRIDGE_LENGTH,BRIDGE_TRANSITION_SECONDS} from './bridge-state.mjs';
import {NU_THETA,NU_ENERGY_EV,BEAT_LENGTH,field,eigenbasis,polarization,neutrinoDistance,TAU} from './model.mjs';
import {setMath,rich,fontsReady} from './typeset.mjs';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search);
if(query.has('embed'))document.body.classList.add('embed');
// The plate is turned by −α, as the mass axes are by −θ: both readings draw one figure, not mirror images.
// The camera looks from the side, so that H (up) and V (toward the viewer) are both visible.
const camera=[8,2.5,12];
const states=bridgeStates(),result=bridgeResults();states.light={...states.light,axes:-NU_THETA};
const light=createWaveScene($('light-view'),states.light,{camera}),neutrino=createWaveScene($('neutrino-view'),states.neutrino,{camera});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=(x,n)=>x.toFixed(n).replace('.',',');
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const colors={one:'#59e6f2',two:'#ffd659',text:'#e6efff',dim:'#9eb3d1',faint:'#263447',accent:'#ff8f6b'};

// Words of the two readings of one construction. Numbers come from the model.
const amplitude=bridgeResults(BEAT_LENGTH/2).optical.v,distance=neutrinoDistance(BRIDGE_LENGTH),period=neutrinoDistance(BEAT_LENGTH);
const KIND={linear:'Линейная поляризация',circular:'Круговая поляризация',elliptical:'Эллиптическая поляризация'};
const TEXT={
 light:{title:'Свет в кристалле',context:'На входе $H$. Две собственные поляризации набирают разные фазы.',
  legend:['Поляризация 1','Поляризация 2','Сумма $E$'],kind:KIND[polarization(states.light).kind],
  note:'$H$ повёрнута на $2α$, а не на ось пластинки',arc:'2$α$',first:'$I_H$',second:'$I_V$',
  parameters:`$α$ = ${fmt(NU_THETA,1)}° · $L$ = ${fmt(BRIDGE_LENGTH,0)} $λ_0$`,
  caption:'Нажмите «Свет → нейтрино»: меняется физический смысл той же конструкции.',
  axes:['$H$','$V$'],chartY:'$I_V$',amplitude:'sin$^2$2$α$',ticks:[0,BRIDGE_LENGTH,BEAT_LENGTH].map((s,i)=>i?fmt(s,0)+' $λ_0$':'0'),
  ellipse:'Поляризация на выходе в осях H и V',chart:'Доля V в зависимости от толщины пластинки',button:'Свет → нейтрино'},
 neutrino:{title:'Нейтрино в вакууме',context:'На входе $ν_e$. Две массовые волны набирают разные фазы.',
  legend:['$ν_{vac,1}$','$ν_{vac,2}$','Сумма $ψ$'],kind:'Суперпозиция $ν_e$ и $ν_x$',
  note:'$ψ=cos 2θ·ν_e−sin 2θ·ν_x$',arc:'2$θ$',first:'$P_e$',second:'$P_x$',
  parameters:`$L$ = ${fmt(distance,1)} км · $E$ = ${fmt(NU_ENERGY_EV/1e6,0)} МэВ`,
  caption:'Оси теперь в пространстве состояний. Вещество не требуется для осцилляций.',
  axes:['$ν_e$','$ν_x$'],chartY:'$P_x$',amplitude:'sin$^2$2$θ$',ticks:[0,distance,period].map((d,i)=>i?fmt(d,1)+(i===2?' км':''):'0'),
  ellipse:'Состояние нейтрино на выходе в осях νe и νx',chart:'Вероятность Px в зависимости от пути',button:'Нейтрино → свет'}
};
// The fractions are the same numbers in both readings; only their names change.
$('first-value').textContent=fmt(result.optical.h,3);$('second-value').textContent=fmt(result.optical.v,3);
$('first-bar').style.width=100*result.optical.h+'%';$('second-bar').style.width=100*result.optical.v+'%';

const initial=query.has('blend')?clamp(Number(query.get('blend'))||0):query.get('stage')==='neutrino'?1:0;
let phase=0,blend=initial,target=blend>=.5?1:0,from=blend,start=null,last=null,shown=null;
const swaps=[...document.querySelectorAll('.swap')];
const lightLabels=[...$('light-view').querySelectorAll('.label')],nuLabels=[...$('neutrino-view').querySelectorAll('.label')];
const nuCanvas=$('neutrino-view').querySelector('canvas');
// The pictures cross-fade; the words change in turn: the old ones go out, then the new ones come in.
const lightAlpha=()=>1-smooth(2*blend),nuAlpha=()=>smooth(2*blend-1);
function labels(){
 const nu=blend>=.5,T=nu?TEXT.neutrino:TEXT.light;
 if(shown!==nu){
  shown=nu;
  for(const id of ['title','context','note','kind','parameters','caption'])setMath($(id),T[id==='context'?'context':id]);
  setMath($('legend-one'),T.legend[0]);setMath($('legend-two'),T.legend[1]);setMath($('legend-sum'),T.legend[2]);
  setMath($('first-label'),T.first);setMath($('second-label'),T.second);
  $('ellipse').setAttribute('aria-label',T.ellipse);$('chart').setAttribute('aria-label',T.chart);
  $('switch').textContent=T.button;$('switch').setAttribute('aria-pressed',String(nu));
  $('light-view').setAttribute('aria-hidden',String(nu));$('neutrino-view').setAttribute('aria-hidden',String(!nu));
 }
 const k=nu?nuAlpha():lightAlpha();
 for(const el of swaps)el.style.opacity=k;
 for(const el of lightLabels)el.style.opacity=lightAlpha();
 for(const el of nuLabels)el.style.opacity=nuAlpha();
 nuCanvas.style.opacity=blend;
}

function prepare(canvas){
 const ctx=canvas.getContext('2d'),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h};
}
// Output state seen along the beam: the light in the axes H, V; the neutrino with the same figure in the axes νe, νx.
function drawEllipse(){
 const {ctx,w,h}=prepare($('ellipse'));if(w<2||h<2)return;
 const r=Math.max(20,Math.min(w*.30,h*.40)),cx=w/2,cy=h/2+3;
 ctx.strokeStyle=colors.faint;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();
 ctx.beginPath();ctx.moveTo(cx-r-8,cy);ctx.lineTo(cx+r+8,cy);ctx.moveTo(cx,cy+r+8);ctx.lineTo(cx,cy-r-8);ctx.stroke();
 for(const [state,alpha] of [[states.light,1-blend],[states.neutrino,blend]]){
  if(alpha<=.004)continue;
  ctx.save();ctx.globalAlpha=alpha;
  eigenbasis(state.axes).forEach((u,i)=>{
   ctx.strokeStyle=i?colors.two:colors.one;ctx.globalAlpha=alpha*.55;ctx.setLineDash([4,5]);ctx.lineWidth=1.2;ctx.beginPath();
   ctx.moveTo(cx-r*u[0],cy+r*u[1]);ctx.lineTo(cx+r*u[0],cy-r*u[1]);ctx.stroke();
  });
  ctx.setLineDash([]);ctx.globalAlpha=alpha;
  // The input (pale, along H) and the angle through which the plate has turned it.
  ctx.strokeStyle='rgba(230,239,255,.3)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r,cy);ctx.stroke();
  const tilt=polarization(state).tilt*Math.PI/180;
  ctx.strokeStyle=colors.accent;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(cx,cy,r*.45,0,-tilt,tilt>0);ctx.stroke();
  const path=new Path2D();
  for(let i=0;i<=160;i++){const v=field(state.length,i/160,state).total,x=cx+r*v[0],y=cy-r*v[1];i?path.lineTo(x,y):path.moveTo(x,y);}
  ctx.lineJoin='round';ctx.strokeStyle='rgba(230,239,255,.14)';ctx.lineWidth=8;ctx.stroke(path);
  ctx.strokeStyle=colors.text;ctx.lineWidth=2;ctx.stroke(path);
  const v=field(state.length,phase,state).total,x=cx+r*v[0],y=cy-r*v[1];
  ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();
  ctx.fillStyle=colors.text;ctx.beginPath();ctx.arc(x,y,3.6,0,TAU);ctx.fill();
  ctx.restore();
 }
 const size=Math.max(14,Math.min(18,w/18));
 for(const [T,alpha] of [[TEXT.light,lightAlpha()],[TEXT.neutrino,nuAlpha()]]){
  rich(ctx,T.axes[0],cx+r+13,cy+size*.35,size,colors.dim,'left',alpha);
  rich(ctx,T.axes[1],cx,cy-r-12,size,colors.dim,'center',alpha);
  const mid=polarization(states.light).tilt*Math.PI/360,ra=r*.45+size*.9;
  rich(ctx,T.arc,cx+ra*Math.cos(mid),cy-ra*Math.sin(mid)+size*.35,size*.85,colors.accent,'left',alpha);
 }
}
// One period of the transition to the second state: the same curve for light and neutrinos.
function drawChart(){
 const {ctx,w,h}=prepare($('chart'));if(w<2||h<2)return;
 const left=26,right=10,top=24,bottom=30,pw=w-left-right,ph=h-top-bottom,base=top+ph;
 const X=s=>left+pw*s/BEAT_LENGTH,Y=v=>base-ph*v;
 ctx.strokeStyle=colors.faint;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,base);ctx.lineTo(left+pw,base);ctx.moveTo(left,top);ctx.lineTo(left+pw,top);ctx.stroke();
 for(let i=1;i<4;i++){const x=X(BEAT_LENGTH*i/4);ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,base+5);ctx.stroke();}
 ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(158,179,209,.5)';ctx.beginPath();ctx.moveTo(left,Y(amplitude));ctx.lineTo(left+pw,Y(amplitude));ctx.stroke();ctx.setLineDash([]);
 const nu=blend>=.5,curve=s=>{const r=bridgeResults(s);return nu?r.neutrino.px:r.optical.v;};
 const full=new Path2D(),done=new Path2D(),n=160;
 for(let i=0;i<=n;i++){const s=BEAT_LENGTH*i/n;full[i?'lineTo':'moveTo'](X(s),Y(curve(s)));}
 for(let i=0;i<=n/2;i++){const s=BRIDGE_LENGTH*i/(n/2);done[i?'lineTo':'moveTo'](X(s),Y(curve(s)));}
 ctx.strokeStyle='rgba(158,179,209,.45)';ctx.lineWidth=1.6;ctx.stroke(full);
 ctx.strokeStyle=colors.accent;ctx.lineWidth=2.4;ctx.stroke(done);
 const px=X(BRIDGE_LENGTH),py=Y(curve(BRIDGE_LENGTH));
 ctx.strokeStyle='rgba(255,143,107,.35)';ctx.setLineDash([2,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,base);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='rgba(255,143,107,.28)';ctx.beginPath();ctx.arc(px,py,8,0,TAU);ctx.fill();
 ctx.fillStyle=colors.accent;ctx.beginPath();ctx.arc(px,py,4,0,TAU);ctx.fill();
 const small=Math.max(11,Math.min(13,w/26));
 rich(ctx,'0',left-7,base+4,small,colors.dim,'right');rich(ctx,'1',left-7,top+4,small,colors.dim,'right');
 for(const [T,alpha] of [[TEXT.light,lightAlpha()],[TEXT.neutrino,nuAlpha()]]){
  rich(ctx,T.chartY,left,top-9,small+3,colors.text,'left',alpha);
  rich(ctx,T.amplitude+' = '+fmt(amplitude,3),left+pw,Y(amplitude)-7,small,colors.dim,'right',alpha);
  [0,BRIDGE_LENGTH,BEAT_LENGTH].forEach((s,i)=>rich(ctx,T.ticks[i],X(s),base+19,small,i===1?colors.accent:colors.dim,i===0?'left':i===2?'right':'center',alpha));
 }
}

$('switch').onclick=()=>{from=blend;target=target===0?1:0;start=performance.now();$('switch').disabled=true;if(reduced){blend=target;start=null;$('switch').disabled=false;draw();}};
function draw(){labels();if(blend<1)light.render(phase);if(blend>0)neutrino.render(phase);drawEllipse();drawChart();}
function frame(now){
 if(last!==null&&!reduced&&!query.has('paused'))phase+=Math.min(now-last,70)/3600;last=now;
 if(start!==null){let u=Math.min(1,(now-start)/(BRIDGE_TRANSITION_SECONDS*1000));u=u*u*(3-2*u);blend=from+(target-from)*u;if(now-start>=BRIDGE_TRANSITION_SECONDS*1000){start=null;blend=target;$('switch').disabled=false;}}
 draw();requestAnimationFrame(frame);
}
draw();fontsReady.then(draw);requestAnimationFrame(frame);
