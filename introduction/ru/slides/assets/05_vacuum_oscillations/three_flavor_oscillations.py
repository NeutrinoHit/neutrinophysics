#!/usr/bin/env python3
"""Вакуумные осцилляции трёх нейтрино: вероятности P(alpha -> beta) как
функции энергии и длины пролёта для нейтрино и антинейтрино.

Этот модуль повторяет расчёт интерактивного апплета «Вероятности трёх
нейтрино» (лекция 10, `three_flavor_probabilities.js`). Формулы те же,
что на слайдах лекции:

    |nu_alpha> = sum_i U*_{alpha i} |nu_i>,
    A(alpha -> beta) = sum_i U_{beta i} U*_{alpha i} exp(-i m_i^2 L / 2E),
    P(alpha -> beta) = |A|^2,
    U = R23 U13(delta) R12,
    антинейтрино: U -> U*.

Единицы: L в километрах, E в ГэВ, массы в эВ.  Фаза
    Delta_ij = Delta m_ij^2 L / (4E) = 1.26693 * dm2[eV^2] * L[km] / E[GeV].

Вещество не учитывается: оно появится в лекциях 11-15.

Зависимости: numpy; для графиков — matplotlib (по желанию).

Примеры.

    python three_flavor_oscillations.py --self-test

    # JUNO: выживание реакторных антинейтрино при обоих порядках масс
    python three_flavor_oscillations.py --vs E --L 52.5 --Emin 0.001 --Emax 0.01 \\
        --channels ee --particles antineutrino --compare-ordering --save juno.png

    # Появление nu_mu -> nu_e и его антинейтринный партнёр на 295 км
    python three_flavor_oscillations.py --vs E --L 295 --Emin 0.2 --Emax 2 \\
        --channels mue --particles both --save t2k_like.png

    # Карта разности нейтрино и антинейтрино
    python three_flavor_oscillations.py --map --channels mue --quantity cp \\
        --Lmax 3000 --Emin 0.3 --Emax 5 --save map.png

Как библиотека:

    from three_flavor_oscillations import BEST_FIT, probability
    P = probability("mu", "e", L_km=295.0, E_GeV=0.6, params=BEST_FIT["NO"])
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, replace
from typing import Iterable

import numpy as np

# eV^2 * km / GeV: Delta m^2 L / (4E) = PHASE_COEFFICIENT * dm2 * L / E.
PHASE_COEFFICIENT = 1.26693

FLAVORS = ("e", "mu", "tau")
FLAVOR_SYMBOLS = {"e": "ν_e", "mu": "ν_μ", "tau": "ν_τ"}


@dataclass(frozen=True)
class OscillationParameters:
    """Параметры смешивания и расщепления масс.

    dm3l — это Delta m^2_{3l} в конвенции NuFIT: Delta m^2_31 > 0 для
    нормального порядка (NO) и Delta m^2_32 < 0 для обратного (IO).
    Тогда Delta m^2_31 = dm3l (NO) и Delta m^2_31 = dm3l + dm21 (IO).
    """

    sin2_theta12: float
    sin2_theta13: float
    sin2_theta23: float
    delta_cp_deg: float
    dm21: float  # эВ^2
    dm3l: float  # эВ^2, знак задаёт порядок масс

    @property
    def ordering(self) -> str:
        return "NO" if self.dm3l > 0 else "IO"

    @property
    def dm31(self) -> float:
        return self.dm3l if self.dm3l > 0 else self.dm3l + self.dm21

    def with_ordering(self, ordering: str) -> "OscillationParameters":
        """Тот же набор, но с противоположным знаком Delta m^2_{3l}."""
        if ordering not in ("NO", "IO"):
            raise ValueError("ordering должен быть 'NO' или 'IO'")
        return replace(self, dm3l=abs(self.dm3l) * (1.0 if ordering == "NO" else -1.0))


# NuFIT 6.1 (данные ноября 2025), вариант IC24 + SK-atm, лучшие точки.
# Источник: https://www.nu-fit.org/?q=node/309
BEST_FIT = {
    "NO": OscillationParameters(0.3088, 0.02248, 0.470, 212.0, 7.537e-5, +2.511e-3),
    "IO": OscillationParameters(0.3088, 0.02262, 0.550, 274.0, 7.537e-5, -2.483e-3),
}
BEST_FIT_LABEL = "NuFIT 6.1, IC24 + SK-atm"


def pmns(theta12: float, theta13: float, theta23: float, delta: float) -> np.ndarray:
    """Матрица PMNS в конвенции U = R23 U13(delta) R12 (углы в радианах)."""
    s12, c12 = np.sin(theta12), np.cos(theta12)
    s13, c13 = np.sin(theta13), np.cos(theta13)
    s23, c23 = np.sin(theta23), np.cos(theta23)
    e_m = np.exp(-1j * delta)
    e_p = np.exp(+1j * delta)
    return np.array(
        [
            [c12 * c13, s12 * c13, s13 * e_m],
            [
                -s12 * c23 - c12 * s23 * s13 * e_p,
                c12 * c23 - s12 * s23 * s13 * e_p,
                s23 * c13,
            ],
            [
                s12 * s23 - c12 * c23 * s13 * e_p,
                -c12 * s23 - s12 * c23 * s13 * e_p,
                c23 * c13,
            ],
        ],
        dtype=complex,
    )


def mixing_matrix(params: OscillationParameters) -> np.ndarray:
    return pmns(
        np.arcsin(np.sqrt(params.sin2_theta12)),
        np.arcsin(np.sqrt(params.sin2_theta13)),
        np.arcsin(np.sqrt(params.sin2_theta23)),
        np.deg2rad(params.delta_cp_deg),
    )


def mass_squared(params: OscillationParameters) -> np.ndarray:
    """(m1^2, m2^2, m3^2) с нормировкой m1^2 = 0, эВ^2."""
    return np.array([0.0, params.dm21, params.dm31])


def jarlskog(params: OscillationParameters) -> float:
    """J_CP = Im(U_e2^* U_mu2 U_e1 U_mu1^*)."""
    u = mixing_matrix(params)
    return float(np.imag(np.conj(u[0, 1]) * u[1, 1] * u[0, 0] * np.conj(u[1, 0])))


def _index(flavor: str | int) -> int:
    if isinstance(flavor, (int, np.integer)):
        return int(flavor)
    return FLAVORS.index(flavor)


def probability(
    alpha: str | int,
    beta: str | int,
    L_km,
    E_GeV,
    params: OscillationParameters,
    antineutrino: bool = False,
):
    """Вероятность P(alpha -> beta) (или для антинейтрино) в вакууме.

    L_km и E_GeV — числа или массивы, которые приводятся друг к другу
    по правилам broadcasting numpy.
    """
    a, b = _index(alpha), _index(beta)
    u = mixing_matrix(params)
    if antineutrino:
        u = np.conj(u)
    coeff = u[b, :] * np.conj(u[a, :])  # U_{beta i} U*_{alpha i}
    L = np.asarray(L_km, dtype=float)
    E = np.asarray(E_GeV, dtype=float)
    m2 = mass_squared(params)
    # m^2 L / (2E) = 2 * Delta
    phase = 2.0 * PHASE_COEFFICIENT * L[..., None] / E[..., None] * m2
    amplitude = np.sum(coeff * np.exp(-1j * phase), axis=-1)
    return np.abs(amplitude) ** 2


def probability_matrix(L_km, E_GeV, params, antineutrino: bool = False) -> np.ndarray:
    """P[alpha, beta] = P(alpha -> beta) для скаляров L и E."""
    return np.array(
        [[probability(a, b, L_km, E_GeV, params, antineutrino) for b in range(3)] for a in range(3)]
    )


def cp_asymmetry(alpha, beta, L_km, E_GeV, params):
    """P(nu_alpha -> nu_beta) - P(anti-nu_alpha -> anti-nu_beta)."""
    return probability(alpha, beta, L_km, E_GeV, params) - probability(
        alpha, beta, L_km, E_GeV, params, antineutrino=True
    )


def parse_channel(text: str) -> tuple[str, str]:
    """'mue' -> ('mu', 'e'); 'ee' -> ('e', 'e'); 'mu-tau' тоже допустимо."""
    text = text.replace("-", "").replace("_", "").lower()
    for a in sorted(FLAVORS, key=len, reverse=True):
        if text.startswith(a):
            rest = text[len(a):]
            if rest in FLAVORS:
                return a, rest
    raise ValueError(f"не удалось разобрать канал {text!r}; примеры: ee, mue, mumu, mutau")


# --------------------------------------------------------------------------
# Самопроверка
# --------------------------------------------------------------------------


def self_test(verbose: bool = True) -> None:
    """Проверки, которые должны выполняться при любых параметрах."""
    rng = np.random.default_rng(1)
    worst = {"unitarity": 0.0, "cpt": 0.0, "cp_formula": 0.0, "jarlskog": 0.0}
    for _ in range(200):
        p = OscillationParameters(
            rng.uniform(0.2, 0.4),
            rng.uniform(0.005, 0.05),
            rng.uniform(0.3, 0.7),
            rng.uniform(0, 360),
            rng.uniform(6e-5, 9e-5),
            rng.choice([-1, 1]) * rng.uniform(2e-3, 3e-3),
        )
        L, E = rng.uniform(10, 5000), rng.uniform(0.001, 5)
        P = probability_matrix(L, E, p)
        Pbar = probability_matrix(L, E, p, antineutrino=True)
        # строки и столбцы суммируются в единицу (унитарность)
        worst["unitarity"] = max(
            worst["unitarity"],
            np.abs(P.sum(axis=1) - 1).max(),
            np.abs(P.sum(axis=0) - 1).max(),
        )
        # CPT: P(anti-alpha -> anti-beta) = P(beta -> alpha)
        worst["cpt"] = max(worst["cpt"], np.abs(Pbar - P.T).max())
        # A_CP(e -> mu) = 16 J sin(D21) sin(D32) sin(D31)
        k = PHASE_COEFFICIENT
        m = mass_squared(p)
        d21 = k * (m[1] - m[0]) * L / E
        d32 = k * (m[2] - m[1]) * L / E
        d31 = k * (m[2] - m[0]) * L / E
        predicted = 16 * jarlskog(p) * np.sin(d21) * np.sin(d32) * np.sin(d31)
        worst["cp_formula"] = max(worst["cp_formula"], abs((P[0, 1] - Pbar[0, 1]) - predicted))
        # J в стандартной параметризации
        s12, s13, s23 = (np.sqrt(x) for x in (p.sin2_theta12, p.sin2_theta13, p.sin2_theta23))
        c12, c13, c23 = (np.sqrt(1 - x) for x in (p.sin2_theta12, p.sin2_theta13, p.sin2_theta23))
        j_std = c12 * s12 * c23 * s23 * c13**2 * s13 * np.sin(np.deg2rad(p.delta_cp_deg))
        worst["jarlskog"] = max(worst["jarlskog"], abs(jarlskog(p) - j_std))
    if verbose:
        for name, value in worst.items():
            print(f"  {name:11s} max |отклонение| = {value:.2e}")
    assert all(v < 1e-10 for v in worst.values()), worst
    if verbose:
        print("self-test: OK")


# --------------------------------------------------------------------------
# Графики и командная строка
# --------------------------------------------------------------------------

UNIT_LABELS = {"e": "e", "mu": "μ", "tau": "τ"}


def channel_label(a: str, b: str, antineutrino: bool) -> str:
    bar = "̄" if antineutrino else ""
    return f"P(ν{bar}_{UNIT_LABELS[a]} → ν{bar}_{UNIT_LABELS[b]})"


def _grid(lo: float, hi: float, n: int, log: bool) -> np.ndarray:
    return np.geomspace(lo, hi, n) if log else np.linspace(lo, hi, n)


def _resolve_n(vs: str, args, params: OscillationParameters) -> int:
    """Число точек так, чтобы на быстрой осцилляции было >= 30 отсчётов."""
    big = max(abs(params.dm21), abs(params.dm31), abs(params.dm3l))
    if vs == "E":
        span = 2 * PHASE_COEFFICIENT * big * args.L * abs(1 / args.Emin - 1 / args.Emax)
    else:
        span = 2 * PHASE_COEFFICIENT * big * (args.Lmax - args.Lmin) / args.E
    return int(np.clip(30 * span / (2 * np.pi), 600, 40000))


def plot_lines(args, parameter_sets: list[tuple[str, OscillationParameters]]):
    import matplotlib.pyplot as plt

    channels = [parse_channel(c) for c in args.channels]
    escale, eunit = (1000.0, "МэВ") if args.Emax <= 0.1 else (1.0, "ГэВ")
    fig, ax = plt.subplots(figsize=(9, 4.8), constrained_layout=True)
    styles = ["-", "--", ":", "-."]
    for set_index, (set_label, params) in enumerate(parameter_sets):
        n = _resolve_n(args.vs, args, params)
        if args.vs == "E":
            x = _grid(args.Emin, args.Emax, n, args.log)
            L, E = args.L, x
        else:
            x = _grid(max(args.Lmin, 1e-3) if args.log else args.Lmin, args.Lmax, n, args.log)
            L, E = x, args.E
        for a, b in channels:
            for anti in ([False] if args.particles == "neutrino" else
                         [True] if args.particles == "antineutrino" else [False, True]):
                y = (cp_asymmetry(a, b, L, E, params) if args.quantity == "cp"
                     else probability(a, b, L, E, params, anti))
                if args.quantity == "cp" and anti:
                    continue
                style = styles[(set_index * 2 + int(anti)) % len(styles)]
                label = channel_label(a, b, anti) if args.quantity == "p" else f"A_CP({a}→{b})"
                ax.plot(x * (escale if args.vs == "E" else 1.0), y, style, lw=1.6,
                        label=f"{label}, {set_label}")
    ax.set_xlabel(f"E, {eunit}" if args.vs == "E" else "L, км")
    ax.set_ylabel("вероятность" if args.quantity == "p" else "P(ν) − P(ν̄)")
    if args.log:
        ax.set_xscale("log")
    if args.quantity == "p":
        ax.set_ylim(-0.02, 1.02)
    ax.grid(alpha=0.25)
    ax.legend(fontsize=8, ncol=2)
    return fig


def plot_map(args, params: OscillationParameters):
    import matplotlib.pyplot as plt

    a, b = parse_channel(args.channels[0])
    L = np.linspace(max(args.Lmin, 1e-3), args.Lmax, 600)
    E = np.geomspace(args.Emin, args.Emax, 400)
    LL, EE = np.meshgrid(L, E)
    if args.quantity == "cp":
        Z = cp_asymmetry(a, b, LL, EE, params)
        vmax = float(np.abs(Z).max()) or 1.0
        kw = dict(cmap="RdBu_r", vmin=-vmax, vmax=vmax)
        title = f"P(ν) − P(ν̄), канал {a}→{b}"
    elif args.quantity == "ordering":
        Z = (probability(a, b, LL, EE, params.with_ordering("NO"), args.particles == "antineutrino")
             - probability(a, b, LL, EE, params.with_ordering("IO"), args.particles == "antineutrino"))
        vmax = float(np.abs(Z).max()) or 1.0
        kw = dict(cmap="RdBu_r", vmin=-vmax, vmax=vmax)
        title = f"P(NO) − P(IO), канал {a}→{b}"
    else:
        Z = probability(a, b, LL, EE, params, args.particles == "antineutrino")
        kw = dict(cmap="Blues_r", vmin=0, vmax=1)
        title = channel_label(a, b, args.particles == "antineutrino")
    fig, ax = plt.subplots(figsize=(8.5, 5), constrained_layout=True)
    escale, eunit = (1000.0, "МэВ") if args.Emax <= 0.1 else (1.0, "ГэВ")
    mesh = ax.pcolormesh(LL, EE * escale, Z, shading="auto", rasterized=True, **kw)
    ax.set_yscale("log")
    ax.set_xlabel("L, км")
    ax.set_ylabel(f"E, {eunit}")
    ax.set_title(title)
    fig.colorbar(mesh, ax=ax)
    return fig


def main(argv: Iterable[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--self-test", action="store_true", help="проверить унитарность, CPT и формулу A_CP")
    ap.add_argument("--vs", choices=["E", "L"], default="E", help="ось абсцисс")
    ap.add_argument("--map", action="store_true", help="карта на плоскости (L, E)")
    ap.add_argument("--channels", nargs="+", default=["mumu", "mue"], help="например: ee mue mumu")
    ap.add_argument("--particles", choices=["neutrino", "antineutrino", "both"], default="neutrino")
    ap.add_argument("--quantity", choices=["p", "cp", "ordering"], default="p",
                    help="p: вероятность; cp: P(nu)-P(anti-nu); ordering: P(NO)-P(IO) (для --map)")
    ap.add_argument("--ordering", choices=["NO", "IO"], default="NO")
    ap.add_argument("--compare-ordering", action="store_true", help="нарисовать оба порядка масс")
    ap.add_argument("--L", type=float, default=295.0, help="длина пролёта, км (для --vs E)")
    ap.add_argument("--E", type=float, default=0.6, help="энергия, ГэВ (для --vs L)")
    ap.add_argument("--Emin", type=float, default=0.2)
    ap.add_argument("--Emax", type=float, default=2.0)
    ap.add_argument("--Lmin", type=float, default=0.0)
    ap.add_argument("--Lmax", type=float, default=1300.0)
    ap.add_argument("--log", action="store_true", help="логарифмическая ось абсцисс")
    for name in ("sin2_theta12", "sin2_theta13", "sin2_theta23", "delta_cp_deg", "dm21", "dm3l"):
        ap.add_argument(f"--{name.replace('_', '-')}", type=float, default=None,
                        help="переопределить параметр (dm3l в эВ^2 с учётом знака)")
    ap.add_argument("--save", help="сохранить рисунок в файл вместо показа")
    args = ap.parse_args(list(argv) if argv is not None else None)

    if args.self_test:
        self_test()
        return

    base = BEST_FIT[args.ordering]
    overrides = {k: getattr(args, k) for k in
                 ("sin2_theta12", "sin2_theta13", "sin2_theta23", "delta_cp_deg", "dm21", "dm3l")
                 if getattr(args, k) is not None}
    base = replace(base, **overrides)

    import matplotlib
    if args.save:
        matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    if args.map:
        fig = plot_map(args, base)
    else:
        sets = [(args.ordering, base)]
        if args.compare_ordering:
            other = "IO" if args.ordering == "NO" else "NO"
            sets.append((other, base.with_ordering(other)))
        fig = plot_lines(args, sets)
    if args.save:
        fig.savefig(args.save, dpi=160)
        print("сохранено:", args.save)
    else:
        plt.show()


if __name__ == "__main__":
    main()
