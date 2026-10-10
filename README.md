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

Push в `main` автоматически публикует сайт. `workflow_dispatch` позволяет
повторить публикацию вручную.

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

## Готовность русских лекций

В каталоге курса опубликованы записанные лекции 01–15.
Материалы 16–35 хранятся в `introduction/ru/slides/planned/`, как будущие
лекции в stat-course. Они исключены из сборки и ресурсов сайта.
Общие рисунки и интерактивы остаются в `slides/assets/`, поскольку их
используют также книга и другие материалы курса.

После записи и проверки следующей лекции:

~~~bash
make publish-lecture LECTURE=16 MAP_ROOT=/Users/dmitrijnaumov/NeutrinoHit/neutrinohit-map
~~~

Команда возвращает файл в `slides/`, восстанавливает относительные пути,
добавляет лекцию в оба каталога курса и в русскую карту образования.
Строки будущих лекций сохранены в `planned/lectures.json`.
При наличии отдельной страницы задач она возвращается из
`exercises/planned/` и добавляется в общий сборник задач.

Проверьте слайды, затем выполните `make site` и публикацию обоих
репозиториев. `make site` удаляет из `_site` старые страницы лекций,
которые ещё находятся в `planned/`, и их записи в поиске.
