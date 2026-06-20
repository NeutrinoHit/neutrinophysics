"""Two-flavor MSW utilities for a pedagogical solar-neutrino model."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .constants import (
    CM3_TO_EV3,
    G_F_EV,
    NE_CORE_REFERENCE,
    dm21_reference,
    sqrt2,
    theta12_reference,
)


@dataclass(frozen=True)
class OscillationParameters:
    """Parameters for the adiabatic two-flavor approximation."""

    dm2: float = dm21_reference  # eV^2
    theta: float = theta12_reference  # radians
    ne_prod_cm3: float = NE_CORE_REFERENCE  # cm^{-3}


def matter_potential(ne: np.ndarray | float) -> np.ndarray:
    """Return V_e = sqrt(2) G_F n_e in eV for n_e in cm^{-3}."""

    return sqrt2 * G_F_EV * np.asarray(ne, dtype=float) * CM3_TO_EV3


def hamiltonian_2flavor(E: float, ne: float, dm2: float, theta: float) -> np.ndarray:
    """Two-flavor flavor-basis Hamiltonian in eV for E in MeV and n_e in cm^{-3}."""

    E_eV = float(E) * 1.0e6
    c2 = np.cos(2.0 * theta)
    s2 = np.sin(2.0 * theta)
    vacuum = dm2 / (4.0 * E_eV) * np.array([[-c2, s2], [s2, c2]], dtype=complex)
    matter = np.array([[matter_potential(ne), 0.0], [0.0, 0.0]], dtype=complex)
    return vacuum + matter


def theta_matter(E: np.ndarray | float, ne: np.ndarray | float, dm2: float, theta: float):
    """Matter mixing angle in radians for E in MeV and n_e in cm^{-3}."""

    E_eV = np.asarray(E, dtype=float) * 1.0e6
    A = 2.0 * E_eV * matter_potential(ne) / dm2
    numerator = np.sin(2.0 * theta)
    denominator = np.cos(2.0 * theta) - A
    return 0.5 * np.arctan2(numerator, denominator)


def resonance_density(E: np.ndarray | float, dm2: float, theta: float):
    """MSW resonance density in cm^{-3} for E in MeV."""

    E_eV = np.asarray(E, dtype=float) * 1.0e6
    ne_ev3 = dm2 * np.cos(2.0 * theta) / (2.0 * E_eV * sqrt2 * G_F_EV)
    return ne_ev3 / CM3_TO_EV3


def pee_adiabatic_2flavor(
    E: np.ndarray | float,
    theta: float = theta12_reference,
    dm2: float = dm21_reference,
    ne_prod_cm3: float = NE_CORE_REFERENCE,
):
    """Adiabatic, decohered two-flavor survival probability.

    This uses P_ee = 1/2 + 1/2 cos(2 theta) cos(2 theta_m^prod).
    It is useful for the masterclass but is not a full solar-neutrino analysis.
    """

    theta_m = theta_matter(E, ne_prod_cm3, dm2, theta)
    pee = 0.5 + 0.5 * np.cos(2.0 * theta) * np.cos(2.0 * theta_m)
    return np.clip(pee, 0.0, 1.0)


def compute_survival_probability_grid(E_grid, params=None):
    """Compute P_ee(E) on an energy grid."""

    if params is None:
        params = OscillationParameters()
    elif isinstance(params, dict):
        params = OscillationParameters(**params)
    E_grid = np.asarray(E_grid, dtype=float)
    return pee_adiabatic_2flavor(
        E_grid,
        theta=params.theta,
        dm2=params.dm2,
        ne_prod_cm3=params.ne_prod_cm3,
    )
