# Interactive widgets (English)

English copies of interactive slide widgets from the Russian course
`neutrinophysics/introduction/ru/slides` and the Georgia 2026 talk. Physics,
numerical defaults and code logic are unchanged; only user-visible text was
translated. Paths below are relative to the NeutrinoHit workspace root.

| File | Source |
|------|--------|
| `_two_flavor_lab.qmd` | `neutrinophysics/introduction/ru/slides/assets/05_vacuum_oscillations/_two_flavor_lab.qmd` |
| `_coupled_pendula.qmd` | `neutrinophysics/introduction/ru/slides/assets/05_vacuum_oscillations/_coupled_pendula.qmd` |
| `_matter_constant_lab.qmd` | `neutrinophysics/introduction/ru/slides/assets/06_matter_oscillations/matter_constant_lab.qmd` |
| `matter_oscillations.js` | `neutrinophysics/introduction/ru/slides/assets/06_matter_oscillations/matter_oscillations.js` (also drives the adiabatic lab, `#matter-adiabatic-lab`) |
| `matter_oscillations.css` | `neutrinophysics/introduction/ru/slides/assets/06_matter_oscillations/matter_oscillations.css`, reduced to the `:root` color variables and the "Interactive laboratories" section; the deck-specific rules of the Russian lectures were dropped |
| `_quantum_chameleon.qmd` | `talks/georgia-2026/assets/_quantum_chameleon.qmd` (English text), with the stage width `min(1200px, 100%)` of the 1920x1080 Russian version `neutrinophysics/introduction/ru/slides/assets/05_vacuum_oscillations/_quantum_chameleon.qmd`; script path changed to `assets/widgets/quantum_chameleon.js` |
| `quantum_chameleon.js` | `talks/georgia-2026/assets/05_vacuum_oscillations/quantum_chameleon.js` (identical to the Russian course copy) |

## Use in a deck in `talks/china-school-2026/`

```markdown
{{< include assets/widgets/_two_flavor_lab.qmd >}}
{{< include assets/widgets/_coupled_pendula.qmd >}}
{{< include assets/widgets/_quantum_chameleon.qmd >}}
{{< include assets/widgets/_matter_constant_lab.qmd >}}
```

The first three are self-contained (inline CSS; the chameleon loads its own
script). The matter lab needs its stylesheet and script once per deck, e.g. as a
raw HTML block after the YAML header:

````markdown
```{=html}
<link rel="stylesheet" href="assets/widgets/matter_oscillations.css">
<script defer src="assets/widgets/matter_oscillations.js"></script>
```
````

The lab slide may carry the class `{.matter-lab-slide}` (tightens the heading).
With `embed-resources: false`, the published deck must ship `assets/widgets/`
(e.g. via `resources:` in the project configuration).

## Three-flavor, energy-phase, refraction and adiabatic widgets

Sources are in `neutrinophysics/introduction/ru/slides/assets/` (`05_vacuum_oscillations/` = V, `06_matter_oscillations/` = M). Physics, numerical defaults and code logic are unchanged; user-visible text and code comments were translated.

| File | Source |
|------|--------|
| `_three_flavor_probabilities.qmd` | V `_three_flavor_probabilities.qmd`; loads its own stylesheet and script |
| `three_flavor_probabilities.js` | V `three_flavor_probabilities.js` (BEST_FIT = NuFIT 6.1, IC24 + SK-atm, unchanged); added a guard against a second load. The "Reproduce in Python" box names `three_flavor_oscillations.py`, which stays in V and is not copied here |
| `three_flavor_probabilities.css` | V `three_flavor_probabilities.css` (comment translated only) |
| `_three_flavor_triangle_widget.qmd` | V `_three_flavor_triangle_widget.qmd`; loads its own stylesheet and script |
| `three_flavor_triangle.js` | V `three_flavor_triangle.js`; button text in English, L/E readout formatted with `en-US`, guard against a second load |
| `three_flavor_triangle.css` | V `three_flavor_triangle.css` (identical) |
| `_energy_phase_animation.qmd` | V `_energy_phase_animation.qmd` (inline CSS and script) |
| `_refraction_layers.qmd`, `_refraction_two_modes.qmd` | M `_refraction_layers.qmd`, `_refraction_two_modes.qmd`; each loads `refraction_labs.css` and `refraction_labs.js` (the "medium" label is re-centred at x = 555) |
| `refraction_labs.js` | M `refraction_labs.js`; unit "rad", guard against a second load |
| `refraction_labs.css` | M `refraction_labs.css` (identical) |
| `_matter_adiabatic_lab.qmd` | M `matter_adiabatic_lab.qmd`; uses `matter_oscillations.css` and `.js`, which `../../_metadata.yml` already loads for every deck |

```markdown
{{< include assets/widgets/_three_flavor_probabilities.qmd >}}
{{< include assets/widgets/_three_flavor_triangle_widget.qmd >}}
{{< include assets/widgets/_energy_phase_animation.qmd >}}
{{< include assets/widgets/_refraction_layers.qmd >}}
{{< include assets/widgets/_refraction_two_modes.qmd >}}
{{< include assets/widgets/_matter_adiabatic_lab.qmd >}}
```
