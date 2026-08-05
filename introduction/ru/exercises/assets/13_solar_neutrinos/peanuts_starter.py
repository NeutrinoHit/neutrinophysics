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

# Compatibility with PEANUTS versions importing scipy.integrate.trapz.
import scipy.integrate as scipy_integrate

if not hasattr(scipy_integrate, "trapz"):
    scipy_integrate.trapz = np.trapz

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
