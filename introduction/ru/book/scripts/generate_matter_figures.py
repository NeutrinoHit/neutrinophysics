"""Generate reproducible figures for book chapters 13--15.

Usage: ``python3 generate_matter_figures.py [name ...]`` with names from
``FIGURES``; without names every figure is rebuilt.

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

plt.rcParams.update({"svg.hashsalt": "neutrinohit-matter", "mathtext.fontset": "stix"})

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
    fig.savefig(OUTPUT / f"{stem}.svg", bbox_inches="tight", metadata={"Date": None})
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


# Parametric resonance of chapter 13: theta = 8 deg, layers A1 = 1.6 and A2 = 4.0,
# each half of its own oscillation length, five pairs.  Lengths in L_vac.
CYAN = "#23807d"
PURPLE = "#7350a6"
RED = "#b4492f"
PARAM_THETA = np.radians(8.0)
PARAM_A = (1.6, 4.0)
PARAM_PAIRS = 5


def matter_axis(theta: float, A: float) -> tuple[float, float, float]:
    """R, sin 2theta_m, cos 2theta_m of a layer with A = V / Delta."""
    s2, c2 = np.sin(2.0 * theta), np.cos(2.0 * theta)
    R = np.hypot(c2 - A, s2)
    return R, s2 / R, (c2 - A) / R


def evolve(theta: float, layers: list[tuple[float, float]], per_unit: int = 600):
    """P(e->x) along a profile of layers (A, length in L_vac)."""
    psi = np.array([1.0 + 0j, 0.0 + 0j])
    xs, ps, start = [0.0], [0.0], 0.0
    for A, w in layers:
        R, s2m, c2m = matter_axis(theta, A)
        n_sigma = np.array([[-c2m, s2m], [s2m, c2m]])
        steps = max(2, int(np.ceil(w * per_unit)))
        for x in np.linspace(0.0, w, steps + 1)[1:]:
            phi = np.pi * R * x  # Delta_m x / 2 with Delta = 2 pi / L_vac
            S = np.cos(phi) * np.eye(2) - 1j * np.sin(phi) * n_sigma
            xs.append(start + x)
            ps.append(abs((S @ psi)[1]) ** 2)
        phi = np.pi * R * w
        psi = (np.cos(phi) * np.eye(2) - 1j * np.sin(phi) * n_sigma) @ psi
        start += w
    return np.array(xs), np.array(ps)


def figure_parametric_profile() -> None:
    widths = [0.5 / matter_axis(PARAM_THETA, A)[0] for A in PARAM_A]
    pair = list(zip(PARAM_A, widths))
    layers = pair * PARAM_PAIRS
    total = sum(w for _, w in layers)
    mean_A = sum(A * w for A, w in pair) / sum(widths)
    x, p = evolve(PARAM_THETA, layers)
    x1, p1 = evolve(PARAM_THETA, [(PARAM_A[0], total)])
    x2, p2 = evolve(PARAM_THETA, [(PARAM_A[1], total)])
    xm, pm = evolve(PARAM_THETA, [(mean_A, total)])

    fig, (top, bottom) = plt.subplots(
        2, 1, figsize=(8.4, 5.6), sharex=True, gridspec_kw={"height_ratios": [1, 1.5]}
    )
    setup(top, "", r"$A=V/\Delta$")
    start = 0.0
    for k, (A, w) in enumerate(layers):
        color = CYAN if k % 2 == 0 else PURPLE
        top.fill_between([start, start + w], 0.0, A, color=color, alpha=0.22, linewidth=0)
        top.plot([start, start + w], [A, A], color=color, linewidth=2.2)
        start += w
    top.axhline(np.cos(2.0 * PARAM_THETA), color=RED, linewidth=1.2, linestyle="--")
    top.text(total * 0.995, np.cos(2.0 * PARAM_THETA) - 0.12, r"резонанс $A=\cos2\theta$",
             color=RED, ha="right", va="top", fontsize=10)
    top.set_ylim(0.0, 4.6)
    top.set_yticks([0, 1, 2, 3, 4])
    top.set_title(r"$\theta=8^\circ$: чередование $A_1=1.6$ и $A_2=4.0$, слои по $L_{m,k}/2$",
                  color=INK)

    setup(bottom, r"$x/L_{\rm vac}$", r"$P_{e\to x}(x)$")
    bottom.plot(x, p, color=GOLD, linewidth=2.6, label="чередование")
    bottom.plot(x1, p1, color=CYAN, linewidth=1.4, linestyle="--",
                label=rf"только $A_1$: $P\leq{p1.max():.2f}$")
    bottom.plot(x2, p2, color=PURPLE, linewidth=1.4, linestyle="--",
                label=rf"только $A_2$: $P\leq{p2.max():.2f}$")
    bottom.plot(xm, pm, color=MUTED, linewidth=1.4, linestyle=":",
                label=rf"средняя $\bar A={mean_A:.2f}$: $P\leq{pm.max():.2f}$")
    bottom.set_xlim(0.0, total)
    bottom.set_ylim(0.0, 1.05)
    bottom.legend(frameon=False, fontsize=11, loc="upper left")
    save(fig, "parametric_profile")


def _arrow(ax, angle: float, color: str, length: float = 0.9, lw: float = 2.4) -> None:
    ax.annotate("", xy=(length * np.cos(angle), length * np.sin(angle)), xytext=(0.0, 0.0),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=16))


def _plane(ax, xlim=(-0.45, 1.3), ylim=(-0.75, 1.2)) -> None:
    ax.set(xlim=xlim, ylim=ylim, aspect="equal")
    ax.axis("off")
    ax.plot([xlim[0] + 0.05, 1.15], [0, 0], color=MUTED, lw=1.0)
    ax.plot([0, 0], [ylim[0] + 0.05, 1.1], color=MUTED, lw=1.0)
    ax.text(1.18, 0.0, r"$\nu_e$", color=RED, fontsize=15, va="center")
    ax.text(0.03, 1.12, r"$\nu_x$", color=INK, fontsize=15)


def figure_parametric_mirrors() -> None:
    fig, (one, two) = plt.subplots(1, 2, figsize=(9.6, 4.6))
    fig.set_facecolor("white")

    # one mirror: the half-period layer reflects psi about the nu_2m axis
    _plane(one)
    m, v0 = np.radians(50.0), np.radians(15.0)
    v1 = 2.0 * m - v0
    d = np.array([np.cos(m), np.sin(m)])
    one.plot([-0.45 * d[0], 1.08 * d[0]], [-0.45 * d[1], 1.08 * d[1]], color=CYAN, lw=2.0, ls="--")
    q = np.array([np.cos(m - np.pi / 2), np.sin(m - np.pi / 2)])
    one.plot([-0.4 * q[0], 0.95 * q[0]], [-0.4 * q[1], 0.95 * q[1]], color=MUTED, lw=1.2, ls=":")
    a = 0.9 * np.array([np.cos(v0), np.sin(v0)])
    b = 0.9 * np.array([np.cos(v1), np.sin(v1)])
    one.plot([a[0], b[0]], [a[1], b[1]], color=MUTED, lw=1.1, ls=":")
    foot, s = (a + b) / 2.0, 0.05
    corner = [foot - s * d, foot - s * d + s * (b - a) / np.linalg.norm(b - a),
              foot + s * (b - a) / np.linalg.norm(b - a)]
    one.plot(*np.array(corner).T, color=MUTED, lw=1.0)
    _arrow(one, v0, RED)
    _arrow(one, v1, GOLD)
    one.text(*(1.17 * d), r"$\nu_{2m}$", color=CYAN, fontsize=15, ha="center")
    one.text(*(1.02 * q + [0.02, -0.04]), r"$\nu_{1m}$", color=MUTED, fontsize=15)
    one.text(0.96 * np.cos(v0 - 0.1), 0.96 * np.sin(v0 - 0.1) - 0.02, r"$\psi$", fontsize=15)
    one.text(0.98 * np.cos(v1 + 0.12) - 0.1, 0.98 * np.sin(v1 + 0.12), r"$S_k\psi$",
             color=GOLD, fontsize=15)
    one.set_title("слой: отражение от оси $\\nu_{2m}$", color=INK, fontsize=12)

    # two mirrors: two reflections make a rotation by twice the angle between them
    _plane(two, xlim=(-0.15, 1.35), ylim=(-0.25, 1.2))
    m1, m2 = np.radians(10.0), np.radians(35.0)
    w0, w1 = 0.0, 2.0 * m1
    w2 = 2.0 * m2 - w1
    for angle, color, tag in ((m1, CYAN, r"$\nu_{2m}^{(1)}$"), (m2, PURPLE, r"$\nu_{2m}^{(2)}$")):
        two.plot([0, 1.05 * np.cos(angle)], [0, 1.05 * np.sin(angle)], color=color, lw=2.0, ls="--")
        two.text(1.08 * np.cos(angle), 1.08 * np.sin(angle) + 0.02, tag, color=color, fontsize=14)
    t = np.linspace(m1, m2, 40)
    two.plot(0.97 * np.cos(t), 0.97 * np.sin(t), color=MUTED, lw=1.2)
    two.text(1.1 * np.cos((m1 + m2) / 2), 1.1 * np.sin((m1 + m2) / 2) - 0.04, r"$\alpha$",
             color=MUTED, fontsize=14)
    t = np.linspace(w0, w2, 60)
    two.plot(0.42 * np.cos(t), 0.42 * np.sin(t), color=GOLD, lw=2.2)
    two.text(0.47 * np.cos(w2 / 2) + 0.02, 0.47 * np.sin(w2 / 2) - 0.05, r"$\beta=2\alpha$",
             color=GOLD, fontsize=14)
    for start, end in ((w0, w1), (w1, w2)):
        t = np.linspace(start, end, 40)
        two.plot(0.62 * np.cos(t), 0.62 * np.sin(t), color=MUTED, lw=1.0, ls=":")
    _arrow(two, w1, "#9aa7ae", lw=2.0)
    _arrow(two, w0, RED, length=0.86)
    _arrow(two, w2, GOLD)
    two.text(0.76 * np.cos(w1), 0.76 * np.sin(w1) + 0.1, r"$\psi_1$", color="#7d8b92", fontsize=14)
    two.text(0.95 * np.cos(w2) - 0.1, 0.95 * np.sin(w2) + 0.04, r"$\psi_2$", color=GOLD, fontsize=14)
    two.set_title("пара: поворот на $2\\alpha$ (углы условные)", color=INK, fontsize=12)
    save(fig, "parametric_mirrors")


def figure_bloch_sphere() -> None:
    az, el = np.radians(28.0), np.radians(18.0)

    def proj(v):
        v = np.asarray(v, dtype=float)
        x1 = v[0] * np.cos(az) + v[1] * np.sin(az)
        y1 = -v[0] * np.sin(az) + v[1] * np.cos(az)
        return x1, v[2] * np.cos(el) - y1 * np.sin(el), y1 * np.cos(el) + v[2] * np.sin(el)

    def curve(ax, pts, color, lw, front_only=False):
        X, Y, D = np.array([proj(p) for p in pts]).T
        for i in range(1, len(X)):
            front = D[i] + D[i - 1] >= 0
            if front or not front_only:
                ax.plot(X[i - 1:i + 1], Y[i - 1:i + 1], color=color, lw=lw,
                        ls="-" if front else (0, (3, 3)), alpha=1.0 if front else 0.55,
                        solid_capstyle="round")

    fig, ax = plt.subplots(figsize=(5.0, 5.0))
    fig.set_facecolor("white")
    ax.set(xlim=(-1.3, 1.45), ylim=(-1.3, 1.35), aspect="equal")
    ax.axis("off")
    t = np.linspace(0.0, 2.0 * np.pi, 240)
    ax.plot(np.cos(t), np.sin(t), color="#9aa7ae", lw=1.2)
    curve(ax, np.c_[np.cos(t), np.sin(t), 0 * t], "#b9c4c9", 1.0)
    curve(ax, np.c_[np.sin(t), 0 * t, np.cos(t)], "#8d9ca3", 1.1)

    theta_m = np.radians(60.0)  # illustrative layer
    n = np.array([np.sin(2 * theta_m), 0.0, -np.cos(2 * theta_m)])
    r0 = np.array([0.0, 0.0, 1.0])
    c = n @ r0
    u = r0 - c * n
    w = np.cross(n, u)
    cone = lambda s: c * n + np.outer(np.cos(s), u) + np.outer(np.sin(s), w)
    a, b = proj(1.2 * n), proj(-1.08 * n)
    ax.plot([b[0], a[0]], [b[1], a[1]], color=CYAN, lw=2.2)
    curve(ax, cone(t), MUTED, 1.1)
    curve(ax, cone(np.linspace(0.0, np.pi, 120)), GOLD, 2.6)
    r1 = cone(np.array([np.pi]))[0]
    for vec, color in ((r0, RED), (r1, GOLD)):
        X, Y, _ = proj(vec)
        ax.annotate("", xy=(X, Y), xytext=(0, 0),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=2.4, mutation_scale=16))
    for z in (1, -1):
        X, Y, _ = proj([0, 0, z])
        ax.plot(X, Y, "o", color=INK, ms=4)
    X, Y, _ = proj(r0)
    ax.text(X + 0.06, Y + 0.09, r"$\nu_e$", color=RED, fontsize=15)
    ax.text(X + 0.06, Y - 0.45, r"$\mathbf{r}$", color=RED, fontsize=15)
    X, Y, _ = proj([0, 0, -1])
    ax.text(X + 0.05, Y - 0.16, r"$\nu_x$", color=INK, fontsize=15)
    ax.text(a[0] + 0.03, a[1] + 0.03, r"$\mathbf{n}_k$", color=CYAN, fontsize=15)
    X, Y, _ = proj(1.15 * r1)
    ax.text(X, Y - 0.05, r"$S_k\mathbf{r}$", color=GOLD, fontsize=15)
    save(fig, "parametric_bloch")


FIGURES = {
    "solar_pee_curve": figure_solar_survival,
    "earth_day_night_regeneration": figure_day_night,
    "parametric_profile": figure_parametric_profile,
    "parametric_mirrors": figure_parametric_mirrors,
    "parametric_bloch": figure_bloch_sphere,
}


if __name__ == "__main__":
    import sys

    for name in sys.argv[1:] or list(FIGURES):
        FIGURES[name]()
