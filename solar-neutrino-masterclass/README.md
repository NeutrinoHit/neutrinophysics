# Solar Neutrino Masterclass

Quarto-проект для школьного мастер-класса по солнечным нейтрино.

Педагогическая линия:

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

## Установка

```bash
cd /Users/dmitrijnaumov/Documents/NeutrinoHit/neutrinophysics/solar-neutrino-masterclass

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Альтернатива через conda:

```bash
conda env create -f environment.yml
conda activate solar-neutrino-masterclass
```

## Сборка слайдов

```bash
quarto render
```

Отдельные занятия:

```bash
quarto render slides/01_solar_sources.qmd
quarto render slides/02_msw_detector_statistics.qmd
quarto render slides/03_student_defense.qmd
```

Можно также использовать:

```bash
make render
make slides
```

## Ноутбуки

```bash
jupyter lab
```

Для выполнения всех основных ноутбуков:

```bash
make notebooks
```

Ноутбуки импортируют общий код из `src/solar_neutrino`. Если студент запускает ноутбук из другой рабочей директории, нужно убедиться, что путь `../src` доступен.

## Структура занятий

1. **Солнце как источник нейтрино.** Команды получают таблицы потоков, спектры и toy-профиль электронной плотности.
2. **MSW, detector response, statistics.** Команды переходят от потока к ожидаемому спектру событий, псевдоданным и fit.
3. **Защита мини-проектов.** Каждая команда показывает постановку, формулы, один фрагмент кода, главный график и численный результат.

## Работа команд

Для двух команд:

- Team A: Sun + MSW.
- Team B: Detector + statistics.

Для трех команд:

- Team A: solar sources.
- Team B: MSW oscillations.
- Team C: detector response and statistics.

Задания лежат в `assignments/`. Шаблон отчета лежит в `report_template/`.

HTML-версия шаблона:

```bash
quarto render report_template/report_template.qmd --to html
```

PDF-версия возможна при установленном LaTeX:

```bash
quarto render report_template/report_template.qmd --to pdf
```

## Итоговый результат

Каждая команда готовит:

- короткую защиту: 7 минут доклад + 3 минуты вопросы;
- минимум один главный график;
- численный результат: best-fit normalization, effective \(P_{ee}\), confidence interval или contour;
- мини-отчет в Quarto/LaTeX-стиле.

## Физические ограничения

Этот проект является учебным. В нем явно используются toy-модели:

- мы не строим полноценную Standard Solar Model;
- солнечные потоки берутся как входные данные;
- \(^{8}\mathrm{B}\)-спектр является учебной beta-like аппроксимацией, если не заменен табличным источником;
- Super-Kamiokande-like detector response задан схематически;
- \(\nu e\)-сечения пропорциональны энергии и не являются точным расчетом;
- реальные анализы SK/SNO/Borexino/JUNO требуют фонов, систематик, covariance matrices, calibration и реальных detector response functions.

Для публикационной точности Дмитрию нужно заменить reference-таблицы и BibTeX на проверенные современные источники.
