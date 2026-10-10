#!/usr/bin/env python3
"""Reproducible teaching diagrams for lecture 28 (relic neutrinos); no experimental
data are drawn. Drawing primitives and palette are shared with the lecture-07
figure generator. Numbers here are order-of-magnitude teaching estimates unless
a source is named in the lecture text.
"""
from pathlib import Path
import importlib.util
import math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("lecture07_figures", OUT.parent / "07_katrin" / "generate_figures.py")
common = importlib.util.module_from_spec(spec)
spec.loader.exec_module(common)
common.OUT = OUT
D, save = common.Diagram, common.save
BLUE, GOLD, GREEN, RED, INK, MUTED, PANEL = common.BLUE, common.GOLD, common.GREEN, common.RED, common.INK, common.MUTED, common.PANEL

# ---- shared numbers, derived once and reused in curves(), diagrams(), verify() ----
TG_K = 2.725                                  # measured CMB temperature
TNU_K = (4 / 11) ** (1 / 3) * TG_K
KB_EV_PER_K = 8.617333262e-5
TNU_EV = TNU_K * KB_EV_PER_K                  # ~1.68e-4 eV
NGAMMA_CM3 = 410.7                            # measured photon number density
N_ONE_FLAVOR = (3 / 11) * NGAMMA_CM3          # nu + nubar, one flavor
N_TOTAL = 3 * N_ONE_FLAVOR
ZETA3 = 1.2020569
MEAN_P_OVER_T = 7 * math.pi ** 4 / 180 / ZETA3
P_MEAN_EV = MEAN_P_OVER_T * TNU_EV

GF_GEV2 = 1.166e-5
MPL_GEV = 1.22e19
TDEC_GEV = (1 / (GF_GEV2 ** 2 * MPL_GEV)) ** (1 / 3)

HBARC_EVCM = 1.973269804e-5
GF_EV2 = GF_GEV2 * 1e-18
SIGMA_ELASTIC_CM2 = (GF_EV2 ** 2 * P_MEAN_EV ** 2) * HBARC_EVCM ** 2
SIGMA_CAPTURE_PER_EV = 1.5e-41                # cm^2 per eV of m_nu (Long, Lunardini, Sabancilar 2014)
NA = 6.02214076e23
N_TRITIUM_100G = 100 / 3.016 * NA


def curves():
    # --- endpoint spectrum: continuum edge vs. the capture line, 2 m_beta apart ---
    m = 1.0  # illustrative units; real gap is many orders smaller than any achieved resolution
    x = np.linspace(-4.2, 2.6, 1400)  # x = E - E0
    cont = np.zeros_like(x)
    below = x <= -m
    xx = -x[below]  # distance below E0, >= m
    cont[below] = xx * np.sqrt(xx ** 2 - m ** 2)
    cont /= cont.max()
    fig, ax = plt.subplots(figsize=(11, 5.5))
    ax.plot(x, cont, color=BLUE, lw=3, label=r"$\beta$-спектр: $\propto x\sqrt{x^2-m_\beta^2}$")
    ax.axvline(-m, color=BLUE, ls=":", lw=1.5)
    ax.text(-m - .15, .04, r"$E_0-m_\beta$", color=BLUE, ha="right")
    sigma = .09
    line = np.exp(-0.5 * ((x - m) / sigma) ** 2)
    ax.plot(x, line, color=GOLD, lw=3, label=r"Линия захвата при $E_0+m_\beta$")
    ax.annotate("", (m, .72), (-m, .72), arrowprops={"arrowstyle": "<->", "color": common.GREEN, "lw": 2})
    ax.text(0, .78, r"$2m_\beta$", color=common.GREEN, ha="center", fontsize=20)
    ax.axvline(0, color=MUTED, lw=1, ls="--")
    ax.text(0.05, 1.02, r"$E_0$", color=MUTED)
    ax.set(xlabel=r"$E-E_0$ (иллюстративный масштаб, $m_\beta$ сильно увеличена)",
           ylabel="Скорость счёта, отн. ед.", ylim=(-.03, 1.12))
    ax.legend(loc="upper left", fontsize=13, facecolor=PANEL, labelcolor=INK)
    ax.grid(alpha=.15)
    save(fig, "endpoint-spectrum.svg")

    # --- cross sections: capture (grows with m_nu) vs. hopeless elastic scattering ---
    mnu = np.linspace(0.005, 0.5, 300)
    sigma_capture = SIGMA_CAPTURE_PER_EV * mnu
    fig, ax = plt.subplots(figsize=(10.5, 5.5))
    ax.plot(mnu, sigma_capture, color=GOLD, lw=3, label=r"Захват на тритии: $\sigma\propto m_\beta$")
    ax.axhline(SIGMA_ELASTIC_CM2, color=RED, lw=2.5, ls="--",
               label="Упругое рассеяние на покоящейся мишени")
    ax.set_yscale("log")
    ax.set(xlabel=r"$m_\beta$, эВ", ylabel=r"Сечение, см$^2$", ylim=(1e-64, 1e-40))
    ax.legend(loc="center left", fontsize=13, facecolor=PANEL, labelcolor=INK)
    ax.grid(alpha=.15, which="both")
    save(fig, "cross-section-comparison.svg")


def diagrams():
    d = D(1500, 430, "Два реликтовых фона Вселенной")
    for x, w, title, sub, col in [
        (20, 460, "t ≈ 1 с", "Нейтрино отделяются, T ≈ 1 МэВ", GOLD),
        (530, 460, "t ≈ неск. минут", "Первичный нуклеосинтез", MUTED),
        (1040, 440, "t ≈ 380 000 лет", "Атомы, свет отделяется — CMB", BLUE)]:
        d.box(x, 60, w, 120, [title, sub], col, 26)
    d.arrow(480, 120, 525, 120, MUTED)
    d.arrow(990, 120, 1035, 120, MUTED)
    d.text(750, 30, "Расширение и остывание Вселенной", MUTED, 24)
    d.box(20, 250, 1460, 130, ["Сегодня: T_γ ≈ 2,725 К (CMB), T_ν ≈ 1,95 К (реликтовые нейтрино)",
                                "Нейтринный фон — снимок Вселенной в 380 000 раз более ранней, чем CMB"], GREEN, 27)
    d.save("big-bang-timeline.svg")

    d = D(1520, 460, "Одна и та же ядерная неустойчивость — три реакции")
    d.box(20, 40, 460, 150, ["β⁻-распад", "³H → ³He + e⁻ + ν̄ₑ", "порог не нужен: идёт сам"], BLUE, 25)
    d.box(530, 40, 460, 150, ["Обратный β-распад", "ν̄ₑ + p → n + e⁺", "порог ≈ 1,8 МэВ"], RED, 25)
    d.box(1040, 40, 460, 150, ["Захват νₑ на тритии", "νₑ + ³H → ³He + e⁻", "порога нет — ядро и так", "готово распасться"], GOLD, 24)
    d.text(760, 250, "Захват — это распад, у которого забрали энергию, а не отняли.", INK, 28)
    d.text(760, 300, "Электрон уносит всю энергию перехода целиком, плюс энергию нейтрино.", MUTED, 25)
    d.arrow(760, 340, 760, 400, GREEN)
    d.text(760, 440, "Наблюдаемый сигнал: линия на E₀ + mβ, выше края обычного спектра", GREEN, 26)
    d.save("reaction-comparison.svg")

    d = D(1480, 460, "Идея PTOLEMY: от графена с тритием к энергии электрона")
    for x, w, lines, col in [
        (20, 330, ["Графен", "с атомами трития"], GOLD),
        (390, 330, ["Магнитная и", "электростатическая", "транспортировка"], BLUE),
        (760, 330, ["Высокоточный", "калориметр (TES)"], GREEN),
        (1130, 330, ["Энергия электрона", "с точностью ~50 мэВ"], RED)]:
        d.box(x, 165, w, 130, lines, col, 26)
    for x1, x2 in [(350, 390), (720, 760), (1090, 1130)]:
        d.arrow(x1, 230, x2, 230)
    d.text(740, 80, "Главная нерешённая задача: ровный монослой ~100 г трития на графене.", MUTED, 26)
    d.save("ptolemy-concept.svg")

    d = D(1480, 460, "Идея QTNM: атомарный тритий и CRES вместо графена")
    for x, w, lines, col in [
        (20, 300, ["Диссоциация T₂", "на холодной поверхности", "(< 1 К)"], GOLD),
        (360, 300, ["Охлаждение", "буферным газом", "⁴He / ³He"], BLUE),
        (700, 300, ["Магнитная", "ловушка атомов"], GREEN),
        (1040, 360, ["CRES: частота", "электрона в ловушке"], RED)]:
        d.box(x, 165, w, 130, lines, col, 25)
    for x1, x2 in [(320, 360), (660, 700), (1000, 1040)]:
        d.arrow(x1, 230, x2, 230)
    d.text(750, 80, "Тот же принцип CRES, что и у Project 8 (лекция 08) — другой путь к источнику.", MUTED, 26)
    d.save("qtnm-atomic-source.svg")


def verify():
    assert abs(TNU_K - 1.945) < 0.01
    assert abs(N_ONE_FLAVOR - 112.0) < 0.5
    assert abs(N_TOTAL - 336.0) < 1.5
    assert abs(P_MEAN_EV * 1e4 - 1.676 * 3.151) < 0.05
    assert 0.5 < TDEC_GEV * 1e3 < 2.0          # order of magnitude ~ 1 MeV
    assert SIGMA_ELASTIC_CM2 < 1e-58
    assert abs(SIGMA_CAPTURE_PER_EV * 0.05 - 7.5e-43) / 7.5e-43 < 1e-6
    assert 1.9e25 < N_TRITIUM_100G < 2.1e25
    print(f"T_nu={TNU_K:.3f} K ({TNU_EV*1e4:.3f}e-4 eV); n_nu={N_TOTAL:.1f} /cm^3; "
          f"<p>={P_MEAN_EV*1e4:.3f}e-4 eV; T_dec~{TDEC_GEV*1e3:.2f} MeV; "
          f"sigma_elastic~{SIGMA_ELASTIC_CM2:.2e} cm^2; N(100 g T)={N_TRITIUM_100G:.3e}")


if __name__ == "__main__":
    verify()
    curves()
    diagrams()
