import assert from 'node:assert/strict';
import {matterParameters,neutrinoAmplitudes,neutrinoProbabilities,NU_THETA,NU_OSC_KM,SOLAR_A} from './model.mjs';
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const p=matterParameters(),theta=NU_THETA*Math.PI/180,s=Math.sin(2*theta),c=Math.cos(2*theta);
near(p.angle,75.50138095417145);near(p.rate,1.904439334054725);near(p.maxTransition,.2349994894700689);
near(matterParameters(0).angle,NU_THETA);near(matterParameters(0).rate,1);
near(matterParameters(c).angle,45);near(matterParameters(c).maxTransition,1);
// Independently diagonalize the trace-free flavour Hamiltonian: h=(s,0,A-c)/2.
// exp(-i h L) acting on (1,0) has analytic entries, independent of theta_m.
for(let i=0;i<=800;i++){
 const L=NU_OSC_KM*i/400,phase=Math.PI*L/NU_OSC_KM*p.rate;
 const expected=[[Math.cos(phase),-(SOLAR_A-c)/p.rate*Math.sin(phase)],[0,-s/p.rate*Math.sin(phase)]];
 const state=neutrinoAmplitudes(L,'matter').total,q=neutrinoProbabilities(L,'matter');
 for(let j=0;j<2;j++)for(let k=0;k<2;k++)near(state[j][k],expected[j][k]);
 near(q.pe+q.px,1);assert.ok(q.px<=p.maxTransition+1e-10);
 near(neutrinoProbabilities(L+p.periodKm,'matter').px,q.px);
}
near(neutrinoProbabilities(0,'matter').pe,1);
near(neutrinoProbabilities(p.periodKm/2,'matter').px,p.maxTransition);
console.log(`PASS: fixed solar density, quadrant and resonance, 801 independent Hamiltonian comparisons; theta_m=${p.angle.toFixed(3)} deg, P_x,max=${p.maxTransition.toFixed(6)}, L_osc=${p.periodKm.toFixed(3)} km`);
