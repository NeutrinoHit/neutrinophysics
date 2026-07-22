# Solar Neutrino Masterclass

Materials for a masterclass on solar neutrinos.

Convention: analytic formulas use natural units, `hbar = c = 1`. Numerical tables keep their stated practical units.

Course logic:

```text
lecture
-> session 1: sources, production radius, spectra, no-oscillation events
-> session 2: MSW, Earth effect, pseudo-data, fit
-> defense of one integrated SK-like project
```

## Installation

```bash
cd /Users/dmitrijnaumov/Documents/NeutrinoHit/neutrinophysics/solar-neutrino-masterclass

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

With conda:

```bash
conda env create -f environment.yml
conda activate solar-neutrino-masterclass
```

## Datasets

Students do not install PEANUTS. They receive ready-made tables:

```text
data/student/
```

The complete student dataset archive is:

```text
data/student/solar_neutrino_student_data.zip
```

Regenerate the teaching tables:

```bash
python scripts/generate_student_datasets.py
```

Real PEANUTS/SSM tables can replace the same files if the column names are kept.

## QR Code

Generate a QR code for the public project page:

```bash
make qrcode
```

Direct command:

```bash
python scripts/generate_site_qrcode.py \
  --url https://neutrinohit.github.io/neutrinophysics/solar-neutrino-masterclass/index.html \
  --out assets/figures/solar_masterclass_qr.png \
  --selfcheck
```

The script is based on the book QR-code generator in
`/Users/dmitrijnaumov/Documents/dnaumov_documents/Papers/TheBook/pyplots/qrcodes/make_qrcode.py`.

## Build

```bash
make datasets
make qrcode
make render
```

Slides only:

```bash
make slides
```

## Live Preview

For editing the lecture, run preview from this subproject:

```bash
make preview-lecture
```

From the parent `neutrinophysics` directory, the equivalent command is:

```bash
make preview-solar-lecture
```

Both commands run the parent-site preview through a small wrapper. The wrapper
keeps the normal `/solar-neutrino-masterclass/...` URL and shared assets, and it
avoids the Quarto watcher path issue where Quarto may look for `slides/...` or
`_site/slides/...` without the `solar-neutrino-masterclass` prefix.

## Opening Notebooks

On the website, use the `.html` notebook links. A raw `.ipynb` file is JSON, so
Chrome will show it as a file unless a notebook server renders it.

For interactive local work in Chrome:

```bash
cd /Users/dmitrijnaumov/Documents/NeutrinoHit/neutrinophysics/solar-neutrino-masterclass
jupyter lab
```

Then open the notebook from the Jupyter page in the browser.

## Structure

- `slides/00_solar_neutrino_physics.qmd`: physics lecture.
- `slides/00_solar_neutrino_physics_appendix.qmd`: derivations and technical details moved out of the one-hour lecture.
- `slides/01_solar_sources.qmd`: masterclass 1.
- `slides/02_msw_detector_statistics.qmd`: masterclass 2.
- `slides/03_student_defense.qmd`: defense format.
- `assignments/sk_integrated_project.qmd`: common SK-like project.
- `assignments/fit_recipes.qmd`: short fit recipes.
- `data/student/`: student tables.

## Integrated Project

The project combines the earlier separate ideas into one analysis:

1. **Sources and detector.** Why an SK-like threshold selects mainly $^8\mathrm{B}$ neutrinos.
2. **Oscillations.** How $P_{ee}^{day}$ and $P_{ee}^{night}$ change the expected spectrum.
3. **Fit.** What can be extracted from pseudo-data: a normalization, an effective survival probability, or an Earth-effect scale.

The defense presents one physics question, one model chain, one main plot, one fit, one numerical result, and limitations.

## Limitations

The materials are pedagogical:

- the solar model is not solved during the sessions;
- fluxes, spectra, and probabilities are taken from tables;
- the SK-like detector is a simplified model;
- backgrounds and systematics are schematic;
- the result is not a replacement for a Super-Kamiokande, SNO, or JUNO analysis.
