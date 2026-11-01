"""Neutral- and charged-current diagrams for lecture 11."""

import numpy as np
import matplotlib.pyplot as plt

from make_simple import INC, SEC, TOT, TXT, MUT, arrow, save, style


def fermion(ax, start, end, color):
    """Particle-flow arrow from an incoming endpoint or toward an outgoing one."""
    start, end = np.array(start), np.array(end)
    ax.plot(*np.array([start, end]).T, color=color, lw=3.1)
    arrow(ax, start + .42 * (end - start), start + .60 * (end - start),
          color, lw=2.8, ms=21)


def diagram(charged=False):
    fig = plt.figure(figsize=(8, 7.2))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set(xlim=(0, 8), ylim=(0, 7.2), aspect='equal')
    ax.axis('off')
    upper, lower = (4, 4.8), (4, 2.4)

    # Both incoming particles enter from the left. In the charged-current
    # diagram the outgoing species exchange rows: nu_e -> e^- and e^- -> nu_e.
    fermion(ax, (1, 6.0), upper, INC)
    fermion(ax, upper, (7, 6.0), SEC if charged else INC)
    fermion(ax, (1, 1.5), lower, SEC)
    fermion(ax, lower, (7, 1.5), INC if charged else SEC)

    t = np.linspace(0, 1, 500)
    ax.plot(4 + .105 * np.sin(2 * np.pi * 6 * t), 4.8 - 2.4 * t,
            color=TOT, lw=2.8)
    ax.scatter([4, 4], [4.8, 2.4], color=TXT, s=30, zorder=4)
    ax.text(4.36, 3.6, r'$W^+$' if charged else r'$Z^0$',
            fontsize=31, color=TOT, va='center')

    labels = (
        [(1, 6.38, r'$\nu_e$', INC), (7, 6.38, r'$e^-$', SEC),
         (1, .95, r'$e^-$', SEC), (7, .95, r'$\nu_e$', INC)]
        if charged else
        [(1, 6.38, r'$\nu_\alpha$', INC), (7, 6.38, r'$\nu_\alpha$', INC),
         (1, .95, r'$f$', SEC), (7, .95, r'$f$', SEC)]
    )
    for x, y, label, color in labels:
        ax.text(x, y, label, color=color, fontsize=32, ha='center', va='center')

    ax.text(4, 7.0, 'Заряженный ток' if charged else 'Нейтральный ток',
            color=MUT, fontsize=23, ha='center', va='top')
    ax.text(4, .30,
            r'$\nu_e+e^-\;\longrightarrow\;\nu_e+e^-$' if charged else
            r'$\nu_\alpha+f\;\longrightarrow\;\nu_\alpha+f$',
            fontsize=25, ha='center', va='bottom')
    save(fig, 'neutrino-electron-cc' if charged else 'neutrino-fermion-nc')


if __name__ == '__main__':
    style()
    diagram()
    diagram(charged=True)
