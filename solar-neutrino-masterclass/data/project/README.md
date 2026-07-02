# Solar-neutrino project data

These files are the public inputs for the integrated SK-like solar-neutrino
project.

Files:

- `solar_fluxes.csv`: source flux normalizations.
- `energy_spectra.csv`: normalized source spectra.
- `nu_electron_recoil_cross_sections.csv`: recoil-electron differential cross sections.
- `oscillation_probabilities_grid.csv`: PEANUTS daytime survival-probability grid for
  `B8` neutrinos over `(E_MeV, sin2theta12, dm21_eV2)`.
- `earth_regeneration_grid.csv`: PEANUTS Earth-regeneration grid over
  `(E_MeV, eta_rad)` at the reference oscillation parameters.
- `earth_regeneration_parameter_scan.csv`: PEANUTS Earth-regeneration scan over
  `(sin2theta12, dm21_eV2)` for selected energies and nadir angles.
- `blind_pseudo_data_sk.csv`: blinded SK-like recoil spectrum for the project.

The true parameters used for the blinded spectrum are not included here.
They are kept by the instructor for unblinding during the defense.
