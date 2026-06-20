# Solar Neutrino Masterclass

This is a Quarto project for a school-level masterclass on solar neutrinos.

Pedagogical path:

```text
solar model inputs
-> neutrino spectra and fluxes
-> MSW survival probability
-> detector event spectrum
-> pseudo-data
-> likelihood scan
-> best fit and contour
-> short scientific report
```

## Installation

```bash
cd /Users/dmitrijnaumov/Documents/NeutrinoHit/neutrinophysics/solar-neutrino-masterclass

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Alternative with conda:

```bash
conda env create -f environment.yml
conda activate solar-neutrino-masterclass
```

## Rendering Slides

```bash
quarto render
```

Individual lessons:

```bash
quarto render slides/01_solar_sources.qmd
quarto render slides/02_msw_detector_statistics.qmd
quarto render slides/03_student_defense.qmd
```

You can also use:

```bash
make render
make slides
```

## Notebooks

```bash
jupyter lab
```

To execute the main notebooks:

```bash
make notebooks
```

The notebooks import shared code from `src/solar_neutrino`. If a student runs a notebook from another working directory, they should check that `../src` is available on the Python path.

## Lesson Structure

1. **The Sun as a neutrino source.** Teams receive flux tables, spectra, and a toy electron-density profile.
2. **MSW, detector response, statistics.** Teams move from flux to the expected event spectrum, pseudo-data, and a fit.
3. **Mini-project defense.** Each team presents the physics question, formulas, one code fragment, the main plot, and a numerical result.

## Team Work

For two teams:

- Team A: Sun + MSW.
- Team B: detector + statistics.

For three teams:

- Team A: solar sources.
- Team B: MSW oscillations.
- Team C: detector response and statistics.

Assignments are in `assignments/`. The report template is in `report_template/`.

HTML version of the template:

```bash
quarto render report_template/report_template.qmd --to html
```

PDF output is possible if LaTeX is installed:

```bash
quarto render report_template/report_template.qmd --to pdf
```

## Final Result

Each team prepares:

- a short defense: 7 minutes for the talk + 3 minutes for questions;
- at least one main plot;
- a numerical result: best-fit normalization, effective $P_{ee}$, confidence interval, or contour;
- a short report in Quarto/LaTeX style.

## Physical Limitations

This project is pedagogical. It explicitly uses toy models:

- we do not solve a full Standard Solar Model;
- solar fluxes are taken as input data;
- the $^{8}\mathrm{B}$ spectrum is a pedagogical beta-like approximation unless it is replaced by a tabulated source;
- the Super-Kamiokande-like detector response is schematic;
- $\nu e$ cross sections are proportional to energy and are not precision calculations;
- real SK/SNO/Borexino/JUNO analyses require backgrounds, systematics, covariance matrices, calibration, and real detector response functions.

For publication-level accuracy, Dmitry should replace the reference tables and BibTeX entries with verified modern sources.
