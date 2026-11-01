"""Figures of chapter 11: the state plane of the vacuum and matter crystals.

Both panels use the lecture convention: nu_1 = cos(theta) nu_e - sin(theta) nu_x,
nu_2 = sin(theta) nu_e + cos(theta) nu_x, so the mass axes are turned by -theta
from the flavor axes. theta = 33.7 deg, theta_m = 75.5 deg (centre of the Sun,
E = 10 MeV, A = 2.05).
"""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "chapters" / "06_matter_oscillations"
MPLCONFIG = ROOT / ".quarto" / "refraction-figure-mplconfig"
MPLCONFIG.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

INK = "#18262f"
MUTED = "#687984"
BLUE = "#2f6f9f"
GOLD = "#9a6b17"
RED = "#b4492f"
plt.rcParams.update({
    "font.size": 13,
    "text.color": INK,
    "svg.hashsalt": "neutrinohit-crystal",
    "mathtext.fontset": "stix",
})

THETA = np.radians(33.7)
THETA_M = np.radians(75.5)


def unit(angle: float) -> np.ndarray:
    return np.array([np.cos(angle), np.sin(angle)])


def save(fig: plt.Figure, stem: str) -> None:
    fig.savefig(OUTPUT / f"{stem}.svg", metadata={"Date": None})
    fig.savefig(OUTPUT / f"{stem}.png", dpi=220)
    plt.close(fig)


def frame(ax: plt.Axes) -> None:
    ax.set(xlim=(-1.45, 1.55), ylim=(-1.3, 1.3), aspect="equal")
    ax.axis("off")
    ax.annotate("", xy=(1.4, 0), xytext=(-1.3, 0),
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.annotate("", xy=(0, 1.25), xytext=(0, -1.2),
                arrowprops=dict(arrowstyle="->", color=MUTED, lw=1.2))
    ax.text(1.45, -0.02, r"$\nu_e$", color=MUTED, fontsize=16, va="center")
    ax.text(0.04, 1.28, r"$\nu_x$", color=MUTED, fontsize=16)


def dashed_axis(ax: plt.Axes, angle: float, color: str, label: str,
                label_at: float) -> None:
    v = unit(angle)
    ax.plot([-1.15 * v[0], 1.15 * v[0]], [-1.15 * v[1], 1.15 * v[1]],
            "--", color=color, lw=1.4)
    p = label_at * v
    ax.text(p[0], p[1], label, color=color, fontsize=15,
            ha="center", va="center",
            bbox=dict(facecolor="white", edgecolor="none", pad=1.5))


def arrow(ax: plt.Axes, vec: np.ndarray, color: str, lw: float = 2.6) -> None:
    ax.annotate("", xy=vec, xytext=(0, 0),
                arrowprops=dict(arrowstyle="-|>", color=color, lw=lw,
                                shrinkA=0, shrinkB=0))


def arc(ax: plt.Axes, a0: float, a1: float, radius: float, color: str,
        label: str, label_radius: float, label_angle: float | None = None) -> None:
    t = np.linspace(a0, a1, 80)
    ax.plot(radius * np.cos(t), radius * np.sin(t), color=color, lw=1.6)
    m = 0.5 * (a0 + a1) if label_angle is None else label_angle
    ax.text(label_radius * np.cos(m), label_radius * np.sin(m), label,
            color=color, fontsize=15, ha="center", va="center")


def half_wave() -> None:
    fig, ax = plt.subplots(figsize=(6.6, 5.0), layout="constrained")
    frame(ax)
    dashed_axis(ax, -THETA, BLUE, r"$\nu_1$", 1.22)
    dashed_axis(ax, np.pi / 2 - THETA, GOLD, r"$\nu_2$", 1.22)
    out = unit(-2 * THETA)
    ax.plot([out[0], out[0]], [0, out[1]], ":", color=MUTED, lw=1.2)
    arrow(ax, np.array([1.0, 0.0]), INK)
    arrow(ax, out, RED)
    ax.text(1.02, 0.09, r"вход $\nu_e$", color=INK, fontsize=13)
    ax.text(out[0] + 0.05, out[1] - 0.12, r"выход при $\Delta\varphi=\pi$",
            color=RED, fontsize=13)
    arc(ax, -2 * THETA, 0.0, 0.5, RED, r"$2\theta$", 0.4,
        label_angle=-1.55 * THETA)
    arc(ax, -THETA, 0.0, 0.85, BLUE, r"$\theta$", 0.96)
    ax.text(0.05, -1.22, r"$\psi=\cos2\theta\,\nu_e-\sin2\theta\,\nu_x$,"
            r"  $P_x=\sin^22\theta$", fontsize=13)
    save(fig, "crystal_half_wave")


def matter_axes() -> None:
    fig, ax = plt.subplots(figsize=(6.6, 5.0), layout="constrained")
    frame(ax)
    dashed_axis(ax, -THETA, BLUE, r"$\nu_1$", 1.22)
    dashed_axis(ax, np.pi / 2 - THETA, BLUE, r"$\nu_2$", 1.22)
    dashed_axis(ax, -THETA_M, GOLD, r"$\nu_{\mathrm{mat},1}$", 1.2)
    dashed_axis(ax, np.pi / 2 - THETA_M, GOLD, r"$\nu_{\mathrm{mat},2}$", 1.2)
    arrow(ax, np.array([1.0, 0.0]), INK)
    arc(ax, -THETA, 0.0, 0.5, BLUE, r"$\theta$", 0.62)
    arc(ax, -THETA_M, 0.0, 0.8, GOLD, r"$\theta_m$", 0.92)
    ax.text(-1.4, -1.22,
            r"$\nu_e=\cos\theta_m\,\nu_{\mathrm{mat},1}"
            r"+\sin\theta_m\,\nu_{\mathrm{mat},2}$", fontsize=13)
    save(fig, "crystal_matter_axes")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    half_wave()
    matter_axes()
