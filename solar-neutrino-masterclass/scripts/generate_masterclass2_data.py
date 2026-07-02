"""Generate PEANUTS-based tables and checks for masterclass 2."""

from __future__ import annotations

import os
import json
import shutil
import subprocess
import sys
import warnings
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
PEANUTS_ROOT = REPO_ROOT / ".external" / "PEANUTS"
MC1_DATA = ROOT / "data" / "masterclass1"
OUT = ROOT / "data" / "masterclass2"
TEACHER_OUT = ROOT / "data" / "teacher"
PROJECT_OUT = ROOT / "data" / "project"
FIGURES = ROOT / "assets" / "figures"
MPLCONFIG = ROOT / "outputs" / "mplconfig"
ARCHIVE = OUT / "masterclass2_data.zip"
PROJECT_ARCHIVE = PROJECT_OUT / "solar_neutrino_project_data.zip"
BLIND_CONFIG = TEACHER_OUT / "masterclass2_blind_config.json"
BLIND_TRUTH = TEACHER_OUT / "masterclass2_blind_truth.json"
BLIND_EXPECTED = TEACHER_OUT / "masterclass2_blind_expected_teacher.csv"

SOURCE = "8B"
SOURCE_TABLE_NAME = "B8"

THETA13 = 1.49575e-1
THETA23 = 8.5521e-1
DELTA_CP = 3.40339
DM3L_EV2 = 2.51e-3

SIN2_THETA12_REF = 0.308
DM21_REF_EV2 = 7.42e-5

SIN2_GRID = np.unique(np.round(np.r_[np.linspace(0.24, 0.38, 29), SIN2_THETA12_REF], 5))
DM21_GRID_EV2 = np.unique(np.round(np.r_[np.linspace(5.0e-5, 10.0e-5, 41), DM21_REF_EV2], 10))
ETA_GRID_RAD = np.round(np.linspace(0.15, 1.45, 8), 5)
EARTH_SCAN_ENERGIES_MEV = np.array([5.0, 7.0, 10.0, 12.0, 14.0])
EARTH_SCAN_ETAS_RAD = np.array([0.25, 0.80, 1.25])
DETECTOR_DEPTH_M = 3000.0

N_A = 6.02214076e23
SECONDS_PER_YEAR = 365.25 * 24 * 3600
WATER_MASS_G = 100.0e9
T_LIVE_S = SECONDS_PER_YEAR
N_E = 10.0 * N_A * WATER_MASS_G / 18.0
T_MIN = 4.5
T_MAX = 14.0
BIN_WIDTH = 0.5

COLORS = {
    "blue": "#8ec5ff",
    "orange": "#ffcc8a",
    "green": "#8fd19e",
    "gray": "#d0d0d0",
    "purple": "#d6b0ff",
}


def prepare_environment() -> None:
    if not PEANUTS_ROOT.is_dir():
        raise RuntimeError(f"Cannot find PEANUTS at {PEANUTS_ROOT}")
    if str(PEANUTS_ROOT) not in sys.path:
        sys.path.insert(0, str(PEANUTS_ROOT))

    import scipy.integrate as scipy_integrate

    if not hasattr(scipy_integrate, "trapz"):
        scipy_integrate.trapz = np.trapz

    MPLCONFIG.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG))


def peanuts_commit() -> str:
    try:
        return subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=PEANUTS_ROOT,
            text=True,
            capture_output=True,
            check=True,
        ).stdout.strip()
    except Exception:
        return "unknown"


def load_peanuts():
    prepare_environment()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=FutureWarning)
        from peanuts.earth import EarthDensity, Pearth
        from peanuts.pmns import PMNS
        from peanuts.solar import SolarModel, Psolar, solar_flux_mass

        solar = SolarModel()
        earth = EarthDensity()
    return PMNS, Psolar, solar_flux_mass, EarthDensity, Pearth, solar, earth


def trapz(y: np.ndarray, x: np.ndarray) -> float:
    if hasattr(np, "trapezoid"):
        return float(np.trapezoid(y, x))
    return float(np.trapz(y, x))


def copy_base_tables() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in [
        "solar_fluxes.csv",
        "energy_spectra.csv",
        "nu_electron_recoil_cross_sections.csv",
    ]:
        shutil.copy2(MC1_DATA / name, OUT / name)


def energy_grid_from_cross_sections() -> np.ndarray:
    xs = pd.read_csv(MC1_DATA / "nu_electron_recoil_cross_sections.csv", usecols=["E_MeV"])
    return np.sort(xs["E_MeV"].unique())


def build_oscillation_grid() -> pd.DataFrame:
    PMNS, Psolar, solar_flux_mass, _, _, solar, _ = load_peanuts()
    energy_grid = energy_grid_from_cross_sections()
    radius = solar.radius()
    density = solar.density()
    fraction = solar.fraction(SOURCE)

    rows = []
    for sin2theta12 in SIN2_GRID:
        theta12 = float(np.arcsin(np.sqrt(sin2theta12)))
        pmns = PMNS(theta12, THETA13, THETA23, DELTA_CP)
        for dm21 in DM21_GRID_EV2:
            for energy in energy_grid:
                probs = Psolar(pmns, float(dm21), DM3L_EV2, float(energy), radius, density, fraction)
                weights = solar_flux_mass(
                    pmns.theta12,
                    pmns.theta13,
                    float(dm21),
                    DM3L_EV2,
                    float(energy),
                    radius,
                    density,
                    fraction,
                )
                rows.append(
                    {
                        "source": SOURCE_TABLE_NAME,
                        "E_MeV": float(energy),
                        "sin2theta12": float(sin2theta12),
                        "dm21_eV2": float(dm21),
                        "dm21_1e5_eV2": float(dm21 / 1.0e-5),
                        "Pee_day": float(probs[0]),
                        "Pemu_day": float(probs[1]),
                        "Petau_day": float(probs[2]),
                        "w_nu1": float(weights[0]),
                        "w_nu2": float(weights[1]),
                        "w_nu3": float(weights[2]),
                    }
                )
    return pd.DataFrame(rows)


def build_earth_grid() -> pd.DataFrame:
    PMNS, Psolar, solar_flux_mass, _, Pearth, solar, earth = load_peanuts()
    energy_grid = energy_grid_from_cross_sections()
    radius = solar.radius()
    density = solar.density()
    fraction = solar.fraction(SOURCE)
    theta12 = float(np.arcsin(np.sqrt(SIN2_THETA12_REF)))
    pmns = PMNS(theta12, THETA13, THETA23, DELTA_CP)

    rows = []
    for eta in ETA_GRID_RAD:
        for energy in energy_grid:
            weights = solar_flux_mass(
                pmns.theta12,
                pmns.theta13,
                DM21_REF_EV2,
                DM3L_EV2,
                float(energy),
                radius,
                density,
                fraction,
            )
            day = Psolar(pmns, DM21_REF_EV2, DM3L_EV2, float(energy), radius, density, fraction)
            night = Pearth(
                np.array(weights, dtype=complex),
                earth,
                pmns,
                DM21_REF_EV2,
                DM3L_EV2,
                float(energy),
                float(eta),
                DETECTOR_DEPTH_M,
                mode="analytical",
                massbasis=True,
            )
            rows.append(
                {
                    "source": SOURCE_TABLE_NAME,
                    "E_MeV": float(energy),
                    "eta_rad": float(eta),
                    "sin2theta12_reference": SIN2_THETA12_REF,
                    "dm21_reference_eV2": DM21_REF_EV2,
                    "Pee_day": float(day[0]),
                    "Pee_night": float(night[0]),
                    "delta_Pee_earth": float(night[0] - day[0]),
                }
            )
    return pd.DataFrame(rows)


def build_earth_parameter_scan() -> pd.DataFrame:
    PMNS, Psolar, solar_flux_mass, _, Pearth, solar, earth = load_peanuts()
    radius = solar.radius()
    density = solar.density()
    fraction = solar.fraction(SOURCE)

    rows = []
    for sin2theta12 in SIN2_GRID:
        theta12 = float(np.arcsin(np.sqrt(sin2theta12)))
        pmns = PMNS(theta12, THETA13, THETA23, DELTA_CP)
        for dm21 in DM21_GRID_EV2:
            for eta in EARTH_SCAN_ETAS_RAD:
                for energy in EARTH_SCAN_ENERGIES_MEV:
                    weights = solar_flux_mass(
                        pmns.theta12,
                        pmns.theta13,
                        float(dm21),
                        DM3L_EV2,
                        float(energy),
                        radius,
                        density,
                        fraction,
                    )
                    day = Psolar(pmns, float(dm21), DM3L_EV2, float(energy), radius, density, fraction)
                    night = Pearth(
                        np.array(weights, dtype=complex),
                        earth,
                        pmns,
                        float(dm21),
                        DM3L_EV2,
                        float(energy),
                        float(eta),
                        DETECTOR_DEPTH_M,
                        mode="analytical",
                        massbasis=True,
                    )
                    rows.append(
                        {
                            "source": SOURCE_TABLE_NAME,
                            "E_MeV": float(energy),
                            "eta_rad": float(eta),
                            "sin2theta12": float(sin2theta12),
                            "dm21_eV2": float(dm21),
                            "dm21_1e5_eV2": float(dm21 / 1.0e-5),
                            "Pee_day": float(day[0]),
                            "Pee_night": float(night[0]),
                            "delta_Pee_earth": float(night[0] - day[0]),
                        }
                    )
    return pd.DataFrame(rows)


def load_event_inputs():
    fluxes = pd.read_csv(OUT / "solar_fluxes.csv")
    spectra = pd.read_csv(OUT / "energy_spectra.csv")
    xs = pd.read_csv(OUT / "nu_electron_recoil_cross_sections.csv")
    osc = pd.read_csv(OUT / "oscillation_probabilities_grid.csv")

    phi_b8 = float(fluxes.loc[fluxes["source"] == SOURCE_TABLE_NAME, "flux_cm2_s"].iloc[0])
    b8 = spectra.loc[spectra["source"] == SOURCE_TABLE_NAME].copy().sort_values("E_MeV")
    xs = xs.sort_values(["E_MeV", "T_e_MeV"]).reset_index(drop=True)

    e_grid = np.sort(xs["E_MeV"].unique())
    t_grid = np.sort(xs["T_e_MeV"].unique())
    d_e = float(np.median(np.diff(e_grid)))
    d_t = float(np.median(np.diff(t_grid)))
    shape = np.interp(xs["E_MeV"], b8["E_MeV"], b8["spectrum_per_MeV"], left=0.0, right=0.0)
    xs = xs.assign(dphi_dE=phi_b8 * shape)
    return xs, osc, e_grid, d_e, d_t


def binned_prediction(xs: pd.DataFrame, pee: np.ndarray, d_e: float, d_t: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    edges = np.arange(T_MIN, T_MAX + 0.5 * BIN_WIDTH, BIN_WIDTH)
    nbins = len(edges) - 1
    effective_xs = (
        pee * xs["dsigma_nue_cm2_per_MeV"].to_numpy(float)
        + (1.0 - pee) * xs["dsigma_nux_cm2_per_MeV"].to_numpy(float)
    )
    weights = N_E * T_LIVE_S * xs["dphi_dE"].to_numpy(float) * effective_xs * d_e * d_t
    bin_id = np.digitize(xs["T_e_MeV"].to_numpy(float), edges) - 1
    valid = (0 <= bin_id) & (bin_id < nbins)
    prediction = np.bincount(bin_id[valid], weights=weights[valid], minlength=nbins)
    centers = 0.5 * (edges[:-1] + edges[1:])
    return edges, centers, prediction


def pee_for_params(osc: pd.DataFrame, e_values: np.ndarray, sin2theta12: float, dm21: float) -> np.ndarray:
    table = osc[
        np.isclose(osc["sin2theta12"], sin2theta12)
        & np.isclose(osc["dm21_eV2"], dm21)
    ].sort_values("E_MeV")
    if table.empty:
        raise ValueError(f"No oscillation grid row for sin2theta12={sin2theta12}, dm21={dm21}")
    return np.interp(e_values, table["E_MeV"], table["Pee_day"], left=table["Pee_day"].iloc[0], right=table["Pee_day"].iloc[-1])


def poisson_q(n: np.ndarray, mu: np.ndarray) -> float:
    mu = np.maximum(mu, 1e-300)
    terms = mu.copy()
    mask = n > 0.0
    terms[mask] = mu[mask] - n[mask] + n[mask] * np.log(n[mask] / mu[mask])
    return float(2.0 * np.sum(terms))


def fit_grid():
    xs, osc, e_grid, d_e, d_t = load_event_inputs()
    e_values = xs["E_MeV"].to_numpy(float)

    pee_ref = pee_for_params(osc, e_values, SIN2_THETA12_REF, DM21_REF_EV2)
    edges, centers, m_ref = binned_prediction(xs, pee_ref, d_e, d_t)
    _, _, m_noosc = binned_prediction(xs, np.ones_like(pee_ref), d_e, d_t)

    rng = np.random.default_rng(24680)
    n = rng.poisson(m_ref)

    rows = []
    predictions = {}
    for sin2theta12 in SIN2_GRID:
        for dm21 in DM21_GRID_EV2:
            pee = pee_for_params(osc, e_values, float(sin2theta12), float(dm21))
            _, _, mu = binned_prediction(xs, pee, d_e, d_t)
            q = poisson_q(n.astype(float), mu)
            rows.append(
                {
                    "sin2theta12": float(sin2theta12),
                    "dm21_eV2": float(dm21),
                    "dm21_1e5_eV2": float(dm21 / 1.0e-5),
                    "q": q,
                }
            )
            predictions[(float(sin2theta12), float(dm21))] = mu

    scan = pd.DataFrame(rows)
    scan["delta_q"] = scan["q"] - scan["q"].min()
    best = scan.loc[scan["q"].idxmin()].to_dict()
    return xs, osc, edges, centers, m_noosc, m_ref, n, scan, best


def load_blind_config() -> dict | None:
    if not BLIND_CONFIG.exists():
        return None
    return json.loads(BLIND_CONFIG.read_text())


def build_blind_sample() -> pd.DataFrame | None:
    config = load_blind_config()
    if config is None:
        return None

    PMNS, Psolar, _, _, _, solar, _ = load_peanuts()
    xs, _, e_grid, d_e, d_t = load_event_inputs()
    radius = solar.radius()
    density = solar.density()
    fraction = solar.fraction(SOURCE)

    sin2_true = float(config["sin2theta12_true"])
    dm21_true = float(config["dm21_true_eV2"])
    seed = int(config["seed"])
    label = str(config.get("label", "blind_sample"))

    theta12 = float(np.arcsin(np.sqrt(sin2_true)))
    pmns = PMNS(theta12, THETA13, THETA23, DELTA_CP)
    pee_on_grid = np.array(
        [
            Psolar(pmns, dm21_true, DM3L_EV2, float(energy), radius, density, fraction)[0]
            for energy in e_grid
        ]
    )
    pee = np.interp(xs["E_MeV"].to_numpy(float), e_grid, pee_on_grid)
    edges, centers, mu = binned_prediction(xs, pee, d_e, d_t)

    rng = np.random.default_rng(seed)
    observed = rng.poisson(mu)
    public = pd.DataFrame(
        {
            "blind_label": label,
            "T_low_MeV": edges[:-1],
            "T_high_MeV": edges[1:],
            "T_center_MeV": centers,
            "n_obs": observed,
        }
    )
    PROJECT_OUT.mkdir(parents=True, exist_ok=True)
    public.to_csv(PROJECT_OUT / "blind_pseudo_data_sk.csv", index=False)

    TEACHER_OUT.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(
        {
            "blind_label": label,
            "T_low_MeV": edges[:-1],
            "T_high_MeV": edges[1:],
            "T_center_MeV": centers,
            "mu_true": mu,
            "n_obs": observed,
        }
    ).to_csv(BLIND_EXPECTED, index=False)
    BLIND_TRUTH.write_text(
        json.dumps(
            {
                "blind_label": label,
                "sin2theta12_true": sin2_true,
                "dm21_true_eV2": dm21_true,
                "seed": seed,
                "expected_total": float(mu.sum()),
                "observed_total": int(observed.sum()),
                "note": "Do not publish this file with student materials before unblinding.",
            },
            indent=2,
        )
        + "\n"
    )
    return public


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


def save(fig, name: str):
    FIGURES.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(FIGURES / name, dpi=220, bbox_inches="tight", facecolor=fig.get_facecolor())
    import matplotlib.pyplot as plt

    plt.close(fig)


def make_figures(scan_results):
    import matplotlib.pyplot as plt

    xs, osc, edges, centers, m_noosc, m_ref, n, scan, best = scan_results

    fig, ax = plt.subplots(figsize=(6.9, 4.2))
    setup_axes(ax, r"$E_\nu$ [MeV]", r"$P_{ee}^{day}$")
    for sin2theta12, color in [(0.26, COLORS["purple"]), (SIN2_THETA12_REF, COLORS["orange"]), (0.36, COLORS["green"])]:
        table = osc[
            np.isclose(osc["sin2theta12"], sin2theta12)
            & np.isclose(osc["dm21_eV2"], DM21_REF_EV2)
        ].sort_values("E_MeV")
        ax.plot(table["E_MeV"], table["Pee_day"], lw=2.2, color=color, label=rf"$\sin^2\theta_{{12}}={sin2theta12:.3f}$")
    ax.set_ylim(0.15, 0.65)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", fontsize=9)
    ax.set_title(r"PEANUTS $^8$B daytime survival probability")
    save(fig, "mc2_pee_slices.png")

    fig, ax = plt.subplots(figsize=(7.0, 4.2))
    setup_axes(ax, r"$T_e$ [MeV]", "events / bin")
    ax.stairs(m_noosc, edges, color=COLORS["gray"], lw=2.0, label=r"$P_{ee}=1$")
    ax.stairs(m_ref, edges, color=COLORS["orange"], lw=2.5, label="oscillated")
    ax.set_yscale("log")
    ax.set_ylim(10, max(m_noosc) * 1.4)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0")
    ax.set_title("Oscillated event template")
    save(fig, "mc2_oscillated_template.png")

    fig, ax = plt.subplots(figsize=(7.0, 4.2))
    setup_axes(ax, r"$T_e$ [MeV]", "events / bin")
    ax.stairs(m_ref, edges, color=COLORS["orange"], lw=2.4, label="expectation")
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
    ax.set_ylim(10, max(n.max(), m_ref.max()) * 1.5)
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0")
    ax.set_title("One oscillated pseudo-data sample")
    save(fig, "mc2_pseudo_data.png")

    pivot = scan.pivot(index="sin2theta12", columns="dm21_1e5_eV2", values="delta_q")
    x = pivot.columns.to_numpy(float)
    y = pivot.index.to_numpy(float)
    z = pivot.to_numpy(float)

    fig, ax = plt.subplots(figsize=(6.8, 4.8))
    setup_axes(ax, r"$\Delta m^2_{21}$ [$10^{-5}$ eV$^2$]", r"$\sin^2\theta_{12}$")
    mesh = ax.pcolormesh(x, y, np.minimum(z, 12.0), shading="auto", cmap="magma")
    cbar = fig.colorbar(mesh, ax=ax)
    cbar.set_label(r"$\Delta q$", color="#f0f0f0")
    cbar.ax.yaxis.set_tick_params(color="#d8d8d8")
    plt.setp(cbar.ax.get_yticklabels(), color="#d8d8d8")
    ax.contour(x, y, z, levels=[2.30, 6.18], colors=["#ffffff", "#8ec5ff"], linewidths=[1.8, 1.8])
    ax.scatter([DM21_REF_EV2 / 1.0e-5], [SIN2_THETA12_REF], color=COLORS["green"], s=70, label="generated")
    ax.scatter([best["dm21_1e5_eV2"]], [best["sin2theta12"]], color=COLORS["orange"], s=65, label="best")
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", loc="upper right")
    ax.set_title("Two-parameter grid scan")
    save(fig, "mc2_contour.png")


def figure_earth_parameter_scan(earth_parameter_scan: pd.DataFrame) -> None:
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(6.9, 4.2))
    setup_axes(ax, r"$\Delta m^2_{21}$ [$10^{-5}$ eV$^2$]", r"$\Delta P_{ee}^{\oplus}$")
    view = earth_parameter_scan[
        np.isclose(earth_parameter_scan["E_MeV"], 10.0)
        & np.isclose(earth_parameter_scan["eta_rad"], 0.80)
        & earth_parameter_scan["sin2theta12"].isin([0.28, SIN2_THETA12_REF, 0.34])
    ].sort_values("dm21_1e5_eV2")
    for sin2theta12, group in view.groupby("sin2theta12"):
        ax.plot(
            group["dm21_1e5_eV2"],
            group["delta_Pee_earth"],
            lw=2.2,
            label=rf"$\sin^2\theta_{{12}}={sin2theta12:.3f}$",
        )
    ax.axhline(0.0, color=COLORS["gray"], lw=1.0, ls="--")
    ax.legend(facecolor="#111111", edgecolor="#666666", labelcolor="#f0f0f0", fontsize=9)
    ax.set_title(r"PEANUTS Earth regeneration scan, $E_\nu=10$ MeV, $\eta=0.80$")
    save(fig, "mc2_earth_parameter_scan.png")


def write_readme(
    commit: str,
    oscillation_grid: pd.DataFrame,
    earth_grid: pd.DataFrame,
    earth_parameter_scan: pd.DataFrame,
) -> None:
    text = f"""# Masterclass 2 data

These tables are for the second solar-neutrino masterclass.

The oscillation tables were generated with PEANUTS from the local clone
`.external/PEANUTS`, commit `{commit}`.

Files:

- `solar_fluxes.csv`: source flux normalizations.
- `energy_spectra.csv`: normalized source spectra.
- `nu_electron_recoil_cross_sections.csv`: recoil-electron differential cross sections.
- `oscillation_probabilities_grid.csv`: PEANUTS daytime survival-probability grid for
  `{SOURCE_TABLE_NAME}` neutrinos over `(E_MeV, sin2theta12, dm21_eV2)`.
- `earth_regeneration_grid.csv`: PEANUTS Earth-regeneration grid for `{SOURCE_TABLE_NAME}`
  neutrinos over `(E_MeV, eta_rad)` at the reference oscillation parameters.
- `earth_regeneration_parameter_scan.csv`: PEANUTS Earth-regeneration scan over
  `(sin2theta12, dm21_eV2)` for selected energies and nadir angles.

Reference oscillation parameters:

- `sin2theta12 = {SIN2_THETA12_REF}`
- `dm21_eV2 = {DM21_REF_EV2:.6e}`
- `theta13 = {THETA13:.6e} rad`
- `theta23 = {THETA23:.6e} rad`
- `delta_CP = {DELTA_CP:.6e} rad`
- `dm3l_eV2 = {DM3L_EV2:.6e}`

Grid sizes:

- oscillation grid rows: {len(oscillation_grid)}
- Earth-regeneration grid rows: {len(earth_grid)}
- Earth-regeneration parameter-scan rows: {len(earth_parameter_scan)}

Students do not need to install PEANUTS for the masterclass.
"""
    (OUT / "README.md").write_text(text)


def write_archive() -> None:
    if ARCHIVE.exists():
        ARCHIVE.unlink()
    names = [
        "README.md",
        "solar_fluxes.csv",
        "energy_spectra.csv",
        "nu_electron_recoil_cross_sections.csv",
        "oscillation_probabilities_grid.csv",
        "earth_regeneration_grid.csv",
        "earth_regeneration_parameter_scan.csv",
    ]
    with ZipFile(ARCHIVE, "w", compression=ZIP_DEFLATED) as archive:
        for name in names:
            path = OUT / name
            if path.exists():
                archive.write(path, arcname=name)


def write_project_readme() -> None:
    PROJECT_OUT.mkdir(parents=True, exist_ok=True)
    text = """# Solar-neutrino project data

These files are the public inputs for the integrated SK-like solar-neutrino
project.

Files:

- `solar_fluxes.csv`: source flux normalizations.
- `energy_spectra.csv`: normalized source spectra.
- `nu_electron_recoil_cross_sections.csv`: recoil-electron differential cross sections.
- `oscillation_probabilities_grid.csv`: PEANUTS daytime survival-probability grid for
  `B8` neutrinos over `(E_MeV, sin2theta12, dm21_eV2)`.
- `earth_regeneration_grid.csv`: PEANUTS Earth-regeneration grid over
  `(E_MeV, eta_rad)` at the reference oscillation parameters.
- `earth_regeneration_parameter_scan.csv`: PEANUTS Earth-regeneration scan over
  `(sin2theta12, dm21_eV2)` for selected energies and nadir angles.
- `blind_pseudo_data_sk.csv`: blinded SK-like recoil spectrum for the project.

The true parameters used for the blinded spectrum are not included here.
They are kept by the instructor for unblinding during the defense.
"""
    (PROJECT_OUT / "README.md").write_text(text)


def write_project_archive() -> None:
    PROJECT_OUT.mkdir(parents=True, exist_ok=True)
    write_project_readme()
    names = [
        "README.md",
        "solar_fluxes.csv",
        "energy_spectra.csv",
        "nu_electron_recoil_cross_sections.csv",
        "oscillation_probabilities_grid.csv",
        "earth_regeneration_grid.csv",
        "earth_regeneration_parameter_scan.csv",
        "blind_pseudo_data_sk.csv",
    ]
    for name in names:
        if name == "README.md":
            continue
        source = PROJECT_OUT / name if name == "blind_pseudo_data_sk.csv" else OUT / name
        if source.exists():
            destination = PROJECT_OUT / name
            if source.resolve() != destination.resolve():
                shutil.copy2(source, destination)
    if PROJECT_ARCHIVE.exists():
        PROJECT_ARCHIVE.unlink()
    with ZipFile(PROJECT_ARCHIVE, "w", compression=ZIP_DEFLATED) as archive:
        for name in names:
            path = PROJECT_OUT / name
            if path.exists():
                archive.write(path, arcname=name)


def main() -> None:
    copy_base_tables()
    commit = peanuts_commit()
    oscillation_grid = build_oscillation_grid()
    earth_grid = build_earth_grid()
    earth_parameter_scan = build_earth_parameter_scan()
    oscillation_grid.to_csv(OUT / "oscillation_probabilities_grid.csv", index=False)
    earth_grid.to_csv(OUT / "earth_regeneration_grid.csv", index=False)
    earth_parameter_scan.to_csv(OUT / "earth_regeneration_parameter_scan.csv", index=False)

    scan_results = fit_grid()
    blind_sample = build_blind_sample()
    write_readme(commit, oscillation_grid, earth_grid, earth_parameter_scan)
    write_archive()
    write_project_archive()
    make_figures(scan_results)
    figure_earth_parameter_scan(earth_parameter_scan)
    _, _, edges, _, m_noosc, m_ref, n, scan, best = scan_results

    print(f"PEANUTS commit = {commit}")
    print(f"oscillation rows = {len(oscillation_grid)}")
    print(f"earth rows = {len(earth_grid)}")
    print(f"earth parameter-scan rows = {len(earth_parameter_scan)}")
    print(f"archive = {ARCHIVE}")
    print(f"project archive = {PROJECT_ARCHIVE}")
    if blind_sample is not None:
        print(f"blind pseudo-data rows = {len(blind_sample)}")
        print(f"blind pseudo-data total = {blind_sample['n_obs'].sum():.0f}")
    print(f"no-oscillation total = {m_noosc.sum():.3f}")
    print(f"oscillated expected total = {m_ref.sum():.3f}")
    print(f"pseudo-data total = {n.sum():.0f}")
    print(f"best sin2theta12 = {best['sin2theta12']:.5f}")
    print(f"best dm21 = {best['dm21_eV2']:.6e} eV^2")
    print("first bins: T_low,T_high,expected,pseudo")
    for i in range(min(4, len(m_ref))):
        print(f"{edges[i]:.1f},{edges[i+1]:.1f},{m_ref[i]:.3f},{n[i]:.0f}")
    inside_1sigma = scan["delta_q"] <= 2.30
    print(
        "2D 68% ranges: "
        f"sin2theta12=[{scan.loc[inside_1sigma, 'sin2theta12'].min():.3f},"
        f"{scan.loc[inside_1sigma, 'sin2theta12'].max():.3f}], "
        f"dm21_1e5=[{scan.loc[inside_1sigma, 'dm21_1e5_eV2'].min():.2f},"
        f"{scan.loc[inside_1sigma, 'dm21_1e5_eV2'].max():.2f}]"
    )


if __name__ == "__main__":
    main()
