// Mathematical notation in labels. Text outside $…$ keeps the interface font. Inside $…$ the serif
// STIX Two Text is used: single letters are italic, words (vac, mat, sin) upright, _x and ^x
// (or _{…}, ^{…}) are lower and upper indices. The same notation serves HTML and canvas labels.
export const SERIF='"STIX Two Text", STIXGeneral, "Times New Roman", serif';
export const SANS='Arial, Helvetica, sans-serif';
const LETTER=/[A-Za-zα-ωϑϕ]/;

function tokens(math){
 const out=[];
 const add=(text,level)=>{
  for(const piece of text.split(/([A-Za-z]{2,})/))if(piece){
   if(/^[A-Za-z]{2,}$/.test(piece))out.push({t:piece,italic:false,level});
   else for(const c of piece)out.push({t:c,italic:LETTER.test(c),level});
  }
 };
 for(let i=0;i<math.length;){
  const ch=math[i];
  if(ch==='_'||ch==='^'){
   let arg;
   if(math[i+1]==='{'){const j=math.indexOf('}',i+2);arg=math.slice(i+2,j);i=j+1;}else{arg=math[i+1]||'';i+=2;}
   add(arg,ch==='_'?-1:1);continue;
  }
  let j=i;while(j<math.length&&math[j]!=='_'&&math[j]!=='^')j++;
  add(math.slice(i,j),0);i=j;
 }
 return out;
}

const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function mathHTML(str){
 return String(str).split('$').map((part,k)=>{
  if(k%2===0)return escape(part);
  const list=tokens(part);let html='';
  for(let i=0;i<list.length;){
   const level=list[i].level;let s='';
   for(;i<list.length&&list[i].level===level;i++)s+=list[i].italic?'<i>'+escape(list[i].t)+'</i>':escape(list[i].t);
   html+=level===0?s:level<0?'<sub>'+s+'</sub>':'<sup>'+s+'</sup>';
  }
  return '<span class="m">'+html+'</span>';
 }).join('');
}
export function setMath(el,str){if(el.dataset.math!==str){el.dataset.math=str;el.innerHTML=mathHTML(str);}}

// Canvas: the same notation drawn run by run. Returns the width of the drawn label.
function runs(str,size,sans){
 const out=[];
 String(str).split('$').forEach((part,k)=>{
  if(!part)return;
  if(k%2===0){out.push({t:part,font:`${size}px ${sans}`,dy:0});return;}
  const m=size*1.12;
  for(const tk of tokens(part)){
   const sz=tk.level?m*.68:m,dy=tk.level<0?m*.24:tk.level>0?-m*.42:0;
   out.push({t:tk.t,font:`${tk.italic?'italic ':''}${sz}px ${SERIF}`,dy});
  }
 });
 return out;
}
export function measure(ctx,str,size,sans=SANS){
 let w=0;for(const r of runs(str,size,sans)){ctx.font=r.font;w+=ctx.measureText(r.t).width;}return w;
}
export function rich(ctx,str,x,y,size,color,align='left',alpha=1,sans=SANS){
 if(alpha<=.004||!str)return 0;
 const list=runs(str,size,sans);let w=0;
 for(const r of list){ctx.font=r.font;r.w=ctx.measureText(r.t).width;w+=r.w;}
 let cx=align==='center'?x-w/2:align==='right'?x-w:x;
 ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.textAlign='left';ctx.textBaseline='alphabetic';
 for(const r of list){ctx.font=r.font;ctx.fillText(r.t,cx,y+r.dy);cx+=r.w;}
 ctx.restore();return w;
}
// Canvas labels need the font before the first drawing.
export const fontsReady=Promise.all(['16px','italic 16px'].map(f=>document.fonts.load(`${f} ${SERIF}`,'νψθαβλφ'))).catch(()=>{});
