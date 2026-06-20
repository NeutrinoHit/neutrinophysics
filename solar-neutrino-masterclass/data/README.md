# Data notes

The files in this directory are pedagogical inputs for the masterclass.

`solar_fluxes_reference.csv` contains reference values for classroom use. They must be replaced or checked against the chosen modern Standard Solar Model table if publication-level accuracy is required.

`b8_spectrum.csv` is a pedagogical toy spectrum, not an official tabulated B8 neutrino spectrum. It uses a beta-like shape $f(E) \propto E^2(E_{\max}-E)^2$ with $E_{\max}\approx 16$ MeV and unit normalization.

`be7_lines.csv` uses classroom branching fractions for the two dominant $^{7}\mathrm{Be}$ lines.

`electron_density_profile_toy.csv` uses $n_e(r)=\exp(-r/0.1R_\odot)$ in normalized units. The Python oscillation utilities use physical densities in cm$^{-3}$ for the matter potential; this file is only a shape input for plots and exercises unless rescaled by the teacher.
