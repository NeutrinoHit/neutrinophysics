"""Spectrum loading, normalization and interpolation utilities."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from scipy.interpolate import interp1d


def toy_b8_spectrum(E: np.ndarray, emax: float = 16.0) -> np.ndarray:
    """Pedagogical beta-like B8 spectrum shape, not an official table."""

    E = np.asarray(E, dtype=float)
    y = np.where((E >= 0.0) & (E <= emax), E**2 * (emax - E) ** 2, 0.0)
    return y


def load_b8_spectrum(path: str | Path) -> tuple[np.ndarray, np.ndarray]:
    """Load a two-column B8 spectrum file with columns E_MeV and shape."""

    table = pd.read_csv(path)
    required = {"E_MeV", "shape"}
    missing = required.difference(table.columns)
    if missing:
        raise ValueError(f"Missing spectrum columns: {sorted(missing)}")
    return table["E_MeV"].to_numpy(float), table["shape"].to_numpy(float)


def normalize_spectrum(E: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Return y normalized to unit integral over E."""

    E = np.asarray(E, dtype=float)
    y = np.asarray(y, dtype=float)
    area = np.trapezoid(y, E)
    if not np.isfinite(area) or area <= 0.0:
        raise ValueError("Spectrum integral must be positive")
    return y / area


def interpolate_spectrum(E: np.ndarray, y: np.ndarray):
    """Create a non-negative interpolator for a tabulated spectrum."""

    E = np.asarray(E, dtype=float)
    y = np.asarray(y, dtype=float)
    return interp1d(E, y, bounds_error=False, fill_value=0.0, assume_sorted=False)
