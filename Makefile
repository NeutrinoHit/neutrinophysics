.PHONY: render preview preview-paths preview-solar preview-solar-lecture preview-solar-session1 preview-solar-session2 preview-solar-defense

render:
	quarto render

preview-paths:
	@mkdir -p _site
	@mkdir -p assets/css
	@mkdir -p _site/assets/css
	@ln -sfn solar-neutrino-masterclass/slides slides
	@ln -sfn solar-neutrino-masterclass/slides _site/slides
	@cp -f solar-neutrino-masterclass/assets/css/custom.css assets/css/custom.css
	@cp -f solar-neutrino-masterclass/assets/css/custom.css _site/assets/css/custom.css

preview: preview-paths
	quarto preview

preview-solar: preview-paths
	quarto preview

preview-solar-lecture: preview-paths
	@touch solar-neutrino-masterclass/slides/00_solar_neutrino_physics.qmd
	quarto preview

preview-solar-session1: preview-paths
	@touch solar-neutrino-masterclass/slides/01_solar_sources.qmd
	quarto preview

preview-solar-session2: preview-paths
	@touch solar-neutrino-masterclass/slides/02_msw_detector_statistics.qmd
	quarto preview

preview-solar-defense: preview-paths
	@touch solar-neutrino-masterclass/slides/03_student_defense.qmd
	quarto preview
