"""Toy neutrino-electron cross sections."""

from __future__ import annotations

import numpy as np


def nu_e_elastic_toy(E):
    """Toy nu_e e elastic cross section proportional to E.

    The returned value is in arbitrary units. It keeps the event-rate model
    transparent and should not be used as a precision cross section.
    """

    return np.asarray(E, dtype=float)


def nu_mu_elastic_toy(E):
    """Toy nu_mu/tau e elastic cross section with a smaller coefficient."""

    return 0.16 * np.asarray(E, dtype=float)
