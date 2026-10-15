# Neutrino Oscillations: from Vacuum to the Earth's Core

English mini-course, three lectures (about 2 h 45 min), for students of particle physics and
geophysics. Emphasis on understanding and on the size of effects, not on parameter tables or fits.
No exercises: interactives and animations instead.

- `index.qmd` — course home.
- `en/slides/01_vacuum.qmd` — **A quantum clock in vacuum**: ghost particles, how detectors read flavor
  (Cherenkov film), the solar and atmospheric puzzles, quantum chameleon, flavor vs mass states, the
  two-phase film, beats, the phase Δm²L/2E, the formula, two-flavor lab, coupled pendulums, numbers,
  oscillation lengths, L–E map, averaging, three flavors, triangle and three-flavor probability applets,
  reactor "two clocks", what is known.
- `en/slides/02_matter_sun.qmd` — **Matter and the Sun**: refraction (thin-layer applet), V = √2 G_F n_e,
  two waves in matter (applet), mixing in matter and resonance, constant-density lab, adiabatic following
  and Landau–Zener, adiabatic lab, the Sun (P_ee plateaus and transition), day–night, the long-baseline lab
  (mass ordering, δCP, matter on/off) and its numbers.
- `en/slides/03_earth.qmd` — **The Earth seen by neutrinos**: PREM and Y_e, three probes; absorption
  (Earth-shield film, transmission map, IceCube mass of the Earth); oscillations (paths, animated
  flavor along a chord, oscillogram, path explorer, oscillogram lab for a modified Earth, composition
  signal, what it takes); geoneutrinos (visible decays, heat per kg, measurements, heat budget, JUNO);
  a one-slide summary of the course.

The physics content follows the Russian course lectures 09–15 (`introduction/ru/slides/`); the Earth
absorption figures are copies from `talks/neutrino-telescopes-2026/media/propagation/`; the films are
English renders from the animation project (`earth_shield`, `cherenkov_radiation`,
`neutrino_oscillations_phases`, mass-ordering balance).

## Build

Registered in the repository `_quarto.yml` (render and resources) and on the repository home page.
Deck options (1600×900, MathJax 2, widget CSS/JS) are in `en/slides/_metadata.yml`. The slide footer
points to the registered map card `en/education.html#neutrino-introduction`; a course-home target
for this mini-course is not yet registered in `neutrinohit-map/scripts/reveal_context_targets.json`.

## Files

| Path (under `en/slides/`) | Content |
|---|---|
| `assets/oscillations/osc.py` | three-flavor oscillations in vacuum and layered matter; PREM (optional continental crust instead of the 3 km ocean); Y_e from atomic weights |
| `assets/oscillations/test_osc.py` | constants, vacuum vs layers, unitarity, two-flavor matter formula, PREM mass, path convergence, crust option (`python -m pytest`) |
| `assets/oscillations/build_figures.py` | all figures in `media/figures/` (`python build_figures.py [name ...]`) |
| `assets/earth-explorer/earth_explorer.js` | browser engine (`window.EarthOsc`) and the Earth path explorer; `make_python_reference.py` + `check_against_python.mjs` compare it with `osc.py` (agreement 2e-13) |
| `assets/earth-explorer/earth_widgets.js` | baseline lab, flavor-along-the-path animation, oscillogram lab (same engine) |
| `assets/widgets/` | English copies of the course widgets; provenance in its README |
| `media/figures/telescopes/` | Earth absorption figures copied from the telescope lecture |
| `media/video/` | films and posters |

## Sources

`SOURCES-check.md` and `SOURCES-check-2.md` record every quoted number with its primary source and
a short quote. Physics inputs: NuFIT 6.1 best fit (IC24 + SK-atm), CODATA 2022, PREM, CIAAW atomic
weights, BS05(OP) solar electron density. Model compositions: mantle Mg₂SiO₄ (Y_e = 0.4975), core
pure Fe (Y_e = 0.4656). Not included in computed figures and applets: detector response, flux models,
energy/direction smearing (except the explicit averaging figure).
