# Solar Neutrino Masterclass

Materials for a masterclass on solar neutrinos.

Course logic:

```text
lecture
-> session 1: sources, production radius, spectra, no-oscillation events
-> session 2: MSW, Earth effect, pseudo-data, fit
-> defense of three projects
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

## Build

```bash
make datasets
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
- `slides/01_solar_sources.qmd`: masterclass 1.
- `slides/02_msw_detector_statistics.qmd`: masterclass 2.
- `slides/03_student_defense.qmd`: defense format.
- `assignments/team_A_solar_sources.qmd`: project 1, SK-like and B8.
- `assignments/team_B_msw_oscillations.qmd`: project 2, Borexino-like.
- `assignments/team_C_detector_statistics.qmd`: project 3, day-night.
- `assignments/fit_recipes.qmd`: short fit recipes.
- `data/student/`: student tables.

## Group Projects

1. **SK-like and B8.** Why a high threshold selects $^8\mathrm{B}$.
2. **Borexino-like.** Which sources are visible at low energy.
3. **Day-night.** What can be extracted from the Earth effect.

Each group presents a physics question, model, main plot, fit, numerical result, and limitations.

## Limitations

The materials are pedagogical:

- the solar model is not solved during the sessions;
- fluxes, spectra, and probabilities are taken from tables;
- SK-like and Borexino-like detectors are simplified models;
- backgrounds and systematics are schematic;
- the result is not a replacement for a Super-Kamiokande, Borexino, SNO, or JUNO analysis.
