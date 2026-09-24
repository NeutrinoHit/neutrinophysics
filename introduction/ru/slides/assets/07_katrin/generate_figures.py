#!/usr/bin/env python3
"""Figures for lecture 07. Run from any directory with Python + NumPy + Matplotlib.

Analytical curves are teaching models, not KATRIN data. Field values reproduce
the reference example of lecture 06. See sources.md for assumptions and papers.
"""
from pathlib import Path
import math
from xml.sax.saxutils import escape

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parent
BLUE, GOLD, GREEN, RED = "#7cc7ff", "#ffcc8a", "#75ddb8", "#ff9ab0"
INK, MUTED, PANEL = "#f2f2f2", "#b8c7d1", "#101820"
plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 17,
    "text.color": INK, "axes.labelcolor": INK, "xtick.color": MUTED,
    "ytick.color": MUTED, "axes.edgecolor": MUTED,
    "axes.facecolor": "#000000", "figure.facecolor": "#000000",
    "savefig.facecolor": "#000000", "svg.fonttype": "path",
    "axes.spines.top": False, "axes.spines.right": False,
    "svg.hashsalt": "katrin-lecture-07",
})
E, ME = 18600.0, 511000.0
BS, BA, BM = 3.6, 0.00030, 6.0
RATIO = BS / BM
COS_ACC = math.sqrt(1 - RATIO)
DELTA = E * (1 + E / (2 * ME)) * BA / BM
TAU = 4e17 * 3.4e-18
LOSS = 12.6


def save(fig, name):
    fig.savefig(OUT / name, metadata={"Date": None}, bbox_inches="tight", pad_inches=0.22)
    plt.close(fig)


def transmission(surplus, energy=E):
    a = energy * (1 + energy / (2 * ME)) * BA / BS
    t = (1 - np.sqrt(1 - np.clip(np.asarray(surplus) / a, 0, RATIO))) / (1 - COS_ACC)
    return np.clip(t, 0, 1)


def curves():
    x = np.linspace(-0.25, 1.7, 1200)
    fig, ax = plt.subplots(figsize=(11, 5.5))
    for angle in [0, 25, 45]:
        edge = E * (1 + E/(2*ME)) * BA / BS * np.sin(np.deg2rad(angle))**2
        ax.step(x, (x > edge).astype(float), where="post", lw=1.5,
                alpha=.75, label=f"Один угол: {angle}°")
    ax.plot(x, transmission(x), color=GOLD, lw=4, label="Изотропный пучок")
    ax.axvspan(0, DELTA, color=GOLD, alpha=.07)
    ax.annotate("", (DELTA, .5), (0, .5),
                arrowprops={"arrowstyle": "<->", "color": GOLD, "lw": 2})
    ax.text(DELTA/2, .56, f"ΔE = {DELTA:.2f} эВ".replace(".", ","), ha="center", color=GOLD)
    ax.set(xlabel="Избыток энергии  E − e|U|, эВ", ylabel="Доля прошедших электронов",
           ylim=(-.03, 1.07))
    ax.legend(loc="lower right", fontsize=13, facecolor=PANEL, labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig, "transmission.svg")

    u = np.linspace(0, 4, 301)
    fig, ax = plt.subplots(figsize=(10.5, 5.5))
    ax.plot(u, np.exp(-u), color=BLUE, lw=3, label="Пушка: весь столб газа")
    ax.plot(u, -np.expm1(-u) / np.where(u == 0, 1, u), color=GOLD,
            lw=3, label="β-распад: среднее по месту рождения")
    # Correct removable singularity in the second curve.
    ax.lines[-1].set_ydata(np.r_[1., -np.expm1(-u[1:]) / u[1:]])
    ax.axvline(TAU, color=MUTED, ls=":", lw=1.5)
    for val, c, dy in [(np.exp(-TAU), BLUE, -.1),
                       (-np.expm1(-TAU)/TAU, GOLD, .07)]:
        ax.plot(TAU, val, "o", color=c)
        ax.text(TAU+.12, val+dy, f"{val:.2f}".replace(".", ","), color=c)
    ax.set(xlabel="Оптическая толщина полного столба  τ",
           ylabel="Вероятность пройти без рассеяния", ylim=(0, 1.08))
    ax.legend(fontsize=13, facecolor=PANEL, labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig, "unscattered-fraction.svg")

    x = np.linspace(-2, 50, 1601)
    # Narrow axial gun: sigmoid here represents its finite energy spread.
    sigma = .15
    erf = np.vectorize(math.erf)
    edge = lambda v: .5 * (1 + erf(v / (sigma * np.sqrt(2))))
    weights = np.array([math.exp(-TAU)*TAU**n/math.factorial(n) for n in range(12)])
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.plot(x, edge(x), color=BLUE, lw=3, label="Без газа")
    with_gas = sum(p * edge(x - n*LOSS) for n, p in enumerate(weights))
    ax.plot(x, with_gas, color=GOLD, lw=3, label="С газом")
    ax.hlines(weights[0], 0, LOSS, colors=GREEN, linestyles=":")
    ax.text(5.8, weights[0]+.045, "P₀", color=GREEN, fontsize=22)
    ax.text(19, .22, "В модели каждое столкновение\nотнимает 12,6 эВ.",
            color=MUTED, fontsize=15)
    ax.set(xlabel="Избыток энергии пушки  Eп − e|U|, эВ",
           ylabel="Нормированная скорость счёта", ylim=(-.03, 1.06))
    ax.legend(loc="lower right", fontsize=14, facecolor=PANEL, labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig, "gun-scan.svg")

    w = np.linspace(0, 30, 400)
    fig, axes = plt.subplots(2, 2, figsize=(17, 6.7), sharex=True)
    # First-order perturbations of R = C A w^3 / 3 + b.
    perturbations = [
        (-w/2, GOLD, "Масса: δmβ² = +1 эВ²", "δR ∝ −w"),
        (.02*w*w, BLUE, "Конец: δE₀ = +0,02 эВ", "δR ∝ w²"),
        (.001*w**3/3, GREEN, "Нормировка: δA/A = +0,1 %", "δR ∝ w³"),
        (np.full_like(w, 2.0), RED, "Фон: постоянная добавка", "δR = const"),
    ]
    for ax, (y, color, title, law) in zip(axes.flat, perturbations):
        ax.plot(w, y, color=color, lw=3)
        ax.axhline(0, color=MUTED, lw=.7)
        ax.set_title(title, fontsize=19, color=color, pad=12)
        ax.text(.06, .15 if y[-1] >= 0 else .78, law,
                transform=ax.transAxes, color=color, fontsize=20)
        ax.set_ylabel("δR, отн. ед.", fontsize=17)
        ax.tick_params(labelsize=16)
        ax.grid(alpha=.13)
    for ax in axes[-1]:
        ax.set_xlabel("w = E₀ − e|U|, эВ", fontsize=17)
    fig.subplots_adjust(hspace=.42, wspace=.30)
    save(fig, "parameter-signatures.svg")


def loss_example():
    """Toy model: Gaussian g1 near 12.8 eV, its convolutions and Poisson weights.

    Teaching illustration of G = P0 delta + sum_n Pn gn, not measured KATRIN data.
    """
    step, mu, sigma = 0.02, 12.8, 1.6
    eps = np.arange(0, 120 + step, step)
    g1 = np.exp(-0.5 * ((eps - mu) / sigma) ** 2)
    g1 /= g1.sum() * step
    gn = [g1]
    for _ in range(6):
        gn.append(np.convolve(gn[-1], g1)[:eps.size] * step)
    weight = [math.exp(-TAU) * TAU ** n / math.factorial(n) for n in range(len(gn) + 1)]
    total = sum(weight[n] * gn[n - 1] for n in range(1, len(gn) + 1))
    assert abs(np.trapezoid(g1, eps) - 1) < 1e-9
    assert abs(np.trapezoid(total, eps) - (1 - weight[0])) < 1e-3

    names = {1: "одно столкновение", 2: "два столкновения", 3: "три столкновения"}
    fig, ax = plt.subplots(figsize=(11.5, 5.8))
    for n, color in zip((1, 2, 3), (BLUE, GOLD, GREEN)):
        share = ("{:.2f}".format(weight[n])).replace(".", ",")
        ax.fill_between(eps, weight[n] * gn[n - 1], color=color, alpha=.45,
                        label=f"{names[n]}: вес {share}")
    ax.plot(eps, total, color=INK, lw=3, label="Сумма по всем кратностям")
    top = total.max() * 1.42
    ax.annotate("", (0, top), (0, 0),
                arrowprops={"arrowstyle": "->", "color": RED, "lw": 3.5})
    ax.text(1.4, top * .94, f"P₀·δ(ε):  P₀ = {weight[0]:.2f}".replace(".", ","),
            color=RED, fontsize=17)
    ax.text(29, top * .46,
            "g₁ — гауссиан 12,8 эВ.\nСвёртка сдвигает максимум\nк n·12,8 эВ и уширяет\nраспределение в √n раз.",
            color=MUTED, fontsize=15)
    ax.set(xlabel="Потеря энергии  ε, эВ", ylabel="Плотность вероятности, эВ⁻¹",
           xlim=(-2, 58), ylim=(0, top * 1.1))
    ax.legend(loc="upper right", fontsize=14, facecolor=PANEL, labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig, "loss-convolution.svg")


class Diagram:
    def __init__(self, w, h, title):
        self.w, self.h = w, h
        self.items = [f'<title>{escape(title)}</title>',
                     '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" '
                     'markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
                     '<path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>',
                     f'<rect width="{w}" height="{h}" fill="#000"/>']

    def text(self, x, y, lines, color=INK, size=28, anchor="middle", weight="normal"):
        lines = lines if isinstance(lines, list) else [lines]
        text = "".join(f'<tspan x="{x}" dy="{0 if i == 0 else 1.3*size}">'
                       f'{escape(s)}</tspan>' for i, s in enumerate(lines))
        self.items.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="DejaVu Sans, sans-serif" '
                          f'font-size="{size}" text-anchor="{anchor}" font-weight="{weight}">{text}</text>')

    def box(self, x, y, w, h, lines, color=BLUE, size=27):
        self.items.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" '
                          f'fill="{PANEL}" stroke="{color}" stroke-width="2.5"/>')
        lines = lines if isinstance(lines, list) else [lines]
        self.text(x+w/2, y+h/2-(len(lines)-1)*size*.65+size*.32, lines, color, size)

    def arrow(self, x1, y1, x2, y2, color=BLUE, dashed=False):
        self.items.append(f'<path d="M{x1},{y1} L{x2},{y2}" fill="none" stroke="{color}" '
                          f'stroke-width="3" marker-end="url(#arrow)"'
                          + (' stroke-dasharray="9 7"' if dashed else '') + '/>')

    def line(self, x1, y1, x2, y2, color=MUTED, width=2):
        self.items.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="{color}" stroke-width="{width}"/>')

    def save(self, name):
        (OUT/name).write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
            f'viewBox="0 0 {self.w} {self.h}" role="img">' + "".join(self.items) + "</svg>\n",
            encoding="utf-8")


def diagrams():
    d = Diagram(1560, 420, "Путь электронов и газа в KATRIN")
    for x, width, words, color in [
        (20, 220, ["Газовый", "источник"], BLUE),
        (310, 260, ["Откачка", "и транспорт"], GREEN),
        (640, 260, ["Пред-", "спектрометр"], MUTED),
        (970, 300, ["Главный", "спектрометр"], GOLD),
        (1340, 200, ["Кремниевый", "детектор"], RED)]:
        d.box(x, 145, width, 110, words, color)
    for x1, x2 in [(240,310),(570,640),(900,970),(1270,1340)]:
        d.arrow(x1+5, 200, x2-7, 200)
    d.text(130, 90, "β-распад", BLUE, 27)
    d.text(440, 90, "электроны проходят", GREEN, 26)
    d.text(1120, 90, "порог e|U|", GOLD, 28)
    d.text(1440, 90, "число n", RED, 28)
    d.arrow(440, 262, 440, 330, GREEN)
    d.text(440, 373, "газ → очистка → возврат", GREEN, 25)
    d.text(900, 365, "Схема не в масштабе; длина установки ≈ 70 м.", MUTED, 25)
    d.save("beamline.svg")

    d = Diagram(1060, 430, "Фотоэлектронная пушка с управляемой энергией и углом")
    d.text(170, 70, "Ультрафиолет", GOLD)
    d.arrow(170, 85, 210, 160, GOLD)
    d.box(100, 170, 170, 150, ["Фото-", "катод"], GOLD)
    d.text(185, 380, "−|Uп|", GOLD, 34)
    d.box(370, 170, 180, 150, ["Ускоряющие", "электроды"], BLUE, 25)
    d.arrow(277, 245, 360, 245, BLUE)
    d.arrow(558, 245, 727, 245, BLUE)
    d.text(640, 200, "Eп, α", BLUE, 32)
    d.box(740, 170, 245, 150, ["Газ → фильтр", "→ детектор"], GREEN, 26)
    d.text(600, 85, ["Свет освобождает электрон.", "Напряжение задаёт его энергию."], INK, 27)
    d.save("photoelectron-gun.svg")

    d = Diagram(1020, 610, "Внутренняя конверсия перехода 32,15 кэВ в криптоне-83")
    d.text(190, 50, "Ядерные уровни", BLUE, 27)
    d.line(75, 115, 335, 115, BLUE, 4)
    d.line(75, 375, 335, 375, BLUE, 4)
    d.line(75, 500, 335, 500, MUTED, 3)
    d.text(90, 101, "41,6 кэВ", BLUE, 24, "start")
    d.text(90, 409, "9,4 кэВ", BLUE, 24, "start")
    d.text(90, 538, "0", MUTED, 24, "start")
    d.arrow(290, 130, 290, 358, GOLD)
    d.text(80, 260, ["ΔEяд", "32,15 кэВ"], GOLD, 27, "start")
    d.arrow(205, 390, 205, 486, MUTED)
    d.box(450, 170, 495, 205, ["Энергия перехода передаётся", "электрону K-оболочки.", "Электрон покидает атом."], GOLD, 26)
    d.arrow(340, 245, 435, 245, GOLD)
    d.text(698, 449, "Eэл ≈ 32,15 − 14,33 = 17,82 кэВ", GOLD, 25)
    d.text(698, 500, "Часть энергии тратится на связь электрона.", MUTED, 22)
    d.text(698, 550, "Альтернативный канал перехода: γ-квант.", INK, 24)
    d.save("krypton-conversion.svg")

    d = Diagram(1000, 550, "Прецизионный делитель высокого напряжения")
    d.text(160, 75, "U ≈ −18,6 кВ", GOLD, 30)
    d.line(160, 95, 160, 150, GOLD, 3)
    d.box(110, 150, 100, 150, "R₁", GOLD, 32)
    d.line(160, 300, 160, 365, GOLD, 3)
    d.box(110, 365, 100, 70, "R₂", BLUE, 32)
    d.line(160, 435, 160, 490, MUTED, 3)
    d.line(125, 490, 195, 490, MUTED, 3)
    d.line(137, 500, 183, 500, MUTED, 3)
    d.line(150, 510, 170, 510, MUTED, 3)
    d.line(160, 333, 385, 333, BLUE, 3)
    d.box(385, 275, 475, 116, ["Прецизионный вольтметр", "u ≈ −9,4 В"], BLUE, 26)
    d.line(860, 333, 940, 333, BLUE, 3)
    d.line(940, 333, 940, 420, BLUE, 3)
    d.line(910, 420, 970, 420, MUTED, 3)
    d.line(921, 430, 959, 430, MUTED, 3)
    d.line(933, 440, 947, 440, MUTED, 3)
    d.text(620, 100, "u = U · R₂ / (R₁ + R₂)", INK, 31)
    d.text(620, 165, "U = M · u,    M ≈ 2000", GOLD, 31)
    d.text(620, 475, ["Коэффициент M измеряют для всего делителя", "относительно эталона PTB."], MUTED, 24)
    d.save("voltage-divider.svg")

    d = Diagram(1240, 535, "Главный и мониторный спектрометры связаны электрически")
    d.box(365, 25, 510, 85, "Общее высокое напряжение U", GOLD, 28)
    d.line(620, 110, 620, 165, GOLD, 3)
    d.line(265, 165, 975, 165, GOLD, 3)
    d.arrow(265, 165, 265, 250, GOLD)
    d.arrow(975, 165, 975, 250, GOLD)
    d.box(40, 260, 450, 135, ["Главный спектрометр", "β-спектр трития"], BLUE, 28)
    d.box(750, 260, 450, 135, ["Мониторный спектрометр", "Линия ⁸³ᵐKr"], GREEN, 28)
    d.text(265, 454, "Измеряет форму конца спектра.", BLUE, 24)
    d.text(975, 454, "Следит за положением линии.", GREEN, 24)
    d.text(620, 512, "Два независимых электронных пучка; общая шкала напряжения.", MUTED, 25)
    d.save("monitor-spectrometer.svg")

    d = Diagram(1280, 590, "Малый и большой объём после задерживающего барьера")
    for y, shift, title in [(140, 470, "Симметричная конфигурация"),
                             (410, 875, "Смещённая анализирующая область")]:
        d.text(520, y-95, title, INK, 29)
        d.box(50, y-60, 965, 145, "", MUTED)
        d.items.append(f'<rect x="{shift}" y="{y-57}" width="{1010-shift}" height="139" '
                       f'fill="{RED}" opacity=".18"/>')
        d.line(shift, y-60, shift, y+85, GOLD, 4)
        d.text(shift, y+120, "барьер", GOLD, 24)
        d.box(1100, y-22, 135, 62, "детектор", BLUE, 22)
        d.arrow(1023, y+8, 1090, y+8, BLUE)
        d.text((shift+1010)/2, y+10, "фон", RED, 27)
    d.save("background-volume.svg")


def verify():
    assert 0.94 < DELTA < 0.96
    assert np.all(np.diff(transmission(np.linspace(-1, 3, 500))) >= -1e-12)
    assert transmission(-1) == 0 and abs(transmission(2)-1) < 1e-12
    assert abs(math.exp(-TAU) - .25666) < 1e-5
    assert abs(-math.expm1(-TAU)/TAU - .54657) < 1e-5
    # Exact integral of x*sqrt(x²-m²) and its first-order mass derivative.
    w, m = 10., 1.
    x = np.linspace(m, w, 200001)
    num = np.trapezoid(x*np.sqrt(x*x-m*m), x)
    exact = (w*w-m*m)**1.5 / 3
    assert abs(num-exact) < 1e-4
    print(f"ΔE={DELTA:.6f} эВ; P0(full)={math.exp(-TAU):.6f}; "
          f"<P0>(axial)={-math.expm1(-TAU)/TAU:.6f}; integral verified.")


if __name__ == "__main__":
    verify()
    curves()
    loss_example()
    diagrams()
