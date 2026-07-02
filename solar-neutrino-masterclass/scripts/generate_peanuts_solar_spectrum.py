"""Generate the lecture solar-neutrino energy spectrum from PEANUTS tables.

The output is teacher-side material: students use the generated PNG/CSV and do
not need a local PEANUTS installation.
"""

from __future__ import annotations

import os
import sys
import warnings
from dataclasses import dataclass
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
PEANUTS_ROOT = REPO_ROOT / ".external" / "PEANUTS"
DATA_OUT = ROOT / "data" / "teacher"
STUDENT_OUT = ROOT / "data" / "student"
FIGURES = ROOT / "assets" / "figures"
MPLCONFIG = ROOT / "outputs" / "mplconfig"

FIGURE_PATH = FIGURES / "peanuts_solar_neutrino_spectrum.png"
SPECTRUM_CSV = DATA_OUT / "peanuts_solar_energy_spectrum.csv"
LINE_CSV = DATA_OUT / "peanuts_solar_line_sources.csv"
STUDENT_SPECTRUM_CSV = STUDENT_OUT / "peanuts_solar_energy_spectrum.csv"
STUDENT_LINE_CSV = STUDENT_OUT / "peanuts_solar_line_sources.csv"
STUDENT_ARCHIVE = STUDENT_OUT / "solar_neutrino_student_data.zip"


@dataclass(frozen=True)
class LineSource:
    source: str
    energy_MeV: float
    flux_fraction: float
    label: str
    uncertainty: str


CONTINUOUS_SOURCES = ("pp", "13N", "15O", "17F", "8B", "hep")

LINE_SOURCES = (
    LineSource("7Be", 0.384, 0.103, r"$^7$Be", r"$\pm 7\%$"),
    LineSource("7Be", 0.862, 0.897, r"$^7$Be", r"$\pm 7\%$"),
    LineSource("pep", 1.445, 1.000, "pep", r"$\pm 1.2\%$"),
)

UNCERTAINTY_LABELS = {
    "pp": r"pp [$\pm 0.6\%$]",
    "13N": r"$^{13}$N [$\pm 14\%$]",
    "15O": r"$^{15}$O [$\pm 14\%$]",
    "17F": r"$^{17}$F [$\pm 17\%$]",
    "8B": r"$^8$B [$\pm 14\%$]",
    "hep": r"hep [$\pm 30\%$]",
}


def prepare_environment() -> None:
    if not PEANUTS_ROOT.is_dir():
        raise RuntimeError(
            f"Cannot find PEANUTS at {PEANUTS_ROOT}. "
            "Clone it there or use the already generated PNG/CSV."
        )

    sys.path.insert(0, str(PEANUTS_ROOT))

    # PEANUTS currently imports scipy.integrate.trapz, removed in newer SciPy.
    import scipy.integrate as scipy_integrate

    if not hasattr(scipy_integrate, "trapz"):
        scipy_integrate.trapz = np.trapz

    MPLCONFIG.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG))


def trapz(y: np.ndarray, x: np.ndarray) -> float:
    if hasattr(np, "trapezoid"):
        return float(np.trapezoid(y, x))
    return float(np.trapz(y, x))


def normalized_shape(table: pd.DataFrame) -> pd.DataFrame:
    out = table[["Energy", "Spectrum"]].copy()
    out = out.rename(columns={"Energy": "E_MeV", "Spectrum": "spectrum_per_MeV"})
    out = out.sort_values("E_MeV")
    out = out[out["E_MeV"] > 0.0]
    area = trapz(out["spectrum_per_MeV"].to_numpy(float), out["E_MeV"].to_numpy(float))
    if area <= 0.0:
        raise ValueError("PEANUTS spectrum has non-positive area")
    out["spectrum_per_MeV"] = out["spectrum_per_MeV"] / area
    return out


def build_tables():
    prepare_environment()

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=FutureWarning)
        from peanuts.solar import SolarModel

        solar = SolarModel()

    spectrum_rows = []
    for source in CONTINUOUS_SOURCES:
        table = normalized_shape(solar.spectrum(source))
        flux = float(solar.flux(source))
        table["source"] = source
        table["flux_cm2_s"] = flux
        table["flux_per_MeV_cm2_s"] = flux * table["spectrum_per_MeV"]
        spectrum_rows.append(table[["source", "E_MeV", "spectrum_per_MeV", "flux_cm2_s", "flux_per_MeV_cm2_s"]])

    spectrum = pd.concat(spectrum_rows, ignore_index=True)

    line_rows = []
    for line in LINE_SOURCES:
        total_flux = float(solar.flux(line.source))
        line_rows.append(
            {
                "source": line.source,
                "E_MeV": line.energy_MeV,
                "line_flux_cm2_s": total_flux * line.flux_fraction,
                "total_source_flux_cm2_s": total_flux,
                "flux_fraction": line.flux_fraction,
                "label": line.label,
                "uncertainty": line.uncertainty,
            }
        )
    lines = pd.DataFrame(line_rows)
    return spectrum, lines


def save_tables(spectrum: pd.DataFrame, lines: pd.DataFrame) -> None:
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    STUDENT_OUT.mkdir(parents=True, exist_ok=True)
    spectrum.to_csv(SPECTRUM_CSV, index=False)
    lines.to_csv(LINE_CSV, index=False)
    spectrum.to_csv(STUDENT_SPECTRUM_CSV, index=False)
    lines.to_csv(STUDENT_LINE_CSV, index=False)


def update_student_archive() -> None:
    if not STUDENT_OUT.exists():
        return
    files = sorted([*STUDENT_OUT.glob("*.csv"), STUDENT_OUT / "README.md"])
    if STUDENT_ARCHIVE.exists():
        STUDENT_ARCHIVE.unlink()
    with ZipFile(STUDENT_ARCHIVE, "w", compression=ZIP_DEFLATED) as archive:
        for path in files:
            if path.exists():
                archive.write(path, arcname=path.name)


def plot_spectrum(spectrum: pd.DataFrame, lines: pd.DataFrame) -> None:
    import matplotlib.pyplot as plt

    FIGURES.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(8.7, 5.6))
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    styles = {
        "pp": dict(color="black", lw=2.0, ls="-"),
        "8B": dict(color="black", lw=2.0, ls="-"),
        "hep": dict(color="black", lw=1.8, ls="-"),
        "13N": dict(color="#1f4cff", lw=1.8, ls=":"),
        "15O": dict(color="#1f4cff", lw=1.8, ls=":"),
        "17F": dict(color="#1f4cff", lw=1.8, ls=":"),
    }

    for source in CONTINUOUS_SOURCES:
        table = spectrum[spectrum["source"] == source]
        mask = table["flux_per_MeV_cm2_s"] > 0.0
        ax.plot(
            table.loc[mask, "E_MeV"],
            table.loc[mask, "flux_per_MeV_cm2_s"],
            **styles[source],
        )

    for _, row in lines.iterrows():
        ax.vlines(
            row["E_MeV"],
            2.0e1,
            row["line_flux_cm2_s"],
            color="#1f4cff",
            lw=1.8,
            linestyles=":",
        )

    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xlim(0.1, 20.0)
    ax.set_ylim(2.0e1, 1.5e13)
    ax.set_xlabel("Neutrino Energy [MeV]", fontsize=15)
    ax.set_ylabel(r"Flux [cm$^{-2}$ s$^{-1}$ MeV$^{-1}$]", fontsize=15)
    ax.tick_params(axis="both", which="both", direction="in", top=False, right=False, labelsize=13, length=7)
    ax.tick_params(axis="both", which="minor", length=4)

    for spine in ax.spines.values():
        spine.set_linewidth(1.1)

    # Manual labels keep the plot readable on a lecture slide.
    ax.text(0.29, 2.2e11, UNCERTAINTY_LABELS["pp"], color="black", fontsize=13)
    ax.text(0.116, 1.8e8, UNCERTAINTY_LABELS["13N"], color="#1f4cff", fontsize=12)
    ax.text(0.116, 8.0e6, UNCERTAINTY_LABELS["15O"], color="#1f4cff", fontsize=12)
    ax.text(0.116, 3.2e5, UNCERTAINTY_LABELS["17F"], color="#1f4cff", fontsize=12)
    ax.text(0.70, 1.2e9, r"$^7$Be [$\pm 7\%$]", color="#1f4cff", fontsize=13)
    ax.text(1.35, 1.8e8, r"pep [$\pm 1.2\%$]", color="#1f4cff", fontsize=13)
    ax.text(6.9, 1.0e6, UNCERTAINTY_LABELS["8B"], color="black", fontsize=13)
    ax.text(5.3, 1.1e3, UNCERTAINTY_LABELS["hep"], color="black", fontsize=13)

    ax.text(
        0.103,
        4.0e1,
        "PEANUTS default B16-AGSS09 fluxes; line sources are vertical markers.",
        color="#555555",
        fontsize=9,
        va="bottom",
    )

    fig.tight_layout()
    fig.savefig(FIGURE_PATH, dpi=240, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    spectrum, lines = build_tables()
    save_tables(spectrum, lines)
    update_student_archive()
    plot_spectrum(spectrum, lines)
    print(f"Wrote {SPECTRUM_CSV}")
    print(f"Wrote {LINE_CSV}")
    print(f"Wrote {STUDENT_SPECTRUM_CSV}")
    print(f"Wrote {STUDENT_LINE_CSV}")
    print(f"Wrote {FIGURE_PATH}")


if __name__ == "__main__":
    main()
