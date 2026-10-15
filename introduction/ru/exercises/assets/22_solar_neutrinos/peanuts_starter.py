"""Minimal PEANUTS entry point for the solar-neutrino exercises."""

from __future__ import annotations

import sys
import warnings
from pathlib import Path

import numpy as np


def find_repo_root() -> Path:
    for candidate in [Path.cwd(), *Path.cwd().parents]:
        if (candidate / ".external" / "PEANUTS" / "peanuts").is_dir():
            return candidate
    raise RuntimeError("Run this file from inside the neutrinophysics repository")


REPO_ROOT = find_repo_root()
PEANUTS_ROOT = REPO_ROOT / ".external" / "PEANUTS"
sys.path.insert(0, str(PEANUTS_ROOT))

# PEANUTS was written for NumPy < 2 and pandas < 3: restore np.trapz,
# scipy.integrate.trapz and read_csv(delim_whitespace=True).
import pandas as pd
import scipy.integrate as scipy_integrate

_trapezoid = getattr(np, "trapezoid", None) or np.trapz
if not hasattr(np, "trapz"):
    np.trapz = _trapezoid
if not hasattr(scipy_integrate, "trapz"):
    scipy_integrate.trapz = _trapezoid
if not getattr(pd.read_csv, "peanuts_compat", False):
    _read_csv = pd.read_csv

    def _read_csv_compat(*args, delim_whitespace=False, **kwargs):
        if delim_whitespace:
            kwargs.setdefault("sep", r"\s+")
        return _read_csv(*args, **kwargs)

    _read_csv_compat.peanuts_compat = True
    pd.read_csv = _read_csv_compat

with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=FutureWarning)
    from peanuts.pmns import PMNS
    from peanuts.solar import Psolar, SolarModel


with warnings.catch_warnings():
    warnings.filterwarnings("ignore", category=FutureWarning)
    SOLAR = SolarModel()
SOURCES = ("pp", "pep", "hep", "7Be", "8B", "13N", "15O", "17F")


def survival_probability(
    energy_mev: float,
    source: str = "8B",
    sin2_theta12: float = 0.307,
    sin2_theta13: float = 0.022,
    dm21_ev2: float = 7.42e-5,
    dm3l_ev2: float = 2.51e-3,
) -> float:
    """Return the PEANUTS daytime electron-neutrino survival probability."""

    theta12 = np.arcsin(np.sqrt(sin2_theta12))
    theta13 = np.arcsin(np.sqrt(sin2_theta13))
    pmns = PMNS(theta12, theta13, 0.85521, 0.0)
    probabilities = Psolar(
        pmns,
        dm21_ev2,
        dm3l_ev2,
        energy_mev,
        SOLAR.radius(),
        SOLAR.density(),
        SOLAR.fraction(source),
    )
    return float(probabilities[0])


if __name__ == "__main__":
    print("PEANUTS root:", PEANUTS_ROOT)
    print("\nSolar fluxes [cm^-2 s^-1]")
    for name in SOURCES:
        print(f"{name:>3s}: {SOLAR.flux(name):.6e}")

    print("\nPee for 8B neutrinos")
    for energy in (1.0, 5.0, 10.0, 15.0):
        print(f"E = {energy:4.1f} MeV: Pee = {survival_probability(energy):.6f}")
