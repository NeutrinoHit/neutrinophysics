import assert from 'node:assert/strict';
import {bridgeStates,bridgeResults} from './bridge-state.mjs';
import {NU_THETA} from './model.mjs';
for(let i=0;i<=400;i++){
 const length=i/100,s=bridgeStates(length),r=bridgeResults(length);
 assert.equal(s.light.input,0);assert.equal(s.neutrino.input,0);
 assert.ok(Math.abs(r.optical.h-r.neutrino.pe)<1e-12);
 assert.ok(Math.abs(r.optical.v-r.neutrino.px)<1e-12);
}
const r=bridgeResults();assert.ok(Math.abs(r.neutrino.px-Math.sin(2*NU_THETA*Math.PI/180)**2)<1e-12);
console.log('PASS: 401 phase-matched light/neutrino states; fixed bridge preserves both output fractions.');
