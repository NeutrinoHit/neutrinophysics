# Введение в физику нейтрино

В папке хранится структура вводного курса:

- HTML-экспорты из Keynote лежат в отдельных подпапках с `index.html`;
- русские QMD-заготовки слайдов лежат в `ru/slides/`;
- английские QMD-заготовки слайдов лежат в `en/slides/`;
- RevealJS-настройки находятся прямо в YAML-шапках QMD-заготовок, чтобы
  индексы `ru/slides/index.qmd` и `en/slides/index.qmd` оставались обычными
  HTML-страницами.

Для рендера выполнить из корня репозитория:

```bash
quarto render
```

Новые русские QMD-слайды публикуются по адресу вида
`https://neutrinohit.github.io/neutrinophysics/introduction/ru/slides/04_direct_neutrino_mass.html`.
