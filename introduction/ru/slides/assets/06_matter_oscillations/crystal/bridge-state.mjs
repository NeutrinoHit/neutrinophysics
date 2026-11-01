import {NU_THETA,polarization,neutrinoDistance,vacuumProbabilities} from './model.mjs';

export const BRIDGE_LENGTH=2;
export const BRIDGE_TRANSITION_SECONDS=1.3;
export function bridgeStates(length=BRIDGE_LENGTH){
 return {
  light:{mode:'light',input:0,axes:NU_THETA,length},
  neutrino:{mode:'neutrino',input:0,axes:-NU_THETA,length}
 };
}
export function bridgeResults(length=BRIDGE_LENGTH){
 const {light}=bridgeStates(length),optical=polarization(light),distance=neutrinoDistance(length);
 return {optical:{h:optical.h,v:optical.v},neutrino:vacuumProbabilities(distance),distance};
}
