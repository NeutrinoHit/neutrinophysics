"""Solar-neutrino flux table helpers."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def load_flux_table(path: str | Path) -> pd.DataFrame:
    """Load a solar-neutrino flux table with basic validation."""

    fluxes = pd.read_csv(path)
    required = {"source", "flux_cm2_s", "kind", "comment"}
    missing = required.difference(fluxes.columns)
    if missing:
        raise ValueError(f"Missing flux-table columns: {sorted(missing)}")
    return fluxes


def plot_fluxes(fluxes: pd.DataFrame, ax=None):
    """Plot fluxes on a logarithmic scale."""

    if ax is None:
        _, ax = plt.subplots(figsize=(7.2, 4.0))
    fluxes.plot.bar(x="source", y="flux_cm2_s", logy=True, legend=False, ax=ax)
    ax.set_ylabel(r"Flux, cm$^{-2}$ s$^{-1}$")
    ax.set_xlabel("source")
    ax.set_title("Reference solar-neutrino fluxes")
    ax.grid(axis="y", alpha=0.3)
    return ax
