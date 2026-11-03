# Interactive widgets (English)

The mini-course keeps no widget code of its own. The scripts and stylesheets live in
`introduction/ru/slides/assets/` (the modules carry a `{ru,en}` dictionary and pick English
from the `lang` of the page), and the includes here are generated from the English fragments
`_*.en.qmd` that sit next to them:

```sh
python3 scripts/sync_minicourse_widgets.py
```

| Include | English fragment in `introduction/ru/slides/assets/` | Loaded from there |
|---------|-----------------------------------------------------|-------------------|
| `_two_flavor_lab.qmd` | `05_vacuum_oscillations/_two_flavor_lab.en.qmd` | inline |
| `_coupled_pendula.qmd` | `05_vacuum_oscillations/_coupled_pendula.en.qmd` | inline |
| `_quantum_chameleon.qmd` | `05_vacuum_oscillations/_quantum_chameleon.en.qmd` | `quantum_chameleon.js` |
| `_three_flavor_probabilities.qmd` | `05_vacuum_oscillations/_three_flavor_probabilities.en.qmd` | `three_flavor_probabilities.{css,js}` |
| `_three_flavor_triangle_widget.qmd` | `05_vacuum_oscillations/_three_flavor_triangle_widget.en.qmd` | `three_flavor_triangle.{css,js}` |
| `_refraction_layers.qmd`, `_refraction_two_modes.qmd` | `06_matter_oscillations/_refraction_*.en.qmd` | `refraction_labs.{css,js}` |

Edit the fragment or the module in `introduction/`, then run the script; do not edit the
generated includes.

Kept here by hand:

- `_matter_constant_lab.qmd`, `_matter_adiabatic_lab.qmd` — the compact laboratories of the
  mini-course. Their script, `06_matter_oscillations/matter_oscillations.js`, is the shared one
  (`../../_metadata.yml` loads it for every deck); `matter_oscillations.css` is the reduced
  stylesheet of these labs (the `:root` colors and the "Interactive laboratories" section).
- `_energy_phase_animation.qmd` — inline CSS and script, no shared source.

Include in a slide:

```markdown
{{< include assets/widgets/_two_flavor_lab.qmd >}}
{{< include assets/widgets/_refraction_two_modes.qmd >}}
```
