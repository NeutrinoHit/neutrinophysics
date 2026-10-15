# PEANUTS setup

This note records the local setup used for the notebook:

`notebooks/peanuts_workflow.ipynb`

Reference:

- Paper: Tomás E. Gonzalo and Michele Lucente, "PEANUTS: a software for the automatic computation of solar neutrino flux and its propagation within Earth", arXiv:2303.15527.
- Code: <https://github.com/michelelucente/PEANUTS>

The PEANUTS source tree is kept as an ignored external dependency:

```bash
git clone https://github.com/michelelucente/PEANUTS .external/PEANUTS
```

The scripts and notebooks run in the workspace Python environment (pyenv,
selected by `.python-version`). PEANUTS needs NumPy, SciPy, pandas, Numba,
mpmath and PyYAML; the notebook also needs Matplotlib and Jupyter:

```bash
python -m pip install numpy scipy pandas numba mpmath pyyaml matplotlib jupyter nbclient
```

`gitpython` and `pyslha` are optional: without them PEANUTS prints a warning,
shows a default version tag and disables SLHA input.

The plain command-line driver `run_peanuts.py` works only with NumPy < 2 and
pandas < 3. The workflow notebook runs it in its own kernel after the
compatibility patches described below.

Execute the workflow notebook from the repository root:

```bash
jupyter nbconvert --to notebook --execute notebooks/peanuts_workflow.ipynb --inplace --ExecutePreprocessor.timeout=900
```

Notes:

- PEANUTS is not a pip package here; the notebook imports it from `.external/PEANUTS`.
- PEANUTS was written for NumPy < 2 and pandas < 3. The scripts and notebooks
  that import it restore `np.trapz` and `scipy.integrate.trapz` as aliases of
  `np.trapezoid` and translate `read_csv(delim_whitespace=True)` into
  `read_csv(sep=r"\s+")`. Both are the same operations, so the results do not
  change: the solar and Earth smoke tests and the masterclass spectrum tables
  agree digit by digit with the former NumPy 1.26 / pandas 2 setup.
