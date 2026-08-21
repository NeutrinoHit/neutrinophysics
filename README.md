# Neutrino physics lectures

Отдельный Quarto-проект раздела NeutrinoHit "Физика нейтрино".

## Render

```bash
make site
```

Готовый сайт записывается в `_site/`.

## Local preview

```bash
quarto preview
```

For live editing of the solar-neutrino lecture, prefer the subproject preview:

```bash
make preview-solar-lecture
```

This target creates the compatibility paths needed by Quarto's watcher for the
nested solar-neutrino slides.

## Published URL

```text
https://neutrinohit.github.io/neutrinophysics/
```

## Contents

- `introduction/` — курс "Введение в физику нейтрино";
- `solar-neutrino-masterclass/` — mini-course "Solar Neutrinos".
