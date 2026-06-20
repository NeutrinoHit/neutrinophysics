.PHONY: render slides notebooks clean

render:
	quarto render

slides:
	quarto render slides/01_solar_sources.qmd
	quarto render slides/02_msw_detector_statistics.qmd
	quarto render slides/03_student_defense.qmd

notebooks:
	jupyter nbconvert --execute notebooks/01_solar_fluxes_and_spectra.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/02_msw_survival_probability.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/03_sk_like_detector.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/04_pseudoexperiment_and_fit.ipynb --to notebook --inplace

clean:
	rm -rf outputs/*
	find . -name ".quarto" -type d -prune -exec rm -rf {} +
