"""Заготовка к задаче 09.10: вакуумные осцилляции трёх нейтрино.

Соглашение об индексах:
    A[beta, alpha]  — амплитуда nu_alpha -> nu_beta;
    P[beta, alpha]  — соответствующая вероятность.

Зависимости: numpy, matplotlib.
"""

from __future__ import annotations

import numpy as np
import matplotlib.pyplot as plt


PHASE_COEFFICIENT = 1.267


# NuFIT 6.1, IC24 + SK-atm, нормальный порядок.
SIN2_THETA12 = 0.3088
SIN2_THETA23 = 0.470
SIN2_THETA13 = 0.02248
DELTA_CP_DEG = 212.0
DM21 = 7.537e-5  # eV^2
DM31 = 2.511e-3  # eV^2


def angle_from_sin2(value: float) -> float:
    """Вернуть угол theta в радианах по заданному sin^2(theta)."""
    return np.arcsin(np.sqrt(value))


THETA12 = angle_from_sin2(SIN2_THETA12)
THETA23 = angle_from_sin2(SIN2_THETA23)
THETA13 = angle_from_sin2(SIN2_THETA13)
DELTA_CP = np.deg2rad(DELTA_CP_DEG)


def pmns(theta12: float, theta13: float, theta23: float, delta: float) -> np.ndarray:
    """Построить PMNS в соглашении U = R23 U13(delta) R12."""
    # TODO: создайте три матрицы и верните их произведение.
    raise NotImplementedError


def mass_squared_spectrum(dm21: float, dm31: float, common_shift: float = 0.0) -> np.ndarray:
    """Вернуть (m1^2, m2^2, m3^2), положив m1^2 = common_shift."""
    return np.array(
        [common_shift, common_shift + dm21, common_shift + dm31],
        dtype=float,
    )


def amplitude_matrix(
    mixing: np.ndarray,
    mass_squared: np.ndarray,
    baseline_km: float,
    energy_gev: float,
    *,
    antineutrino: bool = False,
) -> np.ndarray:
    """Вычислить A[beta, alpha] для вакуумного распространения."""
    if energy_gev <= 0.0:
        raise ValueError("energy_gev должна быть положительной")

    # В амплитуду входит удвоенная фаза из аргумента sin^2(Delta_ij).
    phases = 2.0 * PHASE_COEFFICIENT * mass_squared * baseline_km / energy_gev
    propagation = np.diag(np.exp(-1j * phases))

    # TODO: для антинейтрино комплексно сопрягите матрицу смешивания.
    # TODO: верните U propagation U^dagger в принятом соглашении индексов.
    raise NotImplementedError


def probability_matrix(*args, **kwargs) -> np.ndarray:
    """Вернуть P[beta, alpha] = |A[beta, alpha]|^2."""
    amplitude = amplitude_matrix(*args, **kwargs)
    return np.abs(amplitude) ** 2


def check_probability_matrix(probability: np.ndarray, atol: float = 1e-12) -> None:
    """Проверить диапазон вероятностей и нормировку каждого столбца."""
    # TODO: проверьте 0 <= P <= 1 и sum_beta P[beta, alpha] = 1.
    raise NotImplementedError


def scan_probabilities(
    mixing: np.ndarray,
    mass_squared: np.ndarray,
    l_over_e: np.ndarray,
    initial_flavor: int,
    *,
    antineutrino: bool = False,
) -> np.ndarray:
    """Вернуть массив shape=(len(l_over_e), 3) для выбранного alpha."""
    result = np.empty((len(l_over_e), 3), dtype=float)

    for index, ratio in enumerate(l_over_e):
        # Можно взять E=1 GeV, тогда L[km] численно равно L/E[km/GeV].
        probability = probability_matrix(
            mixing,
            mass_squared,
            baseline_km=float(ratio),
            energy_gev=1.0,
            antineutrino=antineutrino,
        )
        result[index] = probability[:, initial_flavor]

    return result


def main() -> None:
    mixing = pmns(THETA12, THETA13, THETA23, DELTA_CP)
    mass_squared = mass_squared_spectrum(DM21, DM31)

    # TODO: проверьте U^dagger U = I.
    # TODO: проверьте P(L=0) = I.

    l_over_e = np.linspace(0.0, 2000.0, 2001)
    initial_muon_flavor = 1  # e=0, mu=1, tau=2
    probabilities = scan_probabilities(
        mixing,
        mass_squared,
        l_over_e,
        initial_muon_flavor,
    )

    labels = (r"$P_{\mu\to e}$", r"$P_{\mu\to\mu}$", r"$P_{\mu\to\tau}$")
    for beta, label in enumerate(labels):
        plt.plot(l_over_e, probabilities[:, beta], label=label)

    plt.xlabel(r"$L/E$ [km/GeV]")
    plt.ylabel("Вероятность")
    plt.xlim(l_over_e[0], l_over_e[-1])
    plt.ylim(0.0, 1.0)
    plt.legend()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()
