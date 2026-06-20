"""Pseudoexperiment helpers."""

from __future__ import annotations

import numpy as np


def generate_poisson_data(expected, seed: int = 12345):
    """Generate Poisson-distributed pseudo-data from expected bin counts."""

    rng = np.random.default_rng(seed)
    return rng.poisson(np.asarray(expected, dtype=float))
