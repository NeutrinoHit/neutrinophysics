"""Three-flavor neutrino oscillations in vacuum and in layered matter (PREM Earth).

Conventions
- Hamiltonian in the flavor basis (e, mu, tau), common phases dropped:
      H = U diag(0, dm21, dm31) U^dagger / (2E) + diag(V, 0, 0),
  V = sqrt(2) G_F n_e for neutrinos, V -> -V and U -> U* for antineutrinos.
- PMNS: U = R23 U13(delta) R12 (PDG convention).
- Units: eV for energies and potentials, km for lengths; phase = H L / (hbar c).

Sources
- G_F/(hbar c)^3 = 1.1663787e-5 GeV^-2, hbar c = 197.3269804 MeV fm (exact): CODATA 2022 (NIST).
- N_A = 6.02214076e23 mol^-1 (exact, SI 2019).
- Oscillation parameters: NuFIT 6.1 (2025), best fit with IC24 + SK atmospheric data,
  www.nu-fit.org/?q=node/309 (normal ordering; inverted listed separately).
- PREM density: Dziewonski & Anderson (1981), as tabulated in
  talks/neutrino-telescopes-2026/assets/earth-transmission/build_transmission.py.
- Electron fractions are model assumptions, derived as Z/A_r from standard atomic weights
  (see ATOMIC_WEIGHTS and ye_of()).
"""
from __future__ import annotations

from dataclasses import dataclass, replace

import numpy as np

# --- constants -----------------------------------------------------------------------------------------------
HBARC_EV_KM = 197.3269804e6 * 1e-15 * 1e-3   # eV km   (197.3269804 MeV fm)
GF_EV2 = 1.1663787e-5 * 1e-18                 # eV^-2   (1.1663787e-5 GeV^-2)
N_A = 6.02214076e23
HBARC_EV_CM = 197.3269804e6 * 1e-13          # eV cm

# V [eV] per unit of Y_e * rho [g/cm^3]:  sqrt(2) G_F N_A (hbar c)^3
V_PER_YE_RHO = np.sqrt(2.0) * GF_EV2 * N_A * HBARC_EV_CM ** 3
# Delta m^2 L / (4E) = PHASE_COEFFICIENT * dm2[eV^2] * L[km] / E[GeV]
PHASE_COEFFICIENT = 1.0 / (4.0 * 1e9 * HBARC_EV_KM)


@dataclass(frozen=True)
class Params:
    s12sq: float
    s13sq: float
    s23sq: float
    delta_deg: float
    dm21: float     # eV^2
    dm31: float     # eV^2 (negative for inverted ordering)


# NuFIT 6.1, IC24 + SK-atm, best fit. NuFIT quotes Δm²_3ℓ: Δm²_31 for NO and
# Δm²_32 = -2.483e-3 eV² for IO, so that Δm²_31 = Δm²_32 + Δm²_21 for IO.
NUFIT61 = {
    "NO": Params(0.3088, 0.02248, 0.470, 212.0, 7.537e-5, +2.511e-3),
    "IO": Params(0.3088, 0.02262, 0.550, 274.0, 7.537e-5, -2.483e-3 + 7.537e-5),
}
FLAVORS = {"e": 0, "mu": 1, "tau": 2}


def pmns(p: Params) -> np.ndarray:
    s12, s13, s23 = np.sqrt([p.s12sq, p.s13sq, p.s23sq])
    c12, c13, c23 = np.sqrt([1 - p.s12sq, 1 - p.s13sq, 1 - p.s23sq])
    d = np.radians(p.delta_deg)
    em, ep = np.exp(-1j * d), np.exp(1j * d)
    return np.array([
        [c12 * c13, s12 * c13, s13 * em],
        [-s12 * c23 - c12 * s23 * s13 * ep, c12 * c23 - s12 * s23 * s13 * ep, s23 * c13],
        [s12 * s23 - c12 * c23 * s13 * ep, -c12 * s23 - s12 * c23 * s13 * ep, c23 * c13],
    ])


def hamiltonian(E_GeV, V_eV, p: Params, anti=False):
    """Flavor-basis Hamiltonians (eV), shape (..., 3, 3) for array E and V."""
    U = pmns(p)
    if anti:
        U = U.conj()
    E = np.asarray(E_GeV, dtype=float) * 1e9
    V = np.asarray(V_eV, dtype=float) * (-1.0 if anti else 1.0)
    E, V = np.broadcast_arrays(E, V)
    M = U @ np.diag([0.0, p.dm21, p.dm31]) @ U.conj().T
    H = M[None, :, :] / (2.0 * E.reshape(-1)[:, None, None])
    H = H.astype(complex)
    H[:, 0, 0] += V.reshape(-1)
    return H.reshape(E.shape + (3, 3))


def layer_propagator(H, L_km):
    """exp(-i H L / hbar c) for Hermitian H (..., 3, 3)."""
    w, v = np.linalg.eigh(H)
    ph = np.exp(-1j * w * (L_km / HBARC_EV_KM))
    return (v * ph[..., None, :]) @ np.swapaxes(v.conj(), -1, -2)


def probability_layers(E_GeV, layers, p: Params, anti=False):
    """P[alpha, beta] = P(nu_alpha -> nu_beta) for a sequence of (length_km, V_eV) layers.
    Returns array (n_E, 3, 3) with P[..., a, b]."""
    E = np.atleast_1d(np.asarray(E_GeV, dtype=float))
    S = np.broadcast_to(np.eye(3, dtype=complex), E.shape + (3, 3)).copy()
    for L, V in layers:
        H = hamiltonian(E, np.full_like(E, V), p, anti)
        S = layer_propagator(H, L) @ S
    # S[b, a] = amplitude a -> b
    return np.abs(np.swapaxes(S, -1, -2)) ** 2


def probability_vacuum(alpha, beta, L_km, E_GeV, p: Params, anti=False):
    """Analytic vacuum probability, broadcasting L and E."""
    U = pmns(p)
    if anti:
        U = U.conj()
    a, b = FLAVORS[alpha], FLAVORS[beta]
    L, E = np.broadcast_arrays(np.asarray(L_km, float), np.asarray(E_GeV, float))
    m2 = np.array([0.0, p.dm21, p.dm31])
    amp = np.zeros(L.shape, dtype=complex)
    for i in range(3):
        amp += U[a, i].conj() * U[b, i] * np.exp(-1j * 2 * PHASE_COEFFICIENT * m2[i] * L / E)
    return np.abs(amp) ** 2


# --- matter ---------------------------------------------------------------------------------------------------
def potential(ye_rho):
    """V = sqrt(2) G_F n_e in eV for Y_e*rho in g/cm^3."""
    return V_PER_YE_RHO * np.asarray(ye_rho, dtype=float)


def resonance_energy_GeV(dm2, s2, ye_rho):
    """E at which 2EV = dm2 cos 2theta (two-flavor MSW resonance)."""
    return dm2 * (1.0 - 2.0 * s2) / (2.0 * potential(ye_rho)) / 1e9


def sin2_2theta_matter(s2, A):
    """Two-flavor effective mixing in matter, A = 2EV/dm2."""
    c2 = 1.0 - 2.0 * s2
    s22 = 4.0 * s2 * (1.0 - s2)
    return s22 / ((c2 - A) ** 2 + s22)


# Standard atomic weights (CIAAW abridged values); Y_e = Z / A_r.
ATOMIC_WEIGHTS = {"H": (1, 1.0080), "C": (6, 12.011), "O": (8, 15.999), "Mg": (12, 24.305),
                  "Si": (14, 28.085), "S": (16, 32.06), "Fe": (26, 55.845), "Ni": (28, 58.693)}


def ye_of(mass_fractions: dict[str, float]) -> float:
    """Electrons per atomic mass unit for a mixture given by mass fractions."""
    tot = sum(mass_fractions.values())
    return sum(w / tot * ATOMIC_WEIGHTS[el][0] / ATOMIC_WEIGHTS[el][1] for el, w in mass_fractions.items())


def ye_compound(formula: dict[str, int]) -> float:
    z = sum(n * ATOMIC_WEIGHTS[el][0] for el, n in formula.items())
    a = sum(n * ATOMIC_WEIGHTS[el][1] for el, n in formula.items())
    return z / a


# --- PREM -----------------------------------------------------------------------------------------------------
R_EARTH = 6371.0
R_CORE = 3480.0
R_INNER = 1221.5
PREM = [(1221.5, (13.0885, 0.0, -8.8381, 0.0)),
        (3480.0, (12.5815, -1.2638, -3.6426, -5.5281)),
        (5701.0, (7.9565, -6.4761, 5.5283, -3.0807)),
        (5771.0, (5.3197, -1.4836, 0.0, 0.0)),
        (5971.0, (11.2494, -8.0298, 0.0, 0.0)),
        (6151.0, (7.1089, -3.8045, 0.0, 0.0)),
        (6346.6, (2.6910, 0.6924, 0.0, 0.0)),
        (6356.0, (2.900, 0.0, 0.0, 0.0)),
        (6368.0, (2.600, 0.0, 0.0, 0.0)),
        (6371.0, (1.020, 0.0, 0.0, 0.0))]

# Model electron fractions (assumptions shown on the slides):
YE_CORE = ye_compound({"Fe": 1})                     # pure iron core
YE_MANTLE = ye_compound({"Mg": 2, "Si": 1, "O": 4})  # forsterite mantle


def density(r_km, land=False):
    """PREM density; land=True replaces the 3 km ocean layer by PREM upper crust (2.6 g/cm^3)."""
    r = np.asarray(r_km, dtype=float)
    x = r / R_EARTH
    rho = np.zeros_like(r)
    inner = 0.0
    for outer, (a0, a1, a2, a3) in PREM:
        m = (r >= inner) & ((r < outer) if outer < R_EARTH else (r <= outer))
        rho = np.where(m, a0 + a1 * x + a2 * x ** 2 + a3 * x ** 3, rho)
        inner = outer
    if land:
        rho = np.where(r > 6368.0, 2.600, rho)
    return rho


def electron_fraction(r_km, ye_core=None, ye_mantle=None, ye_inner=None):
    r = np.asarray(r_km, dtype=float)
    yc = YE_CORE if ye_core is None else ye_core
    yi = yc if ye_inner is None else ye_inner
    ym = YE_MANTLE if ye_mantle is None else ye_mantle
    return np.where(r < R_INNER, yi, np.where(r < R_CORE, yc, ym))


def chord_length(cosz):
    """Path length (km) through the Earth for a detector at the surface; cosz < 0 is up-going."""
    return np.where(cosz < 0, -2.0 * R_EARTH * cosz, 0.0)


def path_layers(cosz, steps=400, ye_rho=None, land=False, **ye_kw):
    """Layers (dL_km, V_eV) along the chord, sampled at midpoints; detector at the surface."""
    L = float(chord_length(cosz))
    if L <= 0:
        return []
    # distance from the centre: r^2 = R^2 + s^2 + 2 R s cosz; split the chord at every PREM boundary
    b2 = R_EARTH ** 2 * (1.0 - cosz ** 2)
    s0 = -R_EARTH * cosz
    cuts = [0.0, L]
    for outer, _ in PREM[:-1]:
        if outer ** 2 > b2:
            h = np.sqrt(outer ** 2 - b2)
            cuts += [s0 - h, s0 + h]
    cuts = np.unique(np.clip(cuts, 0.0, L))
    ds = L / steps
    out = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        n = max(2, int(np.ceil((b - a) / ds)))
        s = a + (np.arange(n) + 0.5) / n * (b - a)
        r = np.sqrt(np.maximum(R_EARTH ** 2 + s ** 2 + 2 * R_EARTH * s * cosz, 0.0))
        yr = density(r, land) * electron_fraction(r, **ye_kw) if ye_rho is None else ye_rho(r)
        out += [((b - a) / n, v) for v in potential(yr)]
    return out


def earth_probability(alpha, beta, E_GeV, cosz, p: Params, anti=False, steps=400, **kw):
    layers = path_layers(cosz, steps, **kw)
    P = probability_layers(E_GeV, layers, p, anti)
    return P[..., FLAVORS[alpha], FLAVORS[beta]]


def earth_mass_kg():
    r = np.linspace(0.0, R_EARTH, 400001)
    m = np.trapezoid(4 * np.pi * (r * 1e5) ** 2 * density(r), r * 1e5)   # grams
    return m / 1e3


def with_params(p: Params, **kw) -> Params:
    return replace(p, **kw)
