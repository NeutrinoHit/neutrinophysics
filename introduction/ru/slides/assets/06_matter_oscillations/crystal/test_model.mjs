import assert from 'node:assert/strict';
import {field,jones,polarization,coefficients,eigenbasis,phases,N1,N2,TAU} from './model.mjs';
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const norm=J=>J.reduce((s,[r,i])=>s+r*r+i*i,0);
let cases=0;
for(let input=0;input<=180;input+=9)for(let axes=0;axes<=180;axes+=13)for(let length=0;length<=4;length+=.31){
  cases++;
  const s={input,axes,length};
  near(norm(jones(length,s)),1);
  const Jout=jones(length,s),beta=input*Math.PI/180;
  const perpendicular=[0,1].map(j=>-Math.sin(beta)*Jout[0][j]+Math.cos(beta)*Jout[1][j]);
  near(perpendicular[0]**2+perpendicular[1]**2,
    Math.sin(2*(input-axes)*Math.PI/180)**2*Math.sin(Math.PI*(N2-N1)*length)**2);
  const c=coefficients(input,axes),u=eigenbasis(axes);
  near(c[0]*c[0]+c[1]*c[1],1);
  near(u[0][0]*u[1][0]+u[0][1]*u[1][1],0);
  for(const t of [.0,.27]) {
    const f=field(length,t,s);
    f.total.forEach((v,i)=>near(v,f.components[0][i]+f.components[1][i]));
    const J=jones(length,s);
    f.total.forEach((v,i)=>near(v,J[i][0]*Math.cos(TAU*t)+J[i][1]*Math.sin(TAU*t)));
  }
}
for(let axes=0;axes<=180;axes+=15) {
  const s={input:axes,axes,length:1.38},p=polarization(s);
  near(p.ratio,0,2e-8);near(p.h,Math.cos(axes*Math.PI/180)**2);
}
const base={input:0,axes:45};
near(polarization({...base,length:1}).ratio,1);
near(polarization({...base,length:2}).v,1);
near(polarization({...base,length:4}).h,1);
near(polarization({...base,length:0}).h,1);
// Field phases are continuous at both interfaces; outside, both use vacuum k.
for(const length of [0,.4,1,3.9]) {
  const eps=1e-8;
  for(const z of [0,length])for(let i=0;i<2;i++)near(phases(z+eps,length)[i]-phases(z-eps,length)[i],0,3e-7);
  for(let i=0;i<2;i++)near(phases(length+1,length)[i]-phases(length,length)[i],TAU);
  near(phases(length,length)[1]-phases(length,length)[0],TAU*(N2-N1)*length);
}
console.log(`PASS: ${cases} normalized Jones states; independent field/Jones agreement; single-axis, quarter/half/full-wave cases; phase continuity and vacuum propagation.`);
