# Assets for Lecture 05: Vacuum Neutrino Oscillations

Keep substantial interactive code, JavaScript, HTML, animations, portraits,
and source notes for `09_vacuum_two_flavors.qmd` and `10_vacuum_pmns.qmd`
in this directory. Slide prose belongs directly in the lecture QMD files.

Planned groups:

- `_energy_phase_animation.qmd`: implemented comparison of a global phase
  with the relative phase of a two-energy superposition;
- `_quantum_chameleon.qmd` and `quantum_chameleon.js`: 30-second opening
  vector animation. The moving chameleon is masked with a counter-translated
  copy of the scenery, so its skin samples the exact background beneath it;
- `neutrino_oscillation_phases.mp4`: opening 16:9 animation copied from
  `dvnanima/neutrino_oscillations_phases`; retained as a source animation and
  available for reuse after the two-level derivation;
- `two_flavor_probabilities.svg`: static two-flavor probability plot;
- `_two_flavor_lab.qmd`: interactive two-flavor calculator in the variables
  $\theta$ and $L/L_{\rm osc}$;
- `_coupled_pendula.qmd`: animated coupled-pendulum energy transfer;
- `_three_flavor_triangle_widget.qmd`, `three_flavor_triangle.css` and `.js`: vacuum three-flavor
  probabilities as a barycentric trajectory. The path variable
  $x=L/L_{\rm osc}^{21}$ runs from 0 to 3, as in
  `dvnanima/neutrino_oscillations`; the angles, CP phase, source flavor and
  mass ordering are adjustable. The NO and IO buttons set the angles and
  phase to the NuFIT 6.1 (IC24 + SK-atm) best fit of that ordering. The code
  reports the unnormalized row sum.
- `_pmns_from_data.qmd`, `pmns_from_data.css` and `.js`: a stepwise real-matrix
  approximation. The solar input uses the high-energy adiabatic result
  $P_{ee}\simeq |U_{e2}|^2$ at $U_{e3}=0$; atmospheric disappearance constrains
  $|U_{\mu3}|^2$, not $|U_{\mu2}|^2$. The final screen uses NuFIT 6.1
  best-fit values, including a nonzero reactor value of $|U_{e3}|^2$.
- `_three_flavor_probabilities.qmd`, `three_flavor_probabilities.css` and `.js`:
  vacuum probabilities $P(\nu_\alpha\to\nu_\beta)$ and the antineutrino
  counterparts as functions of $E$ and $L$ (curves $P(E)$, $P(L)$ and a map in
  $(L,E)$). All six parameters are editable, the mass ordering is a switch,
  curves can be pinned for comparison (for example NO versus IO), and the
  quantities $P$, $P(\nu)-P(\bar\nu)$ and $P(\mathrm{NO})-P(\mathrm{IO})$ are
  available. Default values live in the `BEST_FIT` table at the top of the `.js`
  file and in `BEST_FIT` of the Python file; update both together.
- `three_flavor_oscillations.py`: the same calculation in numpy (library,
  command line with matplotlib plots, and `--self-test`). The JavaScript core
  agrees with it to about 1e-15; the self-test also checks unitarity, CPT and
  $A^{\rm CP}_{e\mu}=16J_{\rm CP}\sin\Delta_{21}\sin\Delta_{32}\sin\Delta_{31}$.
- Dirac and Majorana portraits are reused from `ru/book/assets/people/`,
  where their sources are recorded in chapter 01.
- NuFIT 6.1 figures come from the official NuFIT parameter, mixing,
  profile and unitarity-triangle files; numerical tables in lecture 10
  transcribe the IC24 + SK-atm block rather than reproducing tiny scans.

Do not add matter effects or wave-packet material here. Those belong to the
following lectures.
