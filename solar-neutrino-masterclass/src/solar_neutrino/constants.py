"""Physical constants for the toy solar-neutrino calculations.

Analytic quantities use natural units, hbar = c = 1. Practical inputs such as
cm^{-3} densities are converted explicitly where needed.
"""

from __future__ import annotations

import numpy as np

sqrt2 = np.sqrt(2.0)

# Fermi constant in GeV^{-2}; converted to eV^{-2} where needed.
G_F = 1.1663787e-5
G_F_EV = G_F * 1.0e-18

# Natural-units conversion: 1 cm = CM_TO_EV_INV eV^{-1}.
CM_TO_EV_INV = 5.067730652e4
CM3_TO_EV3 = 1.0 / CM_TO_EV_INV**3

# Reference two-flavor solar parameters. These are pedagogical defaults,
# close to current global-fit values, not a replacement for a cited fit.
sin2theta12_reference = 0.307
theta12_reference = np.arcsin(np.sqrt(sin2theta12_reference))
dm21_reference = 7.42e-5  # eV^2

# Typical effective electron density near the B8 production region.
NE_CORE_REFERENCE = 6.0e25  # cm^{-3}
