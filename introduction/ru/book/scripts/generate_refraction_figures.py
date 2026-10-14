"""Generate the static counterparts and QR codes of the lecture 11 applets.

The layer neglects boundary reflection. The two-mode model takes its angle
and phase difference as independent inputs, as in refraction_labs.js.
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
import qrcode

INK = "#18262f"
MUTED = "#687984"
BLUE = "#2f6f9f"
GOLD = "#9a6b17"
plt.rcParams.update({
    "font.size": 13,
    "text.color": INK,
    "axes.labelcolor": INK,
    "xtick.color": INK,
    "ytick.color": INK,
    "svg.hashsalt": "neutrinohit-refraction",
})


def save(fig: plt.Figure, stem: str) -> None:
    fig.savefig(OUTPUT / f"{stem}.svg", metadata={"Date": None})
    fig.savefig(OUTPUT / f"{stem}.png", dpi=220)
    plt.close(fig)


def layers() -> None:
    n, length = 1.08, 1.5
    z = np.linspace(-0.7, length + 0.7, 1200)
    phi_vac = 2 * np.pi * z
    phi_med = phi_vac + 2 * np.pi * (n - 1) * np.clip(z, 0, length)
    fig, ax = plt.subplots(figsize=(7.4, 3.3), layout="constrained")
    ax.axvspan(0, length, color="#eaf2ed", zorder=0)
    ax.axhline(0, color="#bcc9ce", linewidth=0.8)
    ax.plot(z, np.sin(phi_vac), "--", color=MUTED, linewidth=1.7,
            label="без слоя")
    ax.plot(z, np.sin(phi_med), color=BLUE, linewidth=2.2, label="со слоем")
    for boundary in (0, length):
        ax.axvline(boundary, color=MUTED, linewidth=0.8)
    ax.set(xlim=(z[0], z[-1]), ylim=(-1.55, 1.6),
           xlabel=r"Координата $z/\lambda_0$", ylabel="Поле, усл. ед.")
    ax.text(length / 2, 1.2, "вещество", ha="center")
    ax.text(-0.37, 1.2, "вакуум", ha="center")
    ax.text(length + 0.37, 1.2, "вакуум", ha="center")
    ax.set_title(r"$n=1.08,\quad D/\lambda_0=1.5,\quad"
                 r"\Delta\varphi=0.754$ рад", fontsize=14)
    ax.legend(loc="lower left", ncols=2, frameon=False, fontsize=12)
    ax.set_yticks([-1, 0, 1])
    ax.spines[["top", "right"]].set_visible(False)
    save(fig, "refraction_layers")


def two_modes() -> None:
    theta, phase = np.pi / 6, np.pi
    phi = np.linspace(0, 2 * np.pi, 500)
    probability = np.sin(2 * theta) ** 2 * np.sin(phi / 2) ** 2
    fig, (phasors, curve) = plt.subplots(
        1, 2, figsize=(7.4, 3.3), layout="constrained",
        gridspec_kw={"width_ratios": [1, 1.4]},
    )
    phasors.plot(np.cos(phi), np.sin(phi), color="#bcc9ce", linewidth=1)
    phasors.axhline(0, color="#bcc9ce", linewidth=0.8)
    phasors.axvline(0, color="#bcc9ce", linewidth=0.8)
    for angle, color, label in ((0, BLUE, "1"), (phase, GOLD, "2")):
        tip = (np.cos(angle), np.sin(angle))
        phasors.annotate("", xy=tip, xytext=(0, 0),
                         arrowprops={"arrowstyle": "->", "color": color, "lw": 2.6})
        phasors.text(tip[0] * 1.18, tip[1] - 0.12, label,
                     color=color, ha="center")
    phasors.set(xlim=(-1.4, 1.4), ylim=(-1.25, 1.25), aspect="equal")
    phasors.set_title("Фазы нормальных волн", fontsize=13)
    phasors.set_axis_off()
    curve.plot(phi, probability, color=BLUE, linewidth=2.4)
    curve.plot(phase, 0.75, "o", color=GOLD, markersize=7)
    curve.set(xlim=(0, 2 * np.pi), ylim=(0, 1.05),
              xlabel=r"Разность фаз $\Delta\varphi$", ylabel=r"$P_{e\to x}$")
    curve.set_xticks([0, np.pi, 2 * np.pi], ["0", r"$\pi$", r"$2\pi$"])
    curve.set_yticks([0, 0.5, 1])
    curve.grid(color="#d9e0e3", linewidth=0.7)
    curve.spines[["top", "right"]].set_visible(False)
    fig.suptitle(r"$\theta_m=30^\circ,\quad\Delta\varphi=\pi,"
                 r"\quad P_{e\to x}=0.75$", fontsize=14)
    save(fig, "refraction_two_modes")


def qr_codes() -> None:
    qr_dir = OUTPUT / "qr"
    qr_dir.mkdir(parents=True, exist_ok=True)
    for stem, page in (("refraction_layers", "refraction-layers"),
                       ("refraction_two_modes", "refraction-two-modes")):
        url = ("https://neutrinohit.github.io/neutrinophysics/"
               f"introduction/ru/applets/{page}.html")
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=8, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        qr.make_image(fill_color="black", back_color="white").save(
            qr_dir / f"{stem}.png"
        )


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    layers()
    two_modes()
    qr_codes()
