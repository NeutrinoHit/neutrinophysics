"""Likelihood and scan utilities for the toy pseudoexperiment."""

from __future__ import annotations

import numpy as np


def poisson_chi2(observed, expected):
    """Poisson deviance chi-square with the n_i = 0 case handled explicitly."""

    observed = np.asarray(observed, dtype=float)
    expected = np.clip(np.asarray(expected, dtype=float), 1.0e-12, None)
    term = expected - observed
    mask = observed > 0.0
    term[mask] += observed[mask] * np.log(observed[mask] / expected[mask])
    return 2.0 * np.sum(term)


def scan_normalization(observed, template, norm_grid):
    """Scan a single normalization parameter."""

    norm_grid = np.asarray(norm_grid, dtype=float)
    chi2 = np.array([poisson_chi2(observed, n * template) for n in norm_grid])
    return {"grid": norm_grid, "chi2": chi2, "parameter_names": ("normalization",)}


def scan_two_parameters(observed, model_function, grid1, grid2):
    """Scan two parameters with model_function(p1, p2) -> expected counts."""

    grid1 = np.asarray(grid1, dtype=float)
    grid2 = np.asarray(grid2, dtype=float)
    chi2 = np.empty((grid1.size, grid2.size), dtype=float)
    for i, p1 in enumerate(grid1):
        for j, p2 in enumerate(grid2):
            chi2[i, j] = poisson_chi2(observed, model_function(p1, p2))
    return {"grid1": grid1, "grid2": grid2, "chi2": chi2}


def find_best_fit(scan_result):
    """Return the best-fit point from a 1D or 2D scan result."""

    chi2 = np.asarray(scan_result["chi2"], dtype=float)
    index = np.unravel_index(np.argmin(chi2), chi2.shape)
    result = {"index": index, "chi2": float(chi2[index])}
    if "grid" in scan_result:
        result["parameters"] = (float(scan_result["grid"][index[0]]),)
    else:
        result["parameters"] = (
            float(scan_result["grid1"][index[0]]),
            float(scan_result["grid2"][index[1]]),
        )
    return result


def delta_chi2(scan_result):
    """Return chi2 - chi2_min for a scan result."""

    chi2 = np.asarray(scan_result["chi2"], dtype=float)
    return chi2 - np.min(chi2)
