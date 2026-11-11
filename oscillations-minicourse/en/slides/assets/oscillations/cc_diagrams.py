"""Charged-current forward scattering of a neutrino on an electron, in the flavor and in the mass basis.

Flavor basis: nu_e + e- -> e- + nu_e through W exchange; only nu_e has it (ordinary matter holds no mu or tau).
Mass basis: the same diagram with nu_e = sum_i U_ei nu_i on the external lines; the incoming nu_i brings U_ei,
the outgoing nu_j brings U*_ej, so the amplitude nu_i -> nu_j is proportional to U_ei U*_ej and is not zero
for i != j: in the mass basis matter is an off-diagonal matrix.

Run:  python cc_diagrams.py
Output: ../../media/figures/cc-flavor.svg, cc-mass.svg (and .png)
"""
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "media" / "figures"
BG, FG, MUTED = "#000000", "#eef3f7", "#a9b6c2"
NU, LEP, W, GOLD = "#73c7ff", "#ff9d85", "#c3a6ff", "#ffd166"


def main():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"mathtext.fontset": "stix", "font.family": "sans-serif", "svg.fonttype": "path",
                         "figure.facecolor": BG, "savefig.facecolor": BG, "text.color": FG})
    OUT.mkdir(parents=True, exist_ok=True)
    for mass in (False, True):
        fig = plt.figure(figsize=(5.2, 5.0))
        ax = fig.add_axes([0, 0, 1, 1])
        ax.set(xlim=(0, 8), ylim=(0, 7.7), aspect="equal")
        ax.axis("off")
        up, lo = np.array([4, 4.9]), np.array([4, 2.5])

        def line(a, b, color):
            a, b = np.array(a), np.array(b)
            ax.plot(*np.array([a, b]).T, color=color, lw=3.0)
            ax.annotate("", b - 0.38 * (b - a), a + 0.42 * (b - a),
                        arrowprops=dict(arrowstyle="-|>", color=color, lw=2.6, mutation_scale=20, shrinkA=0, shrinkB=0))

        line((1, 6.1), up, NU)
        line(up, (7, 6.1), LEP)
        line((1, 1.3), lo, LEP)
        line(lo, (7, 1.3), NU)
        t = np.linspace(0, 1, 400)
        ax.plot(4 + 0.11 * np.sin(2 * np.pi * 6 * t), up[1] - (up[1] - lo[1]) * t, color=W, lw=2.6)
        ax.scatter([4, 4], [up[1], lo[1]], color=FG, s=30, zorder=4)
        ax.text(4.35, 3.7, r"$W^+$", fontsize=26, color=W, va="center")
        nu_in, nu_out = (r"$\nu_i$", r"$\nu_j$") if mass else (r"$\nu_e$", r"$\nu_e$")
        for x, y, s, c in [(1, 6.55, nu_in, NU), (7, 6.55, r"$e^-$", LEP), (1, 0.85, r"$e^-$", LEP), (7, 0.85, nu_out, NU)]:
            ax.text(x, y, s, color=c, fontsize=28, ha="center", va="center")
        if mass:
            ax.text(3.15, 5.85, r"$U_{ei}$", color=GOLD, fontsize=24, ha="center", va="center")
            ax.text(3.25, 1.5, r"$U^{*}_{ej}$", color=GOLD, fontsize=24, ha="center", va="center")
        ax.text(4, 7.55, "mass basis" if mass else "flavor basis", color=MUTED, fontsize=20, ha="center", va="top")
        ax.text(4, 0.05, r"$\nu_i\,e^-\to\nu_j\,e^-\ \propto\ U_{ei}\,U^{*}_{ej}$" if mass
                else r"$\nu_e\,e^-\to\nu_e\,e^-$", fontsize=22, ha="center", va="bottom")
        name = "cc-mass" if mass else "cc-flavor"
        for ext in ("svg", "png"):
            fig.savefig(OUT / f"{name}.{ext}", dpi=150)
        plt.close(fig)
        print("wrote", OUT / f"{name}.svg")


if __name__ == "__main__":
    main()
