"""Toy Super-Kamiokande-like detector response."""

from __future__ import annotations

import numpy as np


def efficiency(E, threshold: float = 4.5, width: float = 0.4):
    """Smooth trigger/reconstruction efficiency for E in MeV."""

    E = np.asarray(E, dtype=float)
    return 1.0 / (1.0 + np.exp(-(E - threshold) / width))


def resolution_sigma(E, a: float = 0.15):
    """Toy energy resolution sigma in MeV."""

    E = np.asarray(E, dtype=float)
    return a * np.sqrt(np.clip(E, 0.0, None))


def smear_spectrum(E, spectrum, sigma_model=resolution_sigma):
    """Gaussian-smear a spectrum on the same energy grid."""

    E = np.asarray(E, dtype=float)
    spectrum = np.asarray(spectrum, dtype=float)
    if E.ndim != 1 or spectrum.shape != E.shape:
        raise ValueError("E and spectrum must be one-dimensional arrays of the same shape")
    dE = np.gradient(E)
    smeared = np.zeros_like(spectrum)
    for i, Ei in enumerate(E):
        sigma = np.maximum(np.asarray(sigma_model(Ei), dtype=float), 1.0e-6)
        kernel = np.exp(-0.5 * ((E - Ei) / sigma) ** 2)
        norm = np.trapezoid(kernel, E)
        if norm > 0.0:
            smeared += spectrum[i] * kernel / norm * dE[i]
    return smeared


def expected_events(E_bins, flux, pee, cross_section, exposure, background=None):
    """Expected counts in bins for arrays evaluated at bin centers.

    `exposure` is an arbitrary normalization for the toy detector.
    """

    E_bins = np.asarray(E_bins, dtype=float)
    widths = np.diff(E_bins)
    flux = np.asarray(flux, dtype=float)
    pee = np.asarray(pee, dtype=float)
    cross_section = np.asarray(cross_section, dtype=float)
    expected = exposure * flux * pee * cross_section * widths
    if background is not None:
        expected = expected + np.asarray(background, dtype=float)
    return np.clip(expected, 0.0, None)
