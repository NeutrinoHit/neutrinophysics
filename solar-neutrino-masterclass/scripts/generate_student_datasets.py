"""Generate student-facing CSV datasets for the solar-neutrino masterclass.

The tables are deliberately lightweight. They define the same columns that
teacher-generated PEANUTS/SSM tables should provide, so student notebooks do
not depend on installing PEANUTS.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "student"
ARCHIVE_NAME = "solar_neutrino_student_data.zip"
OBSOLETE_OUTPUTS = (
    "borexino_like_event_predictions.csv",
    "detector_models.csv",
    "pseudo_data_borexino.csv",
    "sk_like_event_predictions.csv",
)

ME_MEV = 0.51099895
GF_GEV = 1.1663787e-5
GEV2_TO_CM2 = 0.3893793721e-27
SIN2_THETA_W = 0.2312
SECONDS_PER_YEAR = 365.25 * 24 * 3600
ELECTRONS_PER_KTON_WATER = (1.0e9 / 18.01528) * 6.02214076e23 * 10.0

SIN2_THETA12 = 0.307
SIN2_THETA13 = 0.0224
DM21 = 7.42e-5
NE_CORE_CM3 = 6.0e25
G_F_EV = GF_GEV * 1.0e-18
CM_TO_EV_INV = 5.067730652e4
CM3_TO_EV3 = 1.0 / CM_TO_EV_INV**3


@dataclass(frozen=True)
class Source:
    name: str
    flux_cm2_s: float
    kind: str
    endpoint_MeV: float | None
    line_energies_MeV: tuple[float, ...]
    line_weights: tuple[float, ...]
    radial_scale: float
    radial_power: float
    group: str
    comment: str


SOURCES = (
    Source("pp", 5.98e10, "continuum", 0.420, (), (), 0.18, 2.0, "pp-chain", "dominant low-energy flux"),
    Source("pep", 1.44e8, "line", None, (1.44,), (1.0,), 0.12, 2.0, "pp-chain", "monoenergetic line"),
    Source("hep", 7.98e3, "continuum", 18.8, (), (), 0.055, 2.0, "pp-chain", "rare high-energy tail"),
    Source("Be7", 4.93e9, "line", None, (0.384, 0.862), (0.103, 0.897), 0.09, 2.0, "pp-chain", "electron-capture lines"),
    Source("B8", 5.46e6, "continuum", 16.0, (), (), 0.045, 2.0, "pp-chain", "high-energy branch"),
    Source("N13", 2.78e8, "continuum", 1.199, (), (), 0.16, 2.0, "CNO", "CNO beta spectrum"),
    Source("O15", 2.05e8, "continuum", 1.732, (), (), 0.12, 2.0, "CNO", "CNO beta spectrum"),
    Source("F17", 5.29e6, "continuum", 1.740, (), (), 0.10, 2.0, "CNO", "CNO beta spectrum"),
)


def trapz(y: np.ndarray, x: np.ndarray) -> float:
    if hasattr(np, "trapezoid"):
        return float(np.trapezoid(y, x))
    return float(np.trapz(y, x))


def normalize(y: np.ndarray, x: np.ndarray) -> np.ndarray:
    area = trapz(y, x)
    if area <= 0.0:
        raise ValueError("non-positive normalization")
    return y / area


def beta_like_spectrum(E: np.ndarray, endpoint: float) -> np.ndarray:
    y = np.where((E > 0.0) & (E < endpoint), E**2 * (endpoint - E) ** 2, 0.0)
    return normalize(y, E)


def line_spectrum(E: np.ndarray, energies: tuple[float, ...], weights: tuple[float, ...]) -> np.ndarray:
    sigma = 0.012
    y = np.zeros_like(E)
    for energy, weight in zip(energies, weights, strict=True):
        y += weight * np.exp(-0.5 * ((E - energy) / sigma) ** 2) / (sigma * np.sqrt(2.0 * np.pi))
    return normalize(y, E)


def radial_density(r: np.ndarray, source: Source) -> np.ndarray:
    return np.exp(-((r / source.radial_scale) ** source.radial_power))


def matter_potential_eV(ne_cm3: np.ndarray | float) -> np.ndarray:
    return np.sqrt(2.0) * G_F_EV * np.asarray(ne_cm3, dtype=float) * CM3_TO_EV3


def theta_matter(E_MeV: np.ndarray, ne_cm3: float) -> np.ndarray:
    theta12 = np.arcsin(np.sqrt(SIN2_THETA12))
    E_eV = E_MeV * 1.0e6
    A = 2.0 * E_eV * matter_potential_eV(ne_cm3) / DM21
    num = np.sin(2.0 * theta12)
    den = np.cos(2.0 * theta12) - A
    return 0.5 * np.arctan2(num, den)


def pee_day(E_MeV: np.ndarray) -> np.ndarray:
    theta12 = np.arcsin(np.sqrt(SIN2_THETA12))
    c13 = np.sqrt(1.0 - SIN2_THETA13)
    s13 = np.sqrt(SIN2_THETA13)
    theta_m = theta_matter(E_MeV, NE_CORE_CM3)
    pee2 = 0.5 + 0.5 * np.cos(2.0 * theta12) * np.cos(2.0 * theta_m)
    return np.clip(c13**4 * pee2 + s13**4, 0.0, 1.0)


def pee_vacuum(E_MeV: np.ndarray) -> np.ndarray:
    theta12 = np.arcsin(np.sqrt(SIN2_THETA12))
    c13 = np.sqrt(1.0 - SIN2_THETA13)
    s13 = np.sqrt(SIN2_THETA13)
    value = c13**4 * (1.0 - 0.5 * np.sin(2.0 * theta12) ** 2) + s13**4
    return np.full_like(E_MeV, value)


def earth_delta(E_MeV: np.ndarray) -> np.ndarray:
    turn_on = 1.0 - np.exp(-E_MeV / 3.5)
    shape = np.exp(-0.5 * ((E_MeV - 8.0) / 4.2) ** 2)
    return 0.012 * turn_on * shape


def tmax_MeV(E_MeV: np.ndarray) -> np.ndarray:
    return 2.0 * E_MeV**2 / (ME_MEV + 2.0 * E_MeV)


def dsigma_dT(E_MeV: np.ndarray, T_MeV: np.ndarray | float, flavor: str) -> np.ndarray:
    E = np.asarray(E_MeV, dtype=float)
    T = np.asarray(T_MeV, dtype=float)
    valid = (T >= 0.0) & (T <= tmax_MeV(E))

    if flavor == "e":
        g_l = 0.5 + SIN2_THETA_W
    elif flavor == "x":
        g_l = -0.5 + SIN2_THETA_W
    else:
        raise ValueError(f"unknown flavor: {flavor}")
    g_r = SIN2_THETA_W

    E_GeV = E / 1000.0
    T_GeV = T / 1000.0
    me_GeV = ME_MEV / 1000.0
    bracket = (
        g_l**2
        + g_r**2 * (1.0 - T_GeV / E_GeV) ** 2
        - g_l * g_r * me_GeV * T_GeV / E_GeV**2
    )
    prefactor = 2.0 * GF_GEV**2 * me_GeV / np.pi
    value = prefactor * bracket * GEV2_TO_CM2 * 1.0e-3
    return np.where(valid, np.clip(value, 0.0, None), 0.0)


def efficiency(T_MeV: np.ndarray | float, threshold: float, width: float) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-(np.asarray(T_MeV, dtype=float) - threshold) / width))


def source_spectra(E: np.ndarray) -> dict[str, np.ndarray]:
    spectra = {}
    for source in SOURCES:
        if source.kind == "continuum":
            spectra[source.name] = beta_like_spectrum(E, source.endpoint_MeV or 0.0)
        else:
            spectra[source.name] = line_spectrum(E, source.line_energies_MeV, source.line_weights)
    return spectra


def expected_counts(
    E: np.ndarray,
    spectra: dict[str, np.ndarray],
    bins: np.ndarray,
    exposure_electron_s: float,
    threshold: float,
    width: float,
    pee: np.ndarray,
) -> pd.DataFrame:
    rows = []
    centers = 0.5 * (bins[:-1] + bins[1:])
    widths = np.diff(bins)
    for source in SOURCES:
        flux = source.flux_cm2_s
        shape = spectra[source.name]
        for low, high, center, bin_width in zip(bins[:-1], bins[1:], centers, widths, strict=True):
            ds_e = dsigma_dT(E, center, "e")
            ds_x = dsigma_dT(E, center, "x")
            kernel_no = shape * ds_e
            kernel_osc = shape * (pee * ds_e + (1.0 - pee) * ds_x)
            rate_no = flux * trapz(kernel_no, E)
            rate_osc = flux * trapz(kernel_osc, E)
            count_no = exposure_electron_s * rate_no * efficiency(center, threshold, width) * bin_width
            count_day = exposure_electron_s * rate_osc * efficiency(center, threshold, width) * bin_width
            rows.append(
                {
                    "source": source.name,
                    "T_low_MeV": low,
                    "T_high_MeV": high,
                    "T_center_MeV": center,
                    "events_no_osc": count_no,
                    "events_day": count_day,
                }
            )
    return pd.DataFrame(rows)


def add_night_counts(prediction: pd.DataFrame, E: np.ndarray, spectra: dict[str, np.ndarray], bins: np.ndarray, exposure: float, threshold: float, width: float, pee_night: np.ndarray) -> pd.DataFrame:
    night = expected_counts(E, spectra, bins, exposure, threshold, width, pee_night)
    key = ["source", "T_low_MeV", "T_high_MeV", "T_center_MeV"]
    merged = prediction.merge(night[key + ["events_day"]], on=key, suffixes=("", "_night"))
    return merged.rename(columns={"events_day_night": "events_night"})


def write_fluxes() -> None:
    rows = [
        {
            "source": source.name,
            "flux_cm2_s": source.flux_cm2_s,
            "kind": source.kind,
            "endpoint_MeV": source.endpoint_MeV,
            "line_energies_MeV": ";".join(str(x) for x in source.line_energies_MeV),
            "line_weights": ";".join(str(x) for x in source.line_weights),
            "group": source.group,
            "comment": source.comment,
        }
        for source in SOURCES
    ]
    pd.DataFrame(rows).to_csv(OUT / "solar_fluxes.csv", index=False)


def write_radial_profiles() -> None:
    r = np.linspace(0.0, 1.0, 501)
    rows = []
    for source in SOURCES:
        q = radial_density(r, source)
        shell = r**2 * q
        shell_norm = normalize(shell, r)
        cumulative = np.concatenate([[0.0], np.cumsum(0.5 * (shell_norm[1:] + shell_norm[:-1]) * np.diff(r))])
        for rv, qv, sv, cv in zip(r, q / q.max(), shell_norm, cumulative, strict=True):
            rows.append(
                {
                    "source": source.name,
                    "r_over_Rsun": rv,
                    "production_density_norm": qv,
                    "shell_fraction_per_Rsun": sv,
                    "cumulative_fraction": cv,
                }
            )
    pd.DataFrame(rows).to_csv(OUT / "radial_production_profiles.csv", index=False)


def write_spectra(E: np.ndarray, spectra: dict[str, np.ndarray]) -> None:
    rows = []
    for source in SOURCES:
        for energy, value in zip(E, spectra[source.name], strict=True):
            rows.append(
                {
                    "source": source.name,
                    "E_MeV": energy,
                    "spectrum_per_MeV": value,
                    "kind": source.kind,
                }
            )
    pd.DataFrame(rows).to_csv(OUT / "energy_spectra.csv", index=False)


def write_density() -> None:
    r = np.linspace(0.0, 1.0, 501)
    ne = NE_CORE_CM3 * (0.92 * np.exp(-r / 0.095) + 0.08 * np.exp(-r / 0.35))
    pd.DataFrame({"r_over_Rsun": r, "ne_cm3": ne, "ne_over_ne0": ne / ne[0]}).to_csv(
        OUT / "solar_electron_density.csv", index=False
    )


def write_probabilities(E_prob: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    vac = pee_vacuum(E_prob)
    day = pee_day(E_prob)
    delta = earth_delta(E_prob)
    night = np.clip(day + delta, 0.0, 1.0)
    pd.DataFrame(
        {
            "E_MeV": E_prob,
            "Pee_vacuum": vac,
            "Pee_day": day,
            "Pee_night_reference": night,
            "delta_Pee_earth_reference": night - day,
            "sin2theta12_reference": SIN2_THETA12,
            "dm21_eV2_reference": DM21,
        }
    ).to_csv(OUT / "oscillation_probabilities.csv", index=False)

    rows = []
    for label, scale, weight in (("shallow", 0.45, 0.45), ("mantle", 1.0, 0.45), ("core", 1.35, 0.10)):
        for energy, day_value, delta_value in zip(E_prob, day, delta, strict=True):
            rows.append(
                {
                    "nadir_bin": label,
                    "exposure_weight": weight,
                    "E_MeV": energy,
                    "Pee_day": day_value,
                    "delta_Pee_earth": scale * delta_value,
                    "Pee_night": np.clip(day_value + scale * delta_value, 0.0, 1.0),
                }
            )
    pd.DataFrame(rows).to_csv(OUT / "earth_regeneration.csv", index=False)
    return day, night


def write_cross_sections(E_cs: np.ndarray, T_cs: np.ndarray) -> None:
    rows = []
    for energy in E_cs:
        for recoil in T_cs:
            rows.append(
                {
                    "E_MeV": energy,
                    "T_e_MeV": recoil,
                    "T_max_MeV": tmax_MeV(np.array([energy]))[0],
                    "dsigma_nue_cm2_per_MeV": dsigma_dT(np.array([energy]), recoil, "e")[0],
                    "dsigma_nux_cm2_per_MeV": dsigma_dT(np.array([energy]), recoil, "x")[0],
                }
            )
    pd.DataFrame(rows).to_csv(OUT / "nu_electron_recoil_cross_sections.csv", index=False)

    Ue1 = (1.0 - SIN2_THETA12) * (1.0 - SIN2_THETA13)
    Ue2 = SIN2_THETA12 * (1.0 - SIN2_THETA13)
    Ue3 = SIN2_THETA13
    totals = []
    T_int = np.linspace(0.0, 18.8, 600)
    for energy in E_cs:
        sigma_e = trapz(dsigma_dT(np.array([energy] * T_int.size), T_int, "e"), T_int)
        sigma_x = trapz(dsigma_dT(np.array([energy] * T_int.size), T_int, "x"), T_int)
        totals.append(
            {
                "E_MeV": energy,
                "sigma_nue_cm2": sigma_e,
                "sigma_nux_cm2": sigma_x,
                "sigma_mass_1_cm2": Ue1 * sigma_e + (1.0 - Ue1) * sigma_x,
                "sigma_mass_2_cm2": Ue2 * sigma_e + (1.0 - Ue2) * sigma_x,
                "sigma_mass_3_cm2": Ue3 * sigma_e + (1.0 - Ue3) * sigma_x,
                "Ue1_abs2": Ue1,
                "Ue2_abs2": Ue2,
                "Ue3_abs2": Ue3,
            }
        )
    pd.DataFrame(totals).to_csv(OUT / "mass_state_cross_sections.csv", index=False)


def write_detector_response() -> None:
    T = np.linspace(0.0, 18.0, 361)
    pd.DataFrame(
        {
            "T_e_MeV": T,
            "epsilon_sk_like": efficiency(T, 4.5, 0.35),
            "background_sk_shape": np.exp(-np.clip(T - 3.0, 0.0, None) / 3.0),
        }
    ).to_csv(OUT / "detector_response.csv", index=False)


def write_predictions(E: np.ndarray, spectra: dict[str, np.ndarray], day: np.ndarray, night: np.ndarray) -> None:
    sk_bins = np.arange(3.0, 16.5, 0.5)

    sk_exposure = ELECTRONS_PER_KTON_WATER * 100.0 * SECONDS_PER_YEAR

    sk = expected_counts(E, spectra, sk_bins, sk_exposure, 4.5, 0.35, day)
    sk = add_night_counts(sk, E, spectra, sk_bins, sk_exposure, 4.5, 0.35, night)

    rng = np.random.default_rng(20260628)
    sk_total = sk.groupby(["T_low_MeV", "T_high_MeV", "T_center_MeV"], as_index=False)[["events_day", "events_night"]].sum()
    sk_total["background_day"] = 3.0 * np.exp(-np.clip(sk_total["T_center_MeV"] - 3.0, 0.0, None) / 3.0)
    sk_total["background_night"] = sk_total["background_day"]
    sk_total["expected_day"] = 0.5 * sk_total["events_day"] + sk_total["background_day"]
    sk_total["expected_night"] = 0.5 * sk_total["events_night"] + sk_total["background_night"]
    sk_total["observed_day"] = rng.poisson(sk_total["expected_day"])
    sk_total["observed_night"] = rng.poisson(sk_total["expected_night"])
    sk_total["seed"] = 20260628
    sk_total.to_csv(OUT / "pseudo_data_sk_daynight.csv", index=False)


def write_readme() -> None:
    (OUT / "README.md").write_text(
        """# Student datasets

These CSV files are the public inputs for the integrated SK-like project.

They are generated by `scripts/generate_student_datasets.py`. The present
numbers are pedagogical reference values with realistic scales. PEANUTS or
chosen SSM outputs can replace the same files if they provide the same columns.

Core tables:

- `solar_fluxes.csv`: total fluxes by source.
- `radial_production_profiles.csv`: production density and shell contribution.
- `energy_spectra.csv`: normalized spectra and line shapes.
- `peanuts_solar_energy_spectrum.csv`: PEANUTS continuum spectra multiplied by source flux, if generated.
- `peanuts_solar_line_sources.csv`: PEANUTS line-source markers, if generated.
- `solar_electron_density.csv`: electron density profile for MSW checks.
- `oscillation_probabilities.csv`: vacuum, day, and reference night Pee.
- `earth_regeneration.csv`: nadir-bin Earth regeneration toy/reference table.
- `nu_electron_recoil_cross_sections.csv`: differential recoil cross sections.
- `mass_state_cross_sections.csv`: total cross sections for mass states.
- `detector_response.csv`: SK-like efficiency table.
- `pseudo_data_sk_daynight.csv`: reproducible day/night pseudo-data.

Archive:

- `solar_neutrino_student_data.zip`: public input CSV files and this README in one download.
""",
        encoding="utf-8",
    )


def write_archive() -> None:
    archive_path = OUT / ARCHIVE_NAME
    if archive_path.exists():
        archive_path.unlink()
    excluded = {"detector_models.csv", "sk_like_event_predictions.csv"}
    files = sorted([path for path in OUT.glob("*.csv") if path.name not in excluded])
    files.append(OUT / "README.md")
    with ZipFile(archive_path, "w", compression=ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, arcname=path.name)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in OBSOLETE_OUTPUTS:
        path = OUT / name
        if path.exists():
            path.unlink()

    E = np.linspace(0.02, 18.8, 940)
    E_prob = np.linspace(0.05, 18.8, 376)
    E_cs = np.linspace(0.05, 18.8, 188)
    T_cs = np.linspace(0.0, 18.0, 181)

    spectra = source_spectra(E)
    day_prob = np.interp(E, E_prob, pee_day(E_prob))
    night_prob = np.interp(E, E_prob, np.clip(pee_day(E_prob) + earth_delta(E_prob), 0.0, 1.0))

    write_fluxes()
    write_radial_profiles()
    write_spectra(E, spectra)
    write_density()
    write_probabilities(E_prob)
    write_cross_sections(E_cs, T_cs)
    write_detector_response()
    write_predictions(E, spectra, day_prob, night_prob)
    write_readme()
    write_archive()
    print(f"Wrote student datasets to {OUT}")


if __name__ == "__main__":
    main()
