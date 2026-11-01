import assert from 'node:assert/strict';
import {NU_THETA,NU_OSC_KM,NU_DM2,NU_ENERGY_EV,HBARC_EVM,TAU,
  vacuumAmplitudes,vacuumProbabilities,neutrinoDistance,field} from './model.mjs';
const near=(a,b,tol=1e-11)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const theta=NU_THETA*Math.PI/180,maxMixing=Math.sin(2*theta)**2;
near(NU_OSC_KM,330.62452905584,1e-7);
// Compare against the independent conventional 1.267 * dm2 L/E expression.
for(let i=0;i<=600;i++){
  const L=NU_OSC_KM*i/200,p=vacuumProbabilities(L);
  const phase=NU_DM2*(L*1000)/(4*NU_ENERGY_EV*HBARC_EVM);
  near(p.px,maxMixing*Math.sin(phase)**2);near(p.pe+p.px,1);
  assert.ok(p.pe>=-1e-12&&p.pe<=1+1e-12&&p.px>=-1e-12&&p.px<=1+1e-12);
  near(vacuumProbabilities(L+NU_OSC_KM).px,p.px);
}
near(vacuumProbabilities(0).pe,1);near(vacuumProbabilities(0).px,0);
near(vacuumProbabilities(NU_OSC_KM/2).px,maxMixing);
near(vacuumProbabilities(NU_OSC_KM).px,0);
near(neutrinoDistance(4),NU_OSC_KM);
near(neutrinoDistance(1),NU_OSC_KM/4);
const a=vacuumAmplitudes(NU_OSC_KM/8);
near(a.total[1][0],0);assert.ok(a.total[1][1]<0,'k1 > k2 must give a negative imaginary transition amplitude');
// Plotting may change a common phase, never the flavour probabilities.
for(const t of [0,.125,.37])for(const z of [0,1,2,4]){
  const f=field(z,t,{mode:'neutrino',input:74,axes:12,length:4});
  const normal=field(z,t,{mode:'neutrino',input:0,axes:-NU_THETA,length:4});
  f.total.forEach((x,j)=>near(x,normal.total[j]));
  const J=vacuumAmplitudes(neutrinoDistance(z)).total,phase=TAU*(z-t);
  f.total.forEach((x,j)=>near(x,J[j][0]*Math.cos(phase)-J[j][1]*Math.sin(phase)));
}
console.log(`PASS: 601 baselines, normalization, periodicity, phase sign, fixed nu_e preparation and carrier-independent probabilities. L_osc=${NU_OSC_KM.toFixed(3)} km; P_x,max=${maxMixing.toFixed(6)}`);
