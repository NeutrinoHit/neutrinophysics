# Neutrino Oscillations: from Vacuum to the Earth's Core

English school lecture (45 minutes) for students of particle physics and geophysics. Emphasis on
understanding and on the size of effects, not on parameter tables or fits. No exercises: interactives
and animations instead; derivations in an appendix.

- `index.qmd` — course home.
- `en/slides/neutrino_oscillations.qmd` — **Neutrino Oscillations in Vacuum and Matter**, the lecture of
  the 2026 Fall School on Interdisciplinary Neutrino Science (Zhuhai, 12 November 2026, slot "Status of
  neutrino oscillations", before S. Petcov's tomography lectures). Opening: the problem as an experiment (`_osc_problem.qmd`: a source, a movable detector, e⁻ and μ⁻ counted event by event; only e⁻ at L = 0)
  and Neutrino = Quantum Chameleon. νe, νμ, ντ have no mass (no flavor fields with a mass); two waves (the
  detector moved by a slider); the formula with the derivation in tabs and natural units in a margin note; the geoneutrino example (`_scales_lab.qmd`, 1.8–3.3 MeV,
  geoneutrino spectrum, the cut Earth `earth-cut-geo.png`); the atmospheric-neutrino example (`_atm_lab.qmd`,
  0.5–100 GeV and the zenith angle, no averaging, vacuum; `earth-cut-atm.png`); the chapter "Vacuum = Birefringent Crystal" with the calcite photo
  (`calcite-double-refraction.jpg`, APN MJM, Wikimedia Commons, CC BY-SA 3.0); light in a birefringent plate (`_birefringent_setup.qmd` and `_birefringent_lab.qmd`: set-up and lab tabs); the
  vacuum as a crystal with three axes; matter is tiny (Δn against calcite); the charged-current diagram in the flavor
  and mass bases (`cc-flavor.svg`, `cc-mass.svg`, `assets/oscillations/cc_diagrams.py`): matter is an off-diagonal
  index matrix; the ratio A (the details of n from forward scattering in three tabs); matter turns the axes (tabs: phases, the index matrix with live numbers, propagation, the neutrino crystal
  `_nu_crystal.qmd`, the probability in matter with its limits, the picture); solar neutrinos: why ν2 leaves the Sun (`_solar_twist.qmd`) and the data
  (`solar-pee.svg`: three-flavor adiabatic MSW and the Borexino points of Nature 562, 505 (2018), values from arXiv:2105.13858);
  lepton mixing: unitarity, the mixing matrix from solar and atmospheric data
  (`_pmns_from_data.qmd`), status (NuFIT 6.1, JUNO); summary; the textbook (English cover `qft-book-cover-en.jpg` from TheBook, QR `qft-book-qr.png` to neutrinohit.github.io/en/materials.html#qft-book, made by neutrinohit-map/scripts/generate_qrcode.py). Appendix: matter eigenvalues and angle (the derivation), adiabatic lab, decoherence (qualitative), coupled pendulums, three-flavor probabilities.
- `en/slides/01_vacuum.qmd`, `02_matter_sun.qmd`, `03_earth.qmd` — the earlier three-lecture version
  (about 2 h 45 min). Kept as the source of the single lecture; not rendered or published (the render list
  in `_quarto.yml` names only `neutrino_oscillations.qmd`).

The physics content follows the Russian course lectures 09–15 (`introduction/ru/slides/`); the Earth
absorption figures are copies from `talks/neutrino-telescopes-2026/media/propagation/`; the films are
English renders from the animation project (`earth_shield`, `cherenkov_radiation`,
`neutrino_oscillations_phases`, mass-ordering balance, `neutrino_crystal`).

## Build

Registered in the repository `_quarto.yml` (render and resources) and on the repository home page.
Deck options (1600×900, MathJax 2, widget CSS/JS) are in `en/slides/_metadata.yml`. The slide footer
points to the course page `en/courses/oscillations-minicourse.html` on the site; the course home
`neutrinophysics/oscillations-minicourse/` links back to the map card `en/education.html#oscillations-minicourse`.
The targets are registered in
`neutrinohit-map/scripts/reveal_context_targets.json`.

## Files

| Path (under `en/slides/`) | Content |
|---|---|
| `assets/oscillations/osc.py` | three-flavor oscillations in vacuum and layered matter; PREM (optional continental crust instead of the 3 km ocean); Y_e from atomic weights |
| `assets/oscillations/test_osc.py` | constants, vacuum vs layers, unitarity, two-flavor matter formula, PREM mass, path convergence, crust option (`python -m pytest`) |
| `assets/oscillations/build_figures.py` | all figures in `media/figures/` (`python build_figures.py [name ...]`) |
| `assets/oscillations/earth_cutaway.py` | the cut Earth `media/figures/earth-cut-{geo,atm}.png` from the NASA Blue Marble map (not stored here): `python earth_cutaway.py <map.jpg> [geo atm]` |
| `assets/earth-explorer/earth_explorer.js` | browser engine (`window.EarthOsc`) and the Earth path explorer; `make_python_reference.py` + `check_against_python.mjs` compare it with `osc.py` (agreement 2e-13) |
| `assets/earth-explorer/earth_widgets.js` | baseline lab, flavor-along-the-path animation, oscillogram lab (same engine) |
| `assets/widgets/` | English widgets: generated wrappers of the shared course widgets, and the hand-written `_scales_lab.qmd`; provenance in its README |
| `media/figures/telescopes/` | Earth absorption figures copied from the telescope lecture |
| `media/video/` | films and posters |

## Sources

`SOURCES-check.md` and `SOURCES-check-2.md` record every quoted number with its primary source and
a short quote. Physics inputs: NuFIT 6.1 best fit (IC24 + SK-atm), CODATA 2022, PREM, CIAAW atomic
weights, BS05(OP) solar electron density. Model compositions: mantle Mg₂SiO₄ (Y_e = 0.4975), core
pure Fe (Y_e = 0.4656). Not included in computed figures and applets: detector response, flux models,
energy/direction smearing (except the explicit averaging figure).
