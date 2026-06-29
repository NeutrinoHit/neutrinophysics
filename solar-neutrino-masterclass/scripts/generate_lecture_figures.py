"""Generate pedagogical figures for the solar-neutrino physics lecture."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
FIGURES = ROOT / "assets" / "figures"
MPLCONFIG = ROOT / "outputs" / "mplconfig"
MPLCONFIG.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG))

import matplotlib.pyplot as plt
from matplotlib.ticker import ScalarFormatter


COLORS = {
    "blue": "#8ec5ff",
    "orange": "#ffcc8a",
    "green": "#8fd19e",
    "red": "#ff8a8a",
    "violet": "#b8a2ff",
    "gray": "#d0d0d0",
}


def setup_axes(ax, xlabel=None, ylabel=None):
    ax.set_facecolor("#111111")
    ax.figure.set_facecolor("#111111")
    ax.tick_params(colors="#d8d8d8", labelsize=10)
    for spine in ax.spines.values():
        spine.set_color("#666666")
    ax.grid(True, alpha=0.22, color="#ffffff", linewidth=0.7)
    if xlabel:
        ax.set_xlabel(xlabel, color="#f0f0f0")
    if ylabel:
        ax.set_ylabel(ylabel, color="#f0f0f0")
    ax.title.set_color("#f0f0f0")


def save(fig, name):
    fig.tight_layout()
    fig.savefig(FIGURES / name, dpi=220, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


def beta_shape(E, emax):
    y = np.where((E >= 0.0) & (E <= emax), E**2 * (emax - E) ** 2, 0.0)
    area = np.trapz(y, E)
    return y / area if area > 0 else y


def figure_gamow_window():
    E = np.linspace(0.1, 35.0, 1200)  # keV
    kT = 1.30  # keV, rough solar-core value
    EG = 493.0  # keV, p-p Gamow energy scale

    maxwell = np.exp(-E / kT)
    tunneling = np.exp(-np.sqrt(EG / E))
    product = maxwell * tunneling

    maxwell /= maxwell.max()
    tunneling /= tunneling.max()
    product /= product.max()
    peak_E = E[np.argmax(product)]

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, "center-of-mass energy, keV", "relative factor")
    ax.semilogy(E, maxwell, color=COLORS["blue"], lw=2.2, label="thermal tail")
    ax.semilogy(E, tunneling, color=COLORS["orange"], lw=2.2, label="Coulomb tunneling")
    ax.semilogy(E, product, color=COLORS["green"], lw=3.0, label="Gamow window")
    ax.axvline(peak_E, color=COLORS["green"], ls="--", lw=1.4)
    ax.text(peak_E + 0.8, 0.7, f"peak ~ {peak_E:.1f} keV", color=COLORS["green"], fontsize=10)
    ax.set_ylim(1.0e-6, 1.8)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="lower right")
    ax.set_title("Why fusion occurs at solar-core temperature")
    save(fig, "lecture_gamow_window.png")


def figure_spectrum_overview():
    E = np.linspace(0.0, 18.0, 1500)
    spectra = {
        "pp": (beta_shape(E, 0.420), COLORS["blue"]),
        "13N": (0.13 * beta_shape(E, 1.20), COLORS["violet"]),
        "15O": (0.12 * beta_shape(E, 1.73), COLORS["red"]),
        "8B": (0.030 * beta_shape(E, 16.0), COLORS["orange"]),
        "hep": (0.0015 * beta_shape(E, 18.0), COLORS["green"]),
    }

    fig, ax = plt.subplots(figsize=(8.6, 4.8))
    setup_axes(ax, "neutrino energy, MeV", "arbitrary normalized density")
    for label, (y, color) in spectra.items():
        ax.plot(E, y, lw=2.2, color=color, label=label)
    for energy, label, color, height in [
        (0.384, "7Be", COLORS["gray"], 2.1),
        (0.862, "7Be", COLORS["gray"], 2.5),
        (1.44, "pep", COLORS["green"], 1.8),
    ]:
        ax.vlines(energy, 0, height, color=color, lw=2.0)
        ax.text(energy + 0.05, height * 0.8, label, color=color, fontsize=9)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 3.0)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("Solar-neutrino components: lines and continua")
    save(fig, "lecture_spectrum_overview.png")


def figure_radial_production():
    r = np.linspace(0.0, 0.35, 800)
    components = {
        "pp": (np.exp(-(r / 0.16) ** 2), COLORS["blue"]),
        "7Be": (np.exp(-(r / 0.095) ** 2), COLORS["gray"]),
        "8B": (np.exp(-(r / 0.055) ** 2), COLORS["orange"]),
        "CNO": (np.exp(-(r / 0.075) ** 2), COLORS["red"]),
    }

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, "radius / solar radius", "relative production density")
    for label, (y, color) in components.items():
        y = y / np.trapz(y, r)
        y = y / y.max()
        ax.plot(r, y, lw=2.5, color=color, label=label)
    ax.axvspan(0.0, 0.10, color="#ffffff", alpha=0.08)
    ax.text(0.015, 0.87, "core", color="#f0f0f0", fontsize=11)
    ax.set_xlim(0, 0.35)
    ax.set_ylim(0, 1.08)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("Neutrino production is concentrated in the solar core")
    save(fig, "lecture_radial_production.png")


def figure_msw_regimes():
    E = np.linspace(0.1, 18.0, 800)
    sin2theta12 = 0.307
    theta = np.arcsin(np.sqrt(sin2theta12))
    low = 1.0 - 0.5 * np.sin(2.0 * theta) ** 2
    high = sin2theta12
    transition = high + (low - high) / (1.0 + (E / 2.2) ** 2.4)
    transition += 0.010 * np.exp(-((E - 0.86) / 0.08) ** 2)

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, "neutrino energy, MeV", r"$P_{ee}$")
    ax.plot(E, transition, color=COLORS["orange"], lw=3.0, label="MSW turn-on")
    ax.axhline(low, color=COLORS["blue"], ls="--", lw=1.8, label="vacuum averaged")
    ax.axhline(high, color=COLORS["green"], ls="--", lw=1.8, label=r"adiabatic high-E")
    ax.fill_between(E, high, transition, color=COLORS["orange"], alpha=0.16)
    ax.set_xlim(0, 18)
    ax.set_ylim(0.20, 0.68)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("Solar MSW effect as a change of flavour composition")
    save(fig, "lecture_msw_regimes.png")


def figure_day_night_regeneration():
    E = np.linspace(2.0, 18.0, 600)
    envelope = 0.018 * (1.0 - np.exp(-(E - 2.0) / 4.0))
    oscillatory = 1.0 + 0.25 * np.sin(1.6 * E) * np.exp(-E / 16.0)
    delta = envelope * oscillatory

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, "neutrino energy, MeV", r"$P_{ee}^{night}-P_{ee}^{day}$")
    ax.plot(E, delta, color=COLORS["blue"], lw=2.8, label="night regeneration")
    ax.axhline(0.0, color=COLORS["gray"], lw=1.0)
    ax.fill_between(E, 0.0, delta, color=COLORS["blue"], alpha=0.16)
    ax.set_xlim(2, 18)
    ax.set_ylim(-0.004, 0.026)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper left")
    ax.set_title("Earth matter effect is small but coherent")
    save(fig, "lecture_day_night_regeneration.png")


def figure_cross_sections():
    E = np.linspace(0.1, 18.0, 500)
    sigma_e = 9.20e-45 * E
    sigma_x = 1.57e-45 * E

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, "neutrino energy, MeV", r"total cross section, cm$^2$")
    ax.plot(E, sigma_e, color=COLORS["orange"], lw=2.8, label=r"$\nu_e e$")
    ax.plot(E, sigma_x, color=COLORS["blue"], lw=2.8, label=r"$\nu_{\mu,\tau} e$")
    ax.yaxis.set_major_formatter(ScalarFormatter(useMathText=True))
    ax.ticklabel_format(axis="y", style="sci", scilimits=(0, 0))
    ax.text(8.7, 1.18e-43, r"$\sigma\simeq 9.2\times10^{-45}E_\nu$", color=COLORS["orange"], fontsize=10)
    ax.text(8.7, 3.3e-44, r"$\sigma\simeq 1.6\times10^{-45}E_\nu$", color=COLORS["blue"], fontsize=10)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 1.75e-43)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper left")
    ax.set_title("Approximate neutrino-electron cross sections")
    save(fig, "lecture_cross_sections.png")


def figure_chi2_demo():
    p = np.linspace(0.20, 0.46, 400)
    best = 0.316
    sigma = 0.032
    chi2 = ((p - best) / sigma) ** 2

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, r"effective $P_{ee}$", r"$\Delta\chi^2$")
    ax.plot(p, chi2, color=COLORS["green"], lw=3.0)
    ax.axhline(1.0, color=COLORS["orange"], ls="--", lw=1.6, label=r"$1\sigma$ for one parameter")
    ax.axvline(best, color=COLORS["gray"], lw=1.4)
    ax.fill_between(p, 0, chi2, where=chi2 <= 1.0, color=COLORS["green"], alpha=0.18)
    ax.text(best + 0.006, 6.0, f"best fit = {best:.3f}", color=COLORS["gray"], fontsize=10)
    ax.set_ylim(0, 8)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("A fit turns a spectrum into a number with uncertainty")
    save(fig, "lecture_chi2_demo.png")


def figure_flux_hierarchy_clean():
    fluxes = pd.read_csv(DATA / "solar_fluxes_reference.csv")
    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    setup_axes(ax, "source", r"flux, cm$^{-2}$ s$^{-1}$")
    ax.bar(fluxes["source"], fluxes["flux_cm2_s"], color=COLORS["blue"], edgecolor="#ffffff", linewidth=0.5)
    ax.set_yscale("log")
    ax.set_title("Flux hierarchy is not the same as detector visibility")
    save(fig, "lecture_flux_hierarchy.png")


def main():
    FIGURES.mkdir(parents=True, exist_ok=True)
    figure_gamow_window()
    figure_spectrum_overview()
    figure_radial_production()
    figure_msw_regimes()
    figure_day_night_regeneration()
    figure_cross_sections()
    figure_chi2_demo()
    figure_flux_hierarchy_clean()


if __name__ == "__main__":
    main()
