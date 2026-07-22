.PHONY: render preview preview-lecture preview-session1 preview-session2 preview-defense slides assignments datasets peanuts-spectrum qrcode notebook-pages notebooks clean

render:
	quarto render

preview:
	cd .. && make preview-solar

preview-lecture:
	cd .. && make preview-solar-lecture

preview-session1:
	cd .. && make preview-solar-session1

preview-session2:
	cd .. && make preview-solar-session2

preview-defense:
	cd .. && make preview-solar-defense

datasets:
	python scripts/generate_student_datasets.py

peanuts-spectrum:
	../.venv-peanuts-py312/bin/python scripts/generate_peanuts_solar_spectrum.py

qrcode:
	python scripts/generate_site_qrcode.py

slides:
	quarto render slides/00_solar_neutrino_physics.qmd
	quarto render slides/00_solar_neutrino_physics_appendix.qmd
	quarto render slides/01_solar_sources.qmd
	quarto render slides/02_msw_detector_statistics.qmd
	quarto render slides/03_student_defense.qmd

assignments:
	quarto render assignments/sk_integrated_project.qmd
	quarto render assignments/defense_requirements.qmd
	quarto render assignments/fit_recipes.qmd

notebook-pages:
	quarto render notebooks/00_peanuts_energy_spectrum.ipynb
	quarto render notebooks/team_project_template.ipynb
	quarto render notebooks/01_solar_fluxes_and_spectra.ipynb
	quarto render notebooks/02_msw_survival_probability.ipynb
	quarto render notebooks/03_sk_like_detector.ipynb
	quarto render notebooks/04_pseudoexperiment_and_fit.ipynb

notebooks:
	jupyter nbconvert --execute notebooks/00_peanuts_energy_spectrum.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/01_solar_fluxes_and_spectra.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/02_msw_survival_probability.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/03_sk_like_detector.ipynb --to notebook --inplace
	jupyter nbconvert --execute notebooks/04_pseudoexperiment_and_fit.ipynb --to notebook --inplace

clean:
	rm -rf outputs/*
	find . -name ".quarto" -type d -prune -exec rm -rf {} +
