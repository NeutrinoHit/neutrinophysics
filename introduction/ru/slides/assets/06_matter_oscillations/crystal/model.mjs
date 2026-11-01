// Lossless two-state evolution: a Jones plate and vacuum neutrino oscillations.
// Plot lengths use optical vacuum wavelengths; neutrino distances are mapped
// by equal |relative phase|. Display time is a common carrier phase only.
export const TAU = 2 * Math.PI;
export const N1 = 1.35;
export const N2 = 1.60;
export const BEAT_LENGTH = 1 / (N2 - N1);
export const NU_THETA = 33.7;
export const NU_ENERGY_EV = 10e6;
export const NU_DM2 = 7.5e-5;
export const HBARC_EVM = 1.973269804e-7;
export const NU_OSC_KM = 4 * Math.PI * NU_ENERGY_EV * HBARC_EVM / NU_DM2 / 1000;
export const SOLAR_A = 2.05;
export const SOLAR_NE_CM3 = 6.08e25;
const rad = degrees => degrees * Math.PI / 180;

export function eigenbasis(angle) {
  const a = rad(angle);
  return [[Math.cos(a), Math.sin(a)], [-Math.sin(a), Math.cos(a)]];
}

export function coefficients(input, angle) {
  const b = rad(input - angle);
  return [Math.cos(b), Math.sin(b)];
}

export function phases(z, length, time = 0) {
  const inside = Math.max(0, Math.min(z, length));
  return [N1, N2].map(n => TAU * (z + (n - 1) * inside - time));
}

// The same orthonormal decomposition and unitary phase evolution for both systems.
export function evolve(input, angle, phase) {
  const u = eigenbasis(angle), c = coefficients(input, angle);
  const modes = u.map((v, i) => v.map(x => [x*c[i]*Math.cos(phase[i]), x*c[i]*Math.sin(phase[i])]));
  const total = [0,1].map(j => [modes[0][j][0]+modes[1][j][0], modes[0][j][1]+modes[1][j][1]]);
  return {modes,total};
}

export function neutrinoDistance(length) {return length / BEAT_LENGTH * NU_OSC_KM;}

export function matterParameters(A=SOLAR_A) {
  const theta=rad(NU_THETA),s=Math.sin(2*theta),c=Math.cos(2*theta);
  const rate=Math.hypot(c-A,s);
  return {angle:.5*Math.atan2(s,c-A)*180/Math.PI,rate,
    periodKm:NU_OSC_KM/rate,maxTransition:(s/rate)**2,A};
}

export function neutrinoAmplitudes(distanceKm,medium='vacuum') {
  const parameters=medium==='matter'?matterParameters():{angle:NU_THETA,rate:1};
  const delta=TAU*distanceKm/NU_OSC_KM*parameters.rate;
  return {...evolve(0,-parameters.angle,[delta/2,-delta/2]),delta};
}

export function neutrinoProbabilities(distanceKm,medium='vacuum') {
  const {total,delta}=neutrinoAmplitudes(distanceKm,medium);
  return {pe:total[0][0]**2+total[0][1]**2,px:total[1][0]**2+total[1][1]**2,delta};
}

export function vacuumAmplitudes(distanceKm) {
  // k_1-k_2 = +Delta m^2/(2E); the common physical phase is removed.
  // u_1=(cos theta,-sin theta), u_2=(sin theta,cos theta).
  return neutrinoAmplitudes(distanceKm);
}

export function vacuumProbabilities(distanceKm) {
  const {total,delta} = vacuumAmplitudes(distanceKm);
  return {pe:total[0][0]**2+total[0][1]**2,px:total[1][0]**2+total[1][1]**2,delta};
}

export function field(z, time, state) {
  if(state.mode === 'neutrino'||state.mode==='matter') {
    const {modes} = neutrinoAmplitudes(neutrinoDistance(Math.max(0,z)),state.mode==='matter'?'matter':'vacuum');
    // An arbitrary common display phase makes the complex amplitudes visible.
    // It is not a real transverse neutrino field or its microscopic wavelength.
    const phase = TAU * (z-time), cs=Math.cos(phase),sn=Math.sin(phase);
    const components = modes.map(mode=>mode.map(([re,im])=>re*cs-im*sn));
    return {components,total:components[0].map((x,i)=>x+components[1][i])};
  }
  const u = eigenbasis(state.axes);
  const c = coefficients(state.input, state.axes);
  const p = phases(z, state.length, time);
  const components = u.map((v, i) => v.map(x => x * c[i] * Math.cos(p[i])));
  return {components, total: components[0].map((x, i) => x + components[1][i])};
}

export function jones(z, state) {
  if(state.mode === 'neutrino'||state.mode==='matter') return neutrinoAmplitudes(neutrinoDistance(Math.max(0,z)),state.mode==='matter'?'matter':'vacuum').total;
  return evolve(state.input,state.axes,phases(z,state.length)).total;
}

export function polarization(state) {
  const [[hr, hi], [vr, vi]] = jones(state.length, state);
  const h = hr * hr + hi * hi, v = vr * vr + vi * vi;
  const s1 = h - v, s2 = 2 * (hr * vr + hi * vi);
  const d = Math.min(1, Math.hypot(s1, s2));
  const major = Math.sqrt((1 + d) / 2);
  const minor = Math.sqrt(Math.max(0, (1 - d) / 2));
  const ratio = minor / major;
  const tilt = .5 * Math.atan2(s2, s1) * 180 / Math.PI;
  return {h, v, major, minor, ratio, tilt,
    delta: TAU * (N2 - N1) * state.length,
    kind: ratio < .015 ? 'linear' : ratio > .985 ? 'circular' : 'elliptical'};
}

// A pure frame sampler shared by interaction and deterministic animation.
export function sampleFrame(state, time, count = 360, zMin = -2.2, zMax = 7.2) {
  return Array.from({length: count}, (_, i) => {
    const z = zMin + (zMax - zMin) * i / (count - 1);
    return {z, ...field(z, time, state)};
  });
}
