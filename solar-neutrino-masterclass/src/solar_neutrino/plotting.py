"""Plotting helpers shared by notebooks."""

from __future__ import annotations

import numpy as np
import matplotlib.pyplot as plt


def plot_spectrum(E, spectrum, ax=None, label=None, ylabel="normalized shape"):
    if ax is None:
        _, ax = plt.subplots(figsize=(7.2, 4.0))
    ax.plot(E, spectrum, lw=2, label=label)
    ax.set_xlabel(r"$E_\nu$, MeV")
    ax.set_ylabel(ylabel)
    ax.grid(alpha=0.3)
    if label:
        ax.legend()
    return ax


def plot_pee(E, pee, ax=None, label=r"$P_{ee}$"):
    if ax is None:
        _, ax = plt.subplots(figsize=(7.2, 4.0))
    ax.plot(E, pee, lw=2, label=label)
    ax.set_xlabel(r"$E_\nu$, MeV")
    ax.set_ylabel(r"$P_{ee}$")
    ax.set_ylim(0.0, 1.0)
    ax.grid(alpha=0.3)
    if label:
        ax.legend()
    return ax


def plot_expected_vs_observed(E_centers, expected, observed, ax=None):
    if ax is None:
        _, ax = plt.subplots(figsize=(7.2, 4.0))
    ax.step(E_centers, expected, where="mid", lw=2, label="expected")
    ax.errorbar(E_centers, observed, yerr=np.sqrt(np.maximum(observed, 1.0)), fmt="o", label="pseudo-data")
    ax.set_xlabel(r"$E_{\rm rec}$, MeV")
    ax.set_ylabel("events / bin")
    ax.grid(alpha=0.3)
    ax.legend()
    return ax


def plot_chi2_scan(grid, chi2, ax=None):
    if ax is None:
        _, ax = plt.subplots(figsize=(7.2, 4.0))
    delta = np.asarray(chi2) - np.min(chi2)
    ax.plot(grid, delta, lw=2)
    ax.axhline(1.0, color="0.6", ls="--", lw=1)
    ax.set_xlabel("parameter")
    ax.set_ylabel(r"$\Delta\chi^2$")
    ax.grid(alpha=0.3)
    return ax


def plot_contour(grid1, grid2, delta, ax=None, levels=(2.30, 6.18)):
    if ax is None:
        _, ax = plt.subplots(figsize=(6.0, 4.8))
    contour = ax.contour(grid1, grid2, np.asarray(delta).T, levels=levels)
    ax.clabel(contour, inline=True, fontsize=9)
    ax.set_xlabel("parameter 1")
    ax.set_ylabel("parameter 2")
    ax.grid(alpha=0.3)
    return ax
