from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


HERE = Path(__file__).resolve().parent
DEFAULT_PROFILE = (
    HERE.parents[5]
    / "dvnanima"
    / "solar_photon_diffusion"
    / "data"
    / "solar_model_2010_grey_profile.csv"
)
DEFAULT_OUTPUT = HERE / "photon_mean_free_path.svg"
BCZ_RADIUS_FRACTION = 0.713073966


def load_profile(path: Path) -> tuple[np.ndarray, np.ndarray]:
    table = np.genfromtxt(path, delimiter=",", names=True, dtype=float)
    radius = np.asarray(table["radius_fraction"], dtype=float)
    mean_free_path = 1.0 / (
        np.asarray(table["opacity_cm2_g"], dtype=float)
        * np.asarray(table["density_g_cm3"], dtype=float)
    )
    return radius, mean_free_path


def make_plot(profile_path: Path, output_path: Path) -> None:
    radius, mean_free_path = load_profile(profile_path)
    interior = radius <= 0.99
    radius_plot = np.r_[0.0, radius[interior]]
    path_plot = np.r_[mean_free_path[0], mean_free_path[interior]]

    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "font.size": 12,
            "axes.labelcolor": "#e8f1f8",
            "xtick.color": "#a7bac9",
            "ytick.color": "#a7bac9",
            "text.color": "#e8f1f8",
            "axes.edgecolor": "#7890a2",
        }
    )
    fig, ax = plt.subplots(figsize=(6.8, 3.25))
    fig.patch.set_alpha(0.0)
    ax.set_facecolor("#081522")

    ax.plot(radius_plot, path_plot, color="#43d9ff", linewidth=2.8)
    ax.fill_between(radius_plot, path_plot, 0.003, color="#43d9ff", alpha=0.10)
    ax.axvspan(0.0, 0.2, color="#ffb21c", alpha=0.06)
    ax.axvspan(
        BCZ_RADIUS_FRACTION,
        0.99,
        color="#ff7a18",
        alpha=0.05,
    )
    ax.axvline(
        BCZ_RADIUS_FRACTION,
        color="#ffb21c",
        linewidth=1.4,
        linestyle=(0, (4, 4)),
    )

    central = mean_free_path[0]
    bcz = np.interp(BCZ_RADIUS_FRACTION, radius, mean_free_path)
    ax.scatter(
        [0.012, BCZ_RADIUS_FRACTION],
        [central, bcz],
        s=34,
        color=["#fff1a8", "#ffb21c"],
        zorder=4,
    )
    ax.annotate(
        r"центр: $0{,}051$ мм",
        xy=(0.012, central),
        xytext=(0.10, 0.0035),
        color="#fff1a8",
        arrowprops={"arrowstyle": "-", "color": "#fff1a8", "lw": 1.0},
    )
    ax.annotate(
        r"$r_{\rm cz}=0{,}713R_\odot$: $2{,}53$ мм",
        xy=(BCZ_RADIUS_FRACTION, bcz),
        xytext=(0.42, 0.39),
        color="#ffcc66",
        arrowprops={"arrowstyle": "-", "color": "#ffcc66", "lw": 1.0},
    )

    ax.set_yscale("log")
    ax.set_xlim(0.0, 0.99)
    ax.set_ylim(0.0025, 1.0)
    ax.set_xticks([0.0, 0.2, 0.4, 0.6, BCZ_RADIUS_FRACTION, 0.8, 0.99])
    ax.set_xticklabels(["0", "0,2", "0,4", "0,6", "0,713", "0,8", "0,99"])
    ax.set_xlabel(r"радиус $r/R_\odot$")
    ax.set_ylabel(r"шаг диффузии $\ell=1/(\kappa_R\rho)$, см")
    ax.grid(which="major", color="#7890a2", alpha=0.16, linewidth=0.8)
    ax.grid(which="minor", color="#7890a2", alpha=0.08, linewidth=0.6)
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    fig.tight_layout(pad=0.7)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, transparent=True, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Plot the photon transport mean free path for lecture 13."
    )
    parser.add_argument("--profile", type=Path, default=DEFAULT_PROFILE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    make_plot(args.profile.resolve(), args.output.resolve())
    print(f"Wrote {args.output.resolve()}")


if __name__ == "__main__":
    main()
