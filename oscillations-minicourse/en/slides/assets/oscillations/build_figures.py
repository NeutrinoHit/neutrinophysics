"""Figures for the school lectures on neutrino oscillations (dark lecture style).

Run:  python build_figures.py [name ...]      (default: all figures)
Output: ../../media/figures/<name>.svg and .png

All curves are computed with osc.py (NuFIT 6.1 normal-ordering best fit, PREM, model electron fractions).
Experiment baselines/energies used on the L-E map are listed in EXPERIMENTS with their sources (SOURCES.md).
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

import osc

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "media" / "figures"

BG, FG, GRID = "#000000", "#eeeeee", "#344250"
BLUE, GOLD, ORANGE, GREEN, VIOLET, GREY = "#73c7ff", "#ffd166", "#ff8a5c", "#7ee2ae", "#c3a6ff", "#8a96a3"
FONT = 17
P_NO = osc.NUFIT61["NO"]

# Baselines (km) and energies (GeV) on the L-E map; see SOURCES.md.
# Reactors are drawn at the illustrative 4 MeV used throughout; DUNE at its derived first maximum.
DUNE_FIRST_MAX_GEV = osc.PHASE_COEFFICIENT * P_NO.dm31 * 1300.0 / (np.pi / 2)
EXPERIMENTS = [
    # name, L_km, E_GeV, label offset (dx, dy in points), colour
    ("Daya Bay", 1.65, 4e-3, (12, 0), GOLD),
    ("JUNO", 52.5, 4e-3, (12, 0), GOLD),
    ("KamLAND", 180.0, 4e-3, (12, 0), GOLD),
    ("T2K", 295.0, 0.6, (12, -6), BLUE),
    ("NOvA", 810.0, 2.0, (12, -4), BLUE),
    ("DUNE", 1300.0, DUNE_FIRST_MAX_GEV, (12, 6), BLUE),
]


def style():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"font.size": FONT, "text.color": FG, "axes.labelcolor": FG, "axes.edgecolor": GRID,
                         "xtick.color": FG, "ytick.color": FG, "svg.fonttype": "path", "mathtext.fontset": "stix",
                         "axes.facecolor": BG, "figure.facecolor": BG, "legend.frameon": False})
    return plt


def save(fig, name):
    OUT.mkdir(parents=True, exist_ok=True)
    for ext in ("svg", "png"):
        fig.savefig(OUT / f"{name}.{ext}", facecolor=BG, dpi=150)
    import matplotlib.pyplot as plt
    plt.close(fig)
    print("wrote", OUT / f"{name}.svg")


def clean(ax):
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.grid(color=GRID, lw=0.6, alpha=0.6)


def cmap_dark():
    from matplotlib.colors import LinearSegmentedColormap
    return LinearSegmentedColormap.from_list("nh", [(0.004, 0.008, 0.020), (0.05, 0.12, 0.30), (0.12, 0.42, 0.75),
                                                    (0.45, 0.88, 1.00), (1.0, 0.82, 0.40), (1.0, 0.98, 0.90)])


# ---------------------------------------------------------------------------------------------------------------
def fig_beats():
    """Two waves with slightly different frequencies and their sum: beats."""
    plt = style()
    t = np.linspace(0, 1, 4000)
    f1, f2 = 40.0, 44.0
    y1, y2 = np.cos(2 * np.pi * f1 * t), np.cos(2 * np.pi * f2 * t)
    fig, axs = plt.subplots(3, 1, figsize=(12.5, 5.6), sharex=True, gridspec_kw={"hspace": 0.12})
    axs[0].plot(t, y1, color=BLUE, lw=1.4)
    axs[1].plot(t, y2, color=GOLD, lw=1.4)
    s = y1 + y2
    env = 2 * np.abs(np.cos(np.pi * (f2 - f1) * t))
    axs[2].plot(t, s, color=FG, lw=1.0)
    axs[2].fill_between(t, -env, env, color=ORANGE, alpha=0.18, lw=0)
    axs[2].plot(t, env, color=ORANGE, lw=2.2)
    labels = ["wave 1:  frequency $f_1$", "wave 2:  frequency $f_2$", "sum:  beats with frequency $f_2-f_1$"]
    for ax, lab in zip(axs, labels):
        ax.set_yticks([]); ax.set_ylim(-2.3 if ax is axs[2] else -1.3, 2.3 if ax is axs[2] else 1.3)
        for sp in ax.spines.values():
            sp.set_visible(False)
        ax.text(0.0, 1.0, lab, transform=ax.transAxes, ha="left", va="bottom", fontsize=FONT)
    axs[2].set_xticks([]); axs[2].set_xlabel("time  (or distance travelled)")
    fig.subplots_adjust(left=0.03, right=0.99, top=0.92, bottom=0.1)
    save(fig, "beats")


def fig_le_map():
    """L-E plane: where the first oscillation maximum of each splitting lies, and where experiments sit."""
    plt = style()
    fig, ax = plt.subplots(figsize=(13.0, 7.2))
    E = np.geomspace(1e-4, 1e3, 300)
    for dm2, col, lab in ((P_NO.dm31, BLUE, r"fast clock  $\Delta m^2_{31}$"), (P_NO.dm21, GOLD, r"slow clock  $\Delta m^2_{21}$")):
        L1 = (np.pi / 2) / osc.PHASE_COEFFICIENT * E / dm2           # first maximum
        ax.fill_between(E, L1 / 2, L1 * 2, color=col, alpha=0.13, lw=0)
        ax.plot(E, L1, color=col, lw=2.6, label=lab + ": first maximum")
    ax.axhline(2 * osc.R_EARTH, color=GREEN, lw=1.4, ls=(0, (5, 4)))
    ax.text(1.3e-4, 2 * osc.R_EARTH * 1.18, "Earth diameter 12 742 km: the longest path of atmospheric neutrinos", color=GREEN, fontsize=FONT - 3)
    for name, L, e, (dx, dy), col in EXPERIMENTS:
        ax.plot([e], [L], marker="o", ms=12, color=col, mec=BG, mew=1.5, zorder=5)
        ax.annotate(name, (e, L), xytext=(dx, dy), textcoords="offset points", color=col, fontsize=FONT - 2, va="center")
    ax.set_xscale("log"); ax.set_yscale("log")
    ax.set_xlim(1e-4, 1e3); ax.set_ylim(0.1, 1e5)
    ax.set_xlabel("neutrino energy  $E$  [GeV]"); ax.set_ylabel("distance  $L$  [km]")
    sec = ax.secondary_xaxis("top", functions=(lambda x: x * 1e3, lambda x: x / 1e3))
    sec.set_xlabel("[MeV]", fontsize=FONT - 3, loc="right")
    ax.legend(loc="lower right", fontsize=FONT - 2)
    clean(ax)
    fig.subplots_adjust(left=0.09, right=0.97, top=0.9, bottom=0.11)
    save(fig, "le-map")


def fig_averaging():
    """Two-flavor probability against L/L_osc: monochromatic beam and beams with an energy spread."""
    plt = style()
    s2 = P_NO.s12sq
    amp = 4 * s2 * (1 - s2)
    x = np.linspace(0, 12, 3000)                      # L / L_osc at the mean energy
    fig, ax = plt.subplots(figsize=(13.0, 5.6))
    rng = np.random.default_rng(1)
    for spread, col, lab in ((0.0, BLUE, "one energy"), (0.05, GOLD, "energy spread 5 %"), (0.2, ORANGE, "energy spread 20 %")):
        if spread == 0:
            P = amp * np.sin(np.pi * x) ** 2
        else:
            r = 1 + spread * rng.standard_normal(4000)
            r = r[r > 0.2]
            P = amp * np.mean(np.sin(np.pi * x[:, None] / r[None, :]) ** 2, axis=1)
        ax.plot(x, P, color=col, lw=2.4 if spread else 1.6, label=lab)
    ax.axhline(amp / 2, color=FG, lw=1.2, ls=(0, (5, 4)))
    ax.text(12, amp / 2 + 0.03, r"average: $\frac{1}{2}\sin^2 2\theta$", ha="right", fontsize=FONT)
    ax.axhline(amp, color=GREY, lw=0.8, ls=(0, (1, 3)))
    ax.text(0.15, amp + 0.025, r"$\sin^2 2\theta$", color=GREY, fontsize=FONT - 1)
    ax.set_xlim(0, 12); ax.set_ylim(0, 1.0)
    ax.set_xlabel(r"$L/L_{\rm osc}$"); ax.set_ylabel("transition probability")
    ax.legend(loc="upper right", ncols=3, fontsize=FONT - 2, bbox_to_anchor=(1.0, 1.08))
    clean(ax)
    fig.subplots_adjust(left=0.08, right=0.98, top=0.9, bottom=0.14)
    save(fig, "averaging")


def fig_reactor_clocks():
    """Reactor antineutrino survival at 4 MeV against distance: the two clocks."""
    plt = style()
    L = np.geomspace(0.1, 200, 8000)
    E = 4e-3
    P = osc.probability_vacuum("e", "e", L, E, P_NO, anti=True)
    p0 = osc.with_params(P_NO, s13sq=0.0)
    P0 = osc.probability_vacuum("e", "e", L, E, p0, anti=True)
    fig, ax = plt.subplots(figsize=(13.0, 5.8))
    ax.plot(L, P0, color=GOLD, lw=1.8, ls=(0, (5, 4)), label=r"slow clock only ($\theta_{13}=0$)")
    ax.plot(L, P, color=BLUE, lw=2.2, label="three flavors")
    for name, x in (("Daya Bay", 1.65), ("JUNO", 52.5)):
        ax.axvline(x, color=GREY, lw=1.0, ls=(0, (1, 3)))
        ax.text(x * 1.06, 1.02, name, color=GREY, fontsize=FONT - 2, va="bottom")
    ax.set_xscale("log"); ax.set_xlim(0.1, 200); ax.set_ylim(0, 1.1)
    ax.set_xlabel("distance from the reactor  $L$  [km]"); ax.set_ylabel(r"survival  $P(\bar\nu_e\to\bar\nu_e)$")
    ax.text(0.12, 0.13, r"$E_\nu = 4$ MeV", fontsize=FONT)
    ax.legend(loc="lower left", fontsize=FONT - 2, bbox_to_anchor=(0.0, 0.18))
    clean(ax)
    fig.subplots_adjust(left=0.08, right=0.98, top=0.95, bottom=0.14)
    save(fig, "reactor-clocks")


def fig_matter_mixing():
    """Effective mixing in matter: universal curve against A = 2EV/dm2, and the Earth in GeV."""
    plt = style()
    fig, (a, b) = plt.subplots(1, 2, figsize=(15.0, 6.0), gridspec_kw={"wspace": 0.28})
    A = np.linspace(-3, 4, 2000)
    for s2, col, lab in ((P_NO.s12sq, GOLD, r"$\theta_{12}=33.8^\circ$"), (P_NO.s13sq, BLUE, r"$\theta_{13}=8.6^\circ$")):
        a.plot(A, osc.sin2_2theta_matter(s2, A), color=col, lw=2.6, label=lab)
    a.axvline(0, color=GREY, lw=1, ls=(0, (1, 3)))
    a.text(0.08, 0.04, "vacuum", color=GREY, fontsize=FONT - 3)
    a.text(-2.9, 0.92, "antineutrinos\n($A<0$)", color=GREY, fontsize=FONT - 3, va="top")
    a.text(1.4, 0.92, "neutrinos\n($A>0$)", color=GREY, fontsize=FONT - 3, va="top")
    a.set_xlabel(r"$A = 2EV/\Delta m^2$  (matter / vacuum)"); a.set_ylabel(r"effective mixing  $\sin^2 2\theta_m$")
    a.set_xlim(-3, 4); a.set_ylim(0, 1.05); a.legend(loc="center right", fontsize=FONT - 2); clean(a)
    E = np.geomspace(0.5, 50, 1500)
    for label, yr, col in (("mantle", 4.48 * osc.YE_MANTLE, GREEN), ("outer core", 10.9 * osc.YE_CORE, ORANGE)):
        AA = 2 * E * 1e9 * osc.potential(yr) / P_NO.dm31
        b.plot(E, osc.sin2_2theta_matter(P_NO.s13sq, AA), color=col, lw=2.6, label=rf"$\nu$, {label}")
        b.plot(E, osc.sin2_2theta_matter(P_NO.s13sq, -AA), color=col, lw=1.6, ls=(0, (5, 4)), label=rf"$\bar\nu$, {label}")
    b.axhline(4 * P_NO.s13sq * (1 - P_NO.s13sq), color=GREY, lw=1, ls=(0, (1, 3)))
    b.text(45, 0.1, "vacuum", color=GREY, fontsize=FONT - 3, ha="right")
    b.set_xscale("log"); b.set_xlim(0.5, 50); b.set_ylim(0, 1.05)
    b.set_xticks([0.5, 1, 2, 5, 10, 20, 50]); b.set_xticklabels(["0.5", "1", "2", "5", "10", "20", "50"])
    b.set_xlabel(r"neutrino energy  $E$  [GeV]"); b.set_ylabel(r"$\sin^2 2\theta_{13,m}$ in the Earth")
    b.legend(loc="upper right", fontsize=FONT - 4); clean(b)
    fig.subplots_adjust(left=0.065, right=0.985, top=0.95, bottom=0.14)
    save(fig, "matter-mixing")


def fig_earth_paths():
    """Earth cross-section with PREM layers and chords; electron density along each chord."""
    plt = style()
    from matplotlib.patches import Circle
    fig = plt.figure(figsize=(15.5, 6.6))
    a = fig.add_axes([0.0, 0.03, 0.40, 0.94]); a.set_aspect("equal"); a.axis("off")
    R = osc.R_EARTH
    for r, col, name in ((R, "#2a3d55", "mantle"), (osc.R_CORE, "#7a4a2a", "outer core (liquid)"), (osc.R_INNER, "#c98a3a", "inner core")):
        a.add_patch(Circle((0, 0), r, fc=col, ec=BG, lw=1.5))
    a.text(0, 0.80 * R, "mantle", ha="center", fontsize=FONT - 2)
    a.text(0, 0.36 * R, "outer core", ha="center", fontsize=FONT - 2)
    a.text(0, -0.05 * R, "inner\ncore", ha="center", va="center", fontsize=FONT - 4)
    det = np.array([0.0, R])
    a.plot(*det, marker="o", ms=11, color=GOLD, zorder=5)
    a.text(det[0] + 300, det[1] + 300, "detector", color=GOLD, fontsize=FONT - 2)
    cosz = [-0.3, -0.6, -0.85, -0.97]
    cols = [GREEN, BLUE, VIOLET, ORANGE]
    for c, col in zip(cosz, cols):
        L = osc.chord_length(c)
        # direction towards the source (below the horizon): unit vector at zenith angle theta from the local vertical
        th = np.arccos(c)
        u = np.array([np.sin(th), np.cos(th)])
        src = det + L * u
        a.plot([det[0], src[0]], [det[1], src[1]], color=col, lw=2.6)
        a.plot(*src, marker="o", ms=6, color=col)
    a.set_xlim(-1.05 * R, 1.25 * R); a.set_ylim(-1.08 * R, 1.12 * R)
    b = fig.add_axes([0.47, 0.14, 0.51, 0.8])
    for c, col in zip(cosz, cols):
        lay = osc.path_layers(c, 600)
        ds = np.array([l for l, _ in lay]); V = np.array([v for _, v in lay])
        s = np.cumsum(ds) - ds / 2
        b.plot(s, V / osc.V_PER_YE_RHO, color=col, lw=2.4, label=rf"$\cos\theta_z={c}$:  $L$ = {osc.chord_length(c):,.0f} km".replace(",", " "))
    b.set_xlabel("distance along the path  [km]"); b.set_ylabel(r"$Y_e\,\rho$  [g/cm$^3$]  $\propto$ electron density")
    b.set_xlim(0, 2 * R); b.set_ylim(0, 6.5)
    b.legend(loc="upper left", fontsize=FONT - 4, ncols=2); clean(b)
    save(fig, "earth-paths")


def oscillogram_grid(nE=220, nc=180, anti=False, steps=80, **kw):
    E = np.geomspace(1.0, 20.0, nE)
    cz = np.linspace(-1.0, -0.05, nc)
    Pme = np.empty((nc, nE)); Pmm = np.empty((nc, nE))
    for i, c in enumerate(cz):
        P = osc.probability_layers(E, osc.path_layers(c, steps, **kw), P_NO, anti)
        Pme[i] = P[:, 1, 0]; Pmm[i] = P[:, 1, 1]
    return E, cz, Pme, Pmm


def fig_oscillogram():
    plt = style()
    fig, axs = plt.subplots(1, 2, figsize=(15.5, 6.6), sharey=True, gridspec_kw={"wspace": 0.06})
    core = -np.sqrt(1 - (osc.R_CORE / osc.R_EARTH) ** 2)
    for ax, anti, title in ((axs[0], False, r"neutrinos  $\nu_\mu\to\nu_e$"), (axs[1], True, r"antineutrinos  $\bar\nu_\mu\to\bar\nu_e$")):
        E, cz, Pme, _ = oscillogram_grid(anti=anti)
        im = ax.pcolormesh(E, cz, Pme, cmap=cmap_dark(), vmin=0, vmax=0.5, shading="auto", rasterized=True)
        ax.axhline(core, color=FG, lw=1.0, ls=(0, (5, 4)), alpha=0.8)
        ax.set_xscale("log"); ax.set_xticks([1, 2, 5, 10, 20]); ax.set_xticklabels(["1", "2", "5", "10", "20"])
        ax.set_xlabel("neutrino energy  $E$  [GeV]"); ax.set_title(title, fontsize=FONT)
    axs[0].set_ylabel(r"$\cos\theta_z$   (−1: through the centre)")
    axs[0].text(1.05, core + 0.02, "core", color=FG, fontsize=FONT - 3, va="bottom")
    axs[0].text(1.05, core - 0.02, "", color=FG)
    cax = fig.add_axes([0.925, 0.14, 0.012, 0.76])
    cb = fig.colorbar(im, cax=cax); cb.set_label("probability")
    fig.subplots_adjust(left=0.07, right=0.91, top=0.9, bottom=0.14)
    save(fig, "oscillogram")


def fig_core_ye():
    """Change of P(nu_mu -> nu_e) when the outer and inner core electron fraction rises by 1 %."""
    plt = style()
    from matplotlib.colors import LinearSegmentedColormap
    E = np.geomspace(1.0, 20.0, 220)
    cz = np.linspace(-1.0, -0.8, 120)
    d = np.empty((cz.size, E.size)); base = np.empty_like(d)
    for i, c in enumerate(cz):
        p0 = osc.probability_layers(E, osc.path_layers(c, 80), P_NO)[:, 1, 0]
        p1 = osc.probability_layers(E, osc.path_layers(c, 80, ye_core=osc.YE_CORE * 1.01), P_NO)[:, 1, 0]
        d[i] = p1 - p0; base[i] = p0
    core = -np.sqrt(1 - (osc.R_CORE / osc.R_EARTH) ** 2)
    fig, (a, b) = plt.subplots(1, 2, figsize=(15.5, 6.2), gridspec_kw={"wspace": 0.25, "width_ratios": [1.15, 1]})
    cmap = LinearSegmentedColormap.from_list("div", [ORANGE, "#3a1e18", BG, "#123a5a", BLUE])
    lim = 0.03
    im = a.pcolormesh(E, cz, np.clip(d, -lim, lim), cmap=cmap, vmin=-lim, vmax=lim, shading="auto", rasterized=True)
    a.axhline(core, color=FG, lw=1.0, ls=(0, (5, 4)), alpha=0.8)
    a.text(1.05, core + 0.006, "core boundary", fontsize=FONT - 4)
    a.set_xscale("log"); a.set_xticks([1, 2, 5, 10, 20]); a.set_xticklabels(["1", "2", "5", "10", "20"])
    a.set_xlabel("neutrino energy  $E$  [GeV]"); a.set_ylabel(r"$\cos\theta_z$")
    cb = fig.colorbar(im, ax=a, pad=0.02); cb.set_label(r"$\Delta P(\nu_\mu\to\nu_e)$")
    c0 = -0.95
    i = np.argmin(abs(cz - c0))
    b.plot(E, base[i], color=BLUE, lw=2.4, label=r"core $Y_e = 0.466$ (pure Fe)")
    b.plot(E, base[i] + d[i], color=GOLD, lw=2.0, ls=(0, (5, 3)), label=r"core $Y_e$ larger by 1 %")
    b.set_xscale("log"); b.set_xticks([1, 2, 5, 10, 20]); b.set_xticklabels(["1", "2", "5", "10", "20"])
    b.set_xlabel("neutrino energy  $E$  [GeV]"); b.set_ylabel(r"$P(\nu_\mu\to\nu_e)$")
    b.set_title(rf"$\cos\theta_z = {c0}$", fontsize=FONT)
    b.legend(loc="upper right", fontsize=FONT - 4); b.set_ylim(0, 0.5); clean(b)
    fig.subplots_adjust(left=0.07, right=0.98, top=0.92, bottom=0.14)
    save(fig, "core-ye")
    print(f"max |dP| = {abs(d).max():.3f}")


def fig_prem():
    plt = style()
    r = np.linspace(0, osc.R_EARTH, 4000)
    rho = osc.density(r)
    fig, ax = plt.subplots(figsize=(12.5, 5.6))
    for r0, r1, col, name in ((0, osc.R_INNER, "#c98a3a", "inner\ncore"), (osc.R_INNER, osc.R_CORE, "#7a4a2a", "outer core\n(liquid iron alloy)"),
                              (osc.R_CORE, osc.R_EARTH, "#2a3d55", "mantle (rock)")):
        ax.axvspan(r0, r1, color=col, alpha=0.35, lw=0)
        ax.text((r0 + r1) / 2, 14.3, name, ha="center", va="top", fontsize=FONT - 3)
    ax.plot(r, rho, color=FG, lw=2.6, label=r"density $\rho$ (PREM)")
    ax.plot(r, rho * osc.electron_fraction(r), color=GOLD, lw=2.2, ls=(0, (5, 3)), label=r"$Y_e\,\rho$: what neutrinos feel")
    ax.set_xlim(0, osc.R_EARTH); ax.set_ylim(0, 14.5)
    ax.set_xlabel("distance from the centre  $r$  [km]"); ax.set_ylabel(r"[g/cm$^3$]")
    ax.legend(loc="lower left", fontsize=FONT - 2); clean(ax)
    fig.subplots_adjust(left=0.07, right=0.98, top=0.96, bottom=0.14)
    save(fig, "prem")


def fig_solar_pee():
    """Adiabatic two-flavor solar nu_e survival against energy, production at the 8B-region electron density."""
    plt = style()
    E = np.geomspace(0.1, 20, 600)                    # MeV
    s2 = P_NO.s12sq
    fig, ax = plt.subplots(figsize=(13.0, 5.6))
    for ne, col, lab in ((SOLAR_NE_B8, BLUE, r"born where $^8$B neutrinos are made"), (SOLAR_NE_CENTRE, GOLD, "born at the centre")):
        V = osc.V_PER_YE_RHO * ne / osc.N_A
        A = 2 * E * 1e6 * V / P_NO.dm21
        c2m = (1 - 2 * s2 - A) / np.sqrt((1 - 2 * s2 - A) ** 2 + 4 * s2 * (1 - s2))
        P = 0.5 * (1 + (1 - 2 * s2) * c2m)
        ax.plot(E, P, color=col, lw=2.6 if col == BLUE else 1.6, ls="-" if col == BLUE else (0, (5, 4)), label=lab)
    lo, hi = 1 - 2 * s2 * (1 - s2), s2
    for y, t in ((lo, r"$1-\frac{1}{2}\sin^2 2\theta_{12}$: vacuum averaging"), (hi, r"$\sin^2\theta_{12}$: adiabatic MSW")):
        ax.axhline(y, color=GREY, lw=1, ls=(0, (1, 3)))
        ax.text(0.105, y + 0.012, t, color=GREY, fontsize=FONT - 3)
    ax.set_xscale("log"); ax.set_xlim(0.1, 20); ax.set_ylim(0, 0.75)
    ax.set_xticks([0.1, 0.3, 1, 3, 10, 20]); ax.set_xticklabels(["0.1", "0.3", "1", "3", "10", "20"])
    ax.set_xlabel("neutrino energy  $E$  [MeV]"); ax.set_ylabel(r"survival  $P(\nu_e\to\nu_e)$")
    ax.legend(loc="lower left", fontsize=FONT - 3); clean(ax)
    fig.subplots_adjust(left=0.08, right=0.98, top=0.96, bottom=0.14)
    save(fig, "solar-pee")


# Earth heat budget (TW); sources in SOURCES-check.md and SOURCES-check-2.md.
HEAT_TOTAL = (47.0, 2.0, 2.0)                      # Davies & Davies 2010
HEAT_MODELS = [("cosmochemical", 11.0, 2.0, 2.0), ("geochemical", 20.0, 4.0, 4.0), ("geodynamical", 33.0, 3.0, 3.0)]  # Sramek et al. 2013, Table 2
HEAT_CRUST = (6.8, 1.1, 1.4)                        # Huang et al. 2013, continental crust
HEAT_MEASURED = [("KamLAND 2022", 15.4, 7.9, 8.3), ("Borexino 2020", 38.2, 12.7, 13.6)]  # U+Th, Th/U free for KamLAND


def fig_heat_budget():
    """Radiogenic heat: Bulk Silicate Earth models, continental crust, geoneutrino measurements, total heat flow."""
    plt = style()
    rows = ([(f"BSE {n} (U+Th+K)", v, lo, hi, GOLD) for n, v, lo, hi in HEAT_MODELS]
            + [("continental crust (U+Th+K)", *HEAT_CRUST, GREEN)]
            + [(f"{n}: U+Th measured", v, lo, hi, BLUE) for n, v, lo, hi in HEAT_MEASURED])
    fig, ax = plt.subplots(figsize=(13.0, 5.4))
    y = np.arange(len(rows))[::-1]
    for yi, (name, v, lo, hi, col) in zip(y, rows):
        ax.barh(yi, v, color=col, alpha=0.35, height=0.62)
        ax.errorbar(v, yi, xerr=[[lo], [hi]], fmt="o", color=col, ms=9, capsize=6, lw=2)
        ax.text(-1.0, yi, name, ha="right", va="center", fontsize=FONT - 1)
    t, lo, hi = HEAT_TOTAL
    ax.axvspan(t - lo, t + hi, color=ORANGE, alpha=0.25, lw=0)
    ax.axvline(t, color=ORANGE, lw=2.2)
    ax.text(t - 0.6, y[0] + 0.55, "total surface\nheat flow 47 TW", color=ORANGE, ha="right", va="top", fontsize=FONT - 2)
    ax.set_xlim(0, 56); ax.set_ylim(-0.6, len(rows) - 0.3)
    ax.set_yticks([]); ax.set_xlabel("power  [TW]")
    for sp in ("top", "right", "left"):
        ax.spines[sp].set_visible(False)
    ax.grid(axis="x", color=GRID, lw=0.6, alpha=0.6)
    fig.subplots_adjust(left=0.36, right=0.98, top=0.95, bottom=0.14)
    save(fig, "heat-budget")


# BS05(OP): log10(n_e/N_A) = 2.0125 at the centre; about 5.5e25 cm^-3 where 8B neutrinos are produced (see SOURCES.md).
SOLAR_NE_CENTRE = 10 ** 2.0125 * osc.N_A
SOLAR_NE_B8 = 5.5e25

FIGURES = {"solar-pee": fig_solar_pee, "heat-budget": fig_heat_budget, "beats": fig_beats, "le-map": fig_le_map, "averaging": fig_averaging, "reactor-clocks": fig_reactor_clocks,
           "matter-mixing": fig_matter_mixing, "earth-paths": fig_earth_paths, "oscillogram": fig_oscillogram,
           "core-ye": fig_core_ye, "prem": fig_prem}

if __name__ == "__main__":
    for n in (sys.argv[1:] or FIGURES):
        FIGURES[n]()
