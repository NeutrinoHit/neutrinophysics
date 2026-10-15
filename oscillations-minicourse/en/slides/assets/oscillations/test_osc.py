import numpy as np

import osc


def test_constants():
    assert abs(osc.V_PER_YE_RHO / 7.63e-14 - 1) < 1e-3          # 7.63e-14 eV per (g/cm^3)
    assert abs(osc.PHASE_COEFFICIENT - 1.26693) < 1e-5            # 1.267 dm2 L / E


def test_vacuum_layers_match_analytic():
    p = osc.NUFIT61["NO"]
    E = np.array([0.003, 0.6, 2.0, 10.0])
    for L in (1.6, 52.5, 295.0, 1300.0, 12742.0):
        P = osc.probability_layers(E, [(L / 3, 0.0)] * 3, p)
        for a in "e mu tau".split():
            for b in "e mu tau".split():
                pa = osc.probability_vacuum(a, b, L, E, p)
                assert np.allclose(P[:, osc.FLAVORS[a], osc.FLAVORS[b]], pa, atol=1e-10)
        anti = osc.probability_layers(E, [(L, 0.0)], p, anti=True)
        assert np.allclose(anti[:, 1, 0], osc.probability_vacuum("mu", "e", L, E, p, anti=True), atol=1e-10)


def test_unitarity_in_matter():
    p = osc.NUFIT61["NO"]
    P = osc.probability_layers(np.geomspace(1, 30, 20), osc.path_layers(-0.9, 200), p)
    assert np.allclose(P.sum(axis=2), 1, atol=1e-10) and np.allclose(P.sum(axis=1), 1, atol=1e-10)


def test_two_flavor_matter_formula():
    # theta12 = theta23 = 0, dm21 = 0: e-mu sector reduces to two flavors with theta13 and dm31
    p = osc.Params(0.0, 0.02248, 0.0, 0.0, 0.0, 2.511e-3)
    p = osc.with_params(p, s23sq=1.0)                        # theta23 = 90 deg: nu_3 = (s13, c13 . 1, 0) -> e-mu
    ye_rho = 0.5 * 4.5
    V = osc.potential(ye_rho)
    E = np.linspace(2, 15, 40)
    A = 2 * E * 1e9 * V / p.dm31
    s22m = osc.sin2_2theta_matter(p.s13sq, A)
    dm = p.dm31 * np.sqrt((1 - 2 * p.s13sq - A) ** 2 + 4 * p.s13sq * (1 - p.s13sq))
    L = 3000.0
    expect = s22m * np.sin(osc.PHASE_COEFFICIENT * dm * L / E) ** 2
    P = osc.probability_layers(E, [(L, V)], p)[:, 0, 1]
    assert np.allclose(P, expect, atol=1e-9)


def test_prem_mass():
    assert abs(osc.earth_mass_kg() / 5.9722e24 - 1) < 0.01


def test_path_convergence():
    p = osc.NUFIT61["NO"]
    E = np.geomspace(1, 20, 60)
    for c in (-0.95, -0.6):
        a = osc.earth_probability("mu", "e", E, c, p, steps=120)
        b = osc.earth_probability("mu", "e", E, c, p, steps=1200)
        assert np.max(abs(a - b)) < 1e-3, np.max(abs(a - b))


def test_ye_values():
    assert abs(osc.YE_CORE - 26 / 55.845) < 1e-12
    assert 0.49 < osc.YE_MANTLE < 0.50


def test_land_replaces_only_the_ocean():
    r = np.array([6000.0, 6360.0, 6369.0, 6370.5])
    assert np.allclose(osc.density(r, land=True)[:2], osc.density(r)[:2])
    assert np.allclose(osc.density(r, land=True)[2:], 2.6) and np.allclose(osc.density(r)[2:], 1.02)
