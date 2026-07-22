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

The working local environment was created with Python 3.12:

```bash
python3.12 -m venv .venv-peanuts-py312
source .venv-peanuts-py312/bin/activate
python -m pip install --upgrade "pip" "setuptools<70" wheel
python -m pip install "numpy<2" "scipy<1.15" "pandas<3" numba mpmath pyyaml matplotlib gitpython pyslha ipykernel jupyter nbformat nbclient
SETUPTOOLS_USE_DISTUTILS=local python -m pip install --no-build-isolation crlibm==1.0.3 pyinterval==1.2.0
```

Run the official PEANUTS smoke tests:

```bash
cd .external/PEANUTS
../../.venv-peanuts-py312/bin/python run_peanuts.py -f examples/solar_test.yaml
../../.venv-peanuts-py312/bin/python run_peanuts.py -f examples/solar_earth_test.yaml
```

Execute the workflow notebook:

```bash
cd /Users/dmitrijnaumov/Documents/NeutrinoHit/neutrinophysics
.venv-peanuts-py312/bin/jupyter nbconvert --to notebook --execute notebooks/peanuts_workflow.ipynb --inplace --ExecutePreprocessor.timeout=900
```

Notes:

- PEANUTS is not a pip package here; the notebook imports it from `.external/PEANUTS`.
- Current PEANUTS code expects `scipy.integrate.trapz`; the notebook installs a local compatibility alias to `numpy.trapz`.
- The local environment pins NumPy, SciPy, and Pandas to versions compatible with the current PEANUTS code.
