.PHONY: site render ci-setup book book-html book-pdf book-epub preview preview-paths preview-solar preview-solar-lecture preview-solar-session1 preview-solar-session2 preview-solar-defense

BOOK_DIR := introduction/ru/book

ci-setup:
	@if command -v lualatex >/dev/null 2>&1; then \
	  echo 'LuaLaTeX already installed.'; \
	else \
	  quarto install tinytex --no-prompt; \
	fi

site:
	quarto render
	$(MAKE) book
	rm -rf _site/introduction/slides _site/introduction/ru/book/_book
	rm -f \
		_site/assets/2601.00248v1.pdf \
		_site/introduction/ru/slides/assets/01_neutrino_101/coupled_oscillators.mp4
	find _site -type f -name '*.pdfp' -delete
	find _site -type f -name '*.qmd' -delete
	find _site/solar-neutrino-masterclass/data/project -type f -name '*.csv' -delete
	rm -rf _site/introduction/ru/book/assets/filters
	rm -f _site/introduction/ru/slides/assets/13_solar_neutrinos/generate_photon_diffusion_assets.py

render: site

book:
	quarto render $(BOOK_DIR)

book-html:
	quarto render $(BOOK_DIR) --to html

book-pdf:
	quarto render $(BOOK_DIR) --to pdf

book-epub:
	quarto render $(BOOK_DIR) --to epub

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
