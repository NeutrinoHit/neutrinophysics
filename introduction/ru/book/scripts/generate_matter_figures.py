"""Generate reproducible figures for book chapters 13--15.

The solar curve is the adiabatic three-flavour approximation averaged over a
small range of representative production densities.  It is meant to expose
the two asymptotes and the transition between them, not to replace a solar
model with source-dependent production profiles.
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "chapters" / "06_matter_oscillations"
MPLCONFIG = ROOT / ".quarto" / "matter-figure-mplconfig"
OUTPUT.mkdir(parents=True, exist_ok=True)
MPLCONFIG.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG))

import matplotlib.pyplot as plt

INK = "#18262f"
MUTED = "#687984"
GREEN = "#3f7652"
GREEN_SOFT = "#eaf2ed"
BLUE = "#2f6f9f"
GOLD = "#9a6b17"

SIN2_THETA12 = 0.307
SIN2_THETA13 = 0.0220
DM21 = 7.50e-5  # eV^2
THETA12 = np.arcsin(np.sqrt(SIN2_THETA12))
THETA13 = np.arcsin(np.sqrt(SIN2_THETA13))


def setup(ax, xlabel: str, ylabel: str) -> None:
    ax.set_facecolor("white")
    ax.figure.set_facecolor("white")
    ax.grid(True, color="#d9e0e3", linewidth=0.7, alpha=0.9)
    ax.tick_params(colors=INK, labelsize=10)
    for spine in ax.spines.values():
        spine.set_color("#bcc9ce")
    ax.set_xlabel(xlabel, color=INK)
    ax.set_ylabel(ylabel, color=INK)


def save(fig, stem: str) -> None:
    fig.tight_layout()
    fig.savefig(OUTPUT / f"{stem}.png", dpi=220, bbox_inches="tight")
    fig.savefig(OUTPUT / f"{stem}.svg", bbox_inches="tight")
    plt.close(fig)


def solar_survival(E_mev: np.ndarray, rho: float, ye: float = 0.67) -> np.ndarray:
    """Adiabatic, decoherent three-flavour Pee at one production density."""
    c13 = np.cos(THETA13)
    s13 = np.sin(THETA13)
    s2 = np.sin(2.0 * THETA12)
    c2 = np.cos(2.0 * THETA12)
    potential = 7.63e-14 * ye * rho * c13**2  # eV
    A = 2.0 * E_mev * 1.0e6 * potential / DM21
    cos2_theta_m = (c2 - A) / np.hypot(c2 - A, s2)
    pee_2 = 0.5 * (1.0 + c2 * cos2_theta_m)
    return s13**4 + c13**4 * pee_2


def figure_solar_survival() -> None:
    E = np.geomspace(0.08, 20.0, 900)
    densities = np.linspace(60.0, 100.0, 41)
    curves = np.array([solar_survival(E, rho) for rho in densities])
    mean = curves.mean(axis=0)
    low = np.sin(THETA13) ** 4 + np.cos(THETA13) ** 4 * (
        1.0 - 0.5 * np.sin(2.0 * THETA12) ** 2
    )
    high = np.sin(THETA13) ** 4 + np.cos(THETA13) ** 4 * SIN2_THETA12

    fig, ax = plt.subplots(figsize=(8.4, 4.8))
    setup(ax, "Энергия нейтрино, МэВ", r"$P_{ee}$")
    ax.fill_between(E, curves.min(axis=0), curves.max(axis=0), color=GREEN_SOFT,
                    label=r"$60<\rho<100$ г/см$^3$")
    ax.plot(E, mean, color=GREEN, linewidth=3.0,
            label="адиабатическое приближение")
    ax.axhline(low, color=BLUE, linestyle="--", linewidth=1.7,
               label="вакуумное усреднение")
    ax.axhline(high, color=GOLD, linestyle="--", linewidth=1.7,
               label="высокоэнергетический предел")
    for x, label, y in [(0.42, "pp", 0.63), (0.862, r"$^7$Be", 0.60),
                        (1.44, "pep", 0.57), (10.0, r"$^8$B", 0.35)]:
        ax.annotate(label, (x, np.interp(x, E, mean)), xytext=(x, y),
                    arrowprops={"arrowstyle": "-", "color": MUTED},
                    color=INK, fontsize=9, ha="center")
    ax.set_xscale("log")
    ax.set_xlim(0.08, 20.0)
    ax.set_ylim(0.24, 0.68)
    ax.set_xticks([0.1, 0.2, 0.5, 1, 2, 5, 10, 20])
    ax.get_xaxis().set_major_formatter(plt.ScalarFormatter())
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    ax.set_title("Два предела солнечной вероятности выживания", color=INK)
    save(fig, "solar_pee_curve")


def moving_average(values: np.ndarray, window: int) -> np.ndarray:
    kernel = np.ones(window) / window
    padded = np.pad(values, (window // 2, window - 1 - window // 2), mode="edge")
    return np.convolve(padded, kernel, mode="valid")


def figure_day_night() -> None:
    E = np.linspace(2.0, 18.0, 1500)
    rho = 4.5  # g/cm^3, representative mantle density
    ye = 0.50
    length_km = 6000.0
    potential = 7.63e-14 * ye * rho
    A = 2.0 * E * 1.0e6 * potential / DM21
    s2 = np.sin(2.0 * THETA12)
    c2 = np.cos(2.0 * THETA12)
    R = np.hypot(c2 - A, s2)
    theta_m = 0.5 * np.arctan2(s2, c2 - A)
    delta = DM21 / (2.0 * E * 1.0e6)
    length_evinv = length_km * 5.0677307e9
    phase = delta * R * length_evinv / 2.0
    regeneration_2 = (
        np.sin(2.0 * theta_m)
        * np.sin(2.0 * theta_m - 2.0 * THETA12)
        * np.sin(phase) ** 2
    )
    regeneration_3 = np.cos(THETA13) ** 4 * regeneration_2
    smooth = moving_average(regeneration_3, 75)

    fig, ax = plt.subplots(figsize=(8.4, 4.8))
    setup(ax, "Энергия нейтрино, МэВ", r"$P_{ee}^{\rm night}-P_{ee}^{\rm day}$")
    ax.plot(E, regeneration_3, color=BLUE, linewidth=0.9, alpha=0.45,
            label="одна энергия")
    ax.plot(E, smooth, color=BLUE, linewidth=2.8,
            label="после усреднения по энергии")
    ax.axhline(0.0, color=MUTED, linewidth=1.0)
    ax.fill_between(E, 0.0, smooth, color="#edf3fa")
    ax.set_xlim(2.0, 18.0)
    ax.set_ylim(-0.004, max(0.026, 1.12 * regeneration_3.max()))
    ax.legend(frameon=False, fontsize=9, loc="upper left")
    ax.set_title(
        r"Регенерация в слое мантии: $\rho=4.5$ г/см$^3$, $L=6000$ км",
        color=INK,
    )
    save(fig, "earth_day_night_regeneration")


if __name__ == "__main__":
    figure_solar_survival()
    figure_day_night()
