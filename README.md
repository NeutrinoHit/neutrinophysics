# Neutrino physics lectures

Отдельный Quarto-проект раздела NeutrinoHit "Физика нейтрино".

## Render

```bash
make site
```

Готовый сайт записывается в `_site/`.

`make site` включает русскую книгу в HTML, PDF и EPUB. Отдельные форматы:
`make book-html`, `make book-pdf`, `make book-epub`; результаты находятся в
`_site/introduction/ru/book/`. Для PDF нужен LuaLaTeX; `make ci-setup`
устанавливает TinyTeX, если движок отсутствует.

Лицевая и задняя обложки HTML/PDF хранятся как публикуемые векторные ресурсы
в `introduction/ru/book/assets/covers/`. Их исходники каноничны в
`neutrinohit-map/assets/books/covers/`; порядок обновления описан в
`introduction/ru/book/assets/covers/README.md`. Книга собирается без доступа
к соседнему проекту и без установки шрифтов обложки.

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
