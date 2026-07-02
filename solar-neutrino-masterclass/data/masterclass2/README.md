# Masterclass 2 data

These tables are for the second solar-neutrino masterclass.

The oscillation tables were generated with PEANUTS from the local clone
`.external/PEANUTS`, commit `59e3a2a`.

Files:

- `solar_fluxes.csv`: source flux normalizations.
- `energy_spectra.csv`: normalized source spectra.
- `nu_electron_recoil_cross_sections.csv`: recoil-electron differential cross sections.
- `oscillation_probabilities_grid.csv`: PEANUTS daytime survival-probability grid for
  `B8` neutrinos over `(E_MeV, sin2theta12, dm21_eV2)`.
- `earth_regeneration_grid.csv`: PEANUTS Earth-regeneration grid for `B8`
  neutrinos over `(E_MeV, eta_rad)` at the reference oscillation parameters.
- `earth_regeneration_parameter_scan.csv`: PEANUTS Earth-regeneration scan over
  `(sin2theta12, dm21_eV2)` for selected energies and nadir angles.

Reference oscillation parameters:

- `sin2theta12 = 0.308`
- `dm21_eV2 = 7.420000e-05`
- `theta13 = 1.495750e-01 rad`
- `theta23 = 8.552100e-01 rad`
- `delta_CP = 3.403390e+00 rad`
- `dm3l_eV2 = 2.510000e-03`

Grid sizes:

- oscillation grid rows: 236880
- Earth-regeneration grid rows: 1504
- Earth-regeneration parameter-scan rows: 18900

Students do not need to install PEANUTS for the masterclass.
