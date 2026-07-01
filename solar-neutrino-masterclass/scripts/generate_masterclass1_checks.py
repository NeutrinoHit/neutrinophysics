"""Generate reference checks for masterclass 1."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "student"
FIGURES = ROOT / "assets" / "figures"
MPLCONFIG = ROOT / "outputs" / "mplconfig"
MPLCONFIG.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG))

import matplotlib.pyplot as plt


COLORS = {
    "blue": "#8ec5ff",
    "orange": "#ffcc8a",
    "green": "#8fd19e",
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


def load_inputs():
    fluxes = pd.read_csv(DATA / "solar_fluxes.csv")
    spectra = pd.read_csv(DATA / "energy_spectra.csv")
    xs = pd.read_csv(DATA / "nu_electron_recoil_cross_sections.csv")

    phi_b8 = float(fluxes.loc[fluxes["source"] == "B8", "flux_cm2_s"].iloc[0])
    b8 = spectra.loc[spectra["source"] == "B8"].copy().sort_values("E_MeV")

    shape = np.interp(
        xs["E_MeV"],
        b8["E_MeV"],
        b8["spectrum_per_MeV"],
        left=0.0,
        right=0.0,
    )
    xs = xs.assign(dphi_dE=phi_b8 * shape)
    return phi_b8, b8, xs


def event_weights(xs):
    n_a = 6.02214076e23
    seconds_per_year = 365.25 * 24 * 3600
    mass_g = 100.0e9
    t_live = seconds_per_year
    n_e = 10.0 * n_a * mass_g / 18.0

    e_grid = np.sort(xs["E_MeV"].unique())
    t_grid = np.sort(xs["T_e_MeV"].unique())
    d_e = np.median(np.diff(e_grid))
    d_t = np.median(np.diff(t_grid))

    weights = (
        n_e
        * t_live
        * xs["dphi_dE"]
        * xs["dsigma_nue_cm2_per_MeV"]
        * d_e
        * d_t
    )
    return weights, n_e, t_live, d_e, d_t


def binned_template(xs, weights, t_min=4.5, t_max=14.0, bin_width=0.5):
    edges = np.arange(t_min, t_max + 0.5 * bin_width, bin_width)
    n_bins = len(edges) - 1
    bin_id = np.digitize(xs["T_e_MeV"], edges) - 1
    valid = (0 <= bin_id) & (bin_id < n_bins)
    m = np.bincount(bin_id[valid], weights=weights[valid], minlength=n_bins)
    centers = 0.5 * (edges[:-1] + edges[1:])
    return edges, centers, m


def fit_alpha(m):
    rng = np.random.default_rng(12345)
    n = rng.poisson(m)
    alphas = np.linspace(0.98, 1.02, 401)
    mu = np.maximum(alphas[:, None] * m[None, :], 1e-300)
    ll = np.sum(n[None, :] * np.log(mu) - mu, axis=1)
    q = -2.0 * (ll - ll.max())
    alpha_hat = n.sum() / m.sum()
    inside = q <= 1.0
    interval = (alphas[inside][0], alphas[inside][-1])
    return n, alphas, q, alpha_hat, interval


def figure_b8_spectrum(b8, phi_b8):
    fig, ax = plt.subplots(figsize=(6.8, 4.2))
    setup_axes(
        ax,
        r"$E_\nu$ [MeV]",
        r"$f_{^8\mathrm{B}}(E_\nu)$ [MeV$^{-1}$]",
    )
    ax.semilogy(b8["E_MeV"], b8["spectrum_per_MeV"], color=COLORS["blue"], lw=2.4)
    ax.set_ylim(1e-6, 1.0)
    ax.set_title(r"$^8$B normalized spectrum")
    ax.text(
        0.04,
        0.08,
        rf"$\Phi_{{^8\mathrm{{B}}}}={phi_b8:.2e}\ \mathrm{{cm^{{-2}}s^{{-1}}}}$",
        transform=ax.transAxes,
        color="#f0f0f0",
        fontsize=10,
    )
    save(fig, "mc1_b8_spectrum.png")


def figure_recoil_template(edges, m):
    fig, ax = plt.subplots(figsize=(7.0, 4.2))
    setup_axes(ax, r"$T_e$ [MeV]", "events / bin")
    ax.stairs(m, edges, color=COLORS["orange"], lw=2.4, label="expectation")
    ax.set_yscale("log")
    ax.set_ylim(10, 4e4)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("Reference event template")
    save(fig, "mc1_recoil_template.png")


def figure_pseudo_data(edges, centers, m, n):
    fig, ax = plt.subplots(figsize=(7.0, 4.2))
    setup_axes(ax, r"$T_e$ [MeV]", "events / bin")
    ax.stairs(m, edges, color=COLORS["orange"], lw=2.4, label="expectation")
    ax.errorbar(
        centers,
        n,
        yerr=np.sqrt(np.maximum(n, 1.0)),
        fmt="o",
        ms=3.8,
        color=COLORS["blue"],
        ecolor=COLORS["blue"],
        elinewidth=0.9,
        capsize=0,
        label="pseudo-data",
    )
    ax.set_yscale("log")
    ax.set_ylim(10, 4e4)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("One pseudo-data sample")
    save(fig, "mc1_pseudo_data.png")


def figure_alpha_scan(alphas, q, alpha_hat, interval):
    fig, ax = plt.subplots(figsize=(6.8, 4.2))
    setup_axes(ax, r"$\alpha_B$", r"$q(\alpha_B)$")
    ax.plot(alphas, q, color=COLORS["blue"], lw=2.4)
    ax.axhline(1.0, color=COLORS["gray"], lw=1.3, ls="--")
    ax.axvline(alpha_hat, color=COLORS["orange"], lw=1.8)
    ax.axvspan(interval[0], interval[1], color=COLORS["green"], alpha=0.24)
    ax.set_ylim(0, 8)
    ax.set_title(r"One-parameter normalization fit")
    save(fig, "mc1_alpha_scan.png")


def main():
    phi_b8, b8, xs = load_inputs()
    weights, n_e, t_live, d_e, d_t = event_weights(xs)
    edges, centers, m = binned_template(xs, weights)
    n, alphas, q, alpha_hat, interval = fit_alpha(m)

    figure_b8_spectrum(b8, phi_b8)
    figure_recoil_template(edges, m)
    figure_pseudo_data(edges, centers, m, n)
    figure_alpha_scan(alphas, q, alpha_hat, interval)

    print(f"Phi_B8 = {phi_b8:.6e} cm^-2 s^-1")
    print(f"Integral f_B8 dE = {np.trapezoid(b8['spectrum_per_MeV'], b8['E_MeV']):.12f}")
    print(f"cross-section grid = {xs['E_MeV'].nunique()} x {xs['T_e_MeV'].nunique()}")
    print(f"dE = {d_e:.6f} MeV, dT = {d_t:.6f} MeV")
    print(f"N_e = {n_e:.6e}, T_live = {t_live:.6e} s")
    print(f"total expected events = {m.sum():.3f}")
    print(f"pseudo-data total = {n.sum():.0f}")
    print(f"alpha_hat = {alpha_hat:.6f}")
    print(f"q <= 1 interval = [{interval[0]:.5f}, {interval[1]:.5f}]")
    print()
    print("threshold_MeV,nbins,total_expected_events,stat_error")
    for t_min in [3.0, 4.5, 6.0]:
        _, _, mt = binned_template(xs, weights, t_min=t_min)
        print(f"{t_min:.1f},{len(mt)},{mt.sum():.3f},{1/np.sqrt(mt.sum()):.6f}")
    print()
    print("T_low_MeV,T_high_MeV,expected_events,pseudo_events")
    for i in range(6):
        print(f"{edges[i]:.1f},{edges[i+1]:.1f},{m[i]:.3f},{n[i]:.0f}")


if __name__ == "__main__":
    main()
