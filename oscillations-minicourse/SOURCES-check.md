# SOURCES-check — China school 2026, neutrino-oscillation lecture

Checked 2026-10-14. Every value below was read on 2026-10-14 from the primary source
named (arXiv TeX source / PDF / API abstract, publisher page, CODATA/NIST, IAU, CIAAW,
collaboration data files). "Derived" means arithmetic on verified inputs, shown explicitly.
Status: VERIFIED / CORRECTED / UNVERIFIED. Quotes are verbatim (LaTeX lightly simplified).

---

## 1. Super-Kamiokande 1998, atmospheric up/down asymmetry

Source: Super-Kamiokande Collab. (Y. Fukuda et al.), "Evidence for oscillation of atmospheric neutrinos",
Phys. Rev. Lett. 81, 1562–1567 (1998), arXiv:hep-ex/9807003v2 (TeX source `nuosc98.tex`). 33.0 kt·yr (535 d).

| Claim on slide | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| Multi-GeV μ-like A = (U−D)/(U+D) | A = −0.296 ± 0.048 (stat) ± 0.01 (syst), FC+PC, >6σ from 0 | main text, zenith-angle paragraph | "Considering multi-GeV (FC+PC) muons alone, the measured asymmetry, A = −0.296 ± 0.048 ± 0.01 deviates from zero by more than 6 standard deviations." | VERIFIED |
| Multi-GeV e-like asymmetry | A = −0.036 ± 0.067 ± 0.02 | νμ↔νe paragraph | "differs from the measured asymmetry, A = −0.036 ± 0.067 ± 0.02, by 3.4 standard deviations" | VERIFIED |
| Definition of U, D | U: −1 < cosΘ < −0.2; D: 0.2 < cosΘ < 1 | same section | "U is the number of upward-going events (−1 < cos Θ < −0.2) and D is the number of downward-going events (0.2 < cos Θ < 1)" | VERIFIED |
| Fit region | sin²2θ > 0.82, 5×10⁻⁴ < Δm² < 6×10⁻³ eV² (90% CL) | abstract | "consistent ... with two-flavor nu_mu <-> nu_tau oscillations with sin^2(2theta)>0.82 and 5x10^-4 < delta m^2 < 6x10^-3 eV^2" | VERIFIED |

## 2. SNO 2002 neutral-current result

Source: SNO Collab., "Direct Evidence for Neutrino Flavor Transformation from Neutral-Current Interactions in the
Sudbury Neutrino Observatory", Phys. Rev. Lett. 89, 011301 (2002), arXiv:nucl-ex/0204008v2 (TeX `nc_prl.tex`).
Units 10⁶ cm⁻² s⁻¹, T_eff > 5 MeV, standard ⁸B shape.

| Claim | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| Total active ⁸B flux (NC) | φ_NC = 5.09 (+0.44 −0.43 stat) (+0.46 −0.43 syst) | abstract; eqs. after "fluxes are presented in units of 10⁶" | "The total flux measured with the NC reaction is 5.09 +0.44,−0.43(stat.)+0.46,−0.43(syst.)" | VERIFIED |
| CC flux | φ_CC = 1.76 (+0.06 −0.05 stat) ± 0.09 (syst) | same display | (TeX macro `\snoccfluxshort` = 1.76^{+0.06}_{−0.05}(stat.)^{+0.09}_{−0.09}(syst.)) | VERIFIED |
| νe component (CC+ES+NC fit) | φ_e = 1.76 ± 0.05 (stat) ± 0.09 (syst) | abstract | "the electron-neutrino component of the 8B solar flux is 1.76 +/-0.05(stat.)+/-0.09(syst.)" | VERIFIED |
| Non-νe component, significance | φ_μτ = 3.41 ± 0.45 (stat) (+0.48 −0.45 syst); 5.3σ > 0 (5.5σ adding SK ES) | abstract; text | "3.41+/-0.45(stat.)+0.48,-0.45(syst.) x10^6/(cm^2 s), 5.3 standard deviations greater than zero" | VERIFIED |
| SSM prediction quoted | φ_SSM(⁸B) = 5.05 (+1.01 −0.81), ref. BP2001 = Bahcall, Pinsonneault, Basu, ApJ 555, 990 (2001) | text after shape-unconstrained NC result; bib `bp2000` | "with the standard solar model prediction for 8B, φ_SSM = 5.05^{+1.01}_{−0.81}" | VERIFIED |
| Ratio CC/NC | ≈ 0.35 (1.76/5.09 = 0.346) — **derived**, not stated in the paper | — | — | Derived (do not attribute to paper) |

Shape-unconstrained NC flux in the same paper: 6.42 ± 1.57 (stat) (+0.55 −0.58 syst).

## 3. Homestake final result

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| Homestake rate | 2.56 ± 0.16 (stat) ± 0.16 (syst) SNU, 108 extractions | B. T. Cleveland, T. Daily, R. Davis Jr., J. R. Distel, K. Lande, C. K. Lee, P. S. Wildenhain, J. Ullman, ApJ 496, 505 (1998), doi:10.1086/305343 — abstract (IOP page) | "The combined result of 108 extractions is a solar neutrino-induced 37Ar production rate of 2.56 ± 0.16 (statistical) ± 0.16 (systematic) SNU." | VERIFIED |
| SSM prediction used **inside Cleveland et al.** | not read (paywalled body) | — | — | UNVERIFIED |
| SSM prediction, BP98 | 7.7 (+1.2 −1.0) SNU (Cl total) | Bahcall, Basu, Pinsonneault, Phys. Lett. B 433, 1 (1998), astro-ph/9805135, Table 1 "Standard Model Predictions (BP98)", row Total, column Cl | "Total ... 7.7^{+1.2}_{−1.0}" (Cl column, SNU) | VERIFIED |
| SSM prediction, BP2000 + ratio | 7.6 (+1.3 −1.1) SNU; observed/BP2000 = 0.34 ± 0.06 (with 2.56 ± 0.23 SNU) | Bahcall, Pinsonneault, Basu, ApJ 555, 990 (2001), astro-ph/0010346, comparison table (8th table in TeX) | "Chlorine & 7.6^{+1.3}_{−1.1} & 2.56 ± 0.23 & 0.34 ± 0.06" | VERIFIED |

Recommendation for slide: "2.56 ± 0.23 SNU vs SSM 7.6 SNU (BP2000): ratio 0.34 ± 0.06".

## 4. Standard solar model fluxes (B16-GS98)

Source: N. Vinyoles, A. M. Serenelli, F. L. Villante et al., "A New Generation of Standard Solar Models",
ApJ 835, 202 (2017) (Crossref), arXiv:1611.09867v4, table "Model and solar neutrino fluxes" (`tab:neutrinos`, 6th table in the TeX).

| Flux (B16-GS98) | Value | Status |
|---|---|---|
| pp | 5.98 (1 ± 0.006) × 10¹⁰ cm⁻² s⁻¹ | VERIFIED |
| pep | 1.44 (1 ± 0.01) × 10⁸ | VERIFIED |
| hep | 7.98 (1 ± 0.30) × 10³ | VERIFIED |
| ⁷Be | 4.93 (1 ± 0.06) × 10⁹ | VERIFIED |
| ⁸B | 5.46 (1 ± 0.12) × 10⁶ | VERIFIED |
| ¹³N | 2.78 (1 ± 0.15) × 10⁸ | VERIFIED |
| ¹⁵O | 2.05 (1 ± 0.17) × 10⁸ | VERIFIED |
| ¹⁷F | 5.29 (1 ± 0.20) × 10⁶ | VERIFIED |
| **Sum of all 8 components** | **6.54 × 10¹⁰ cm⁻² s⁻¹** (= 6.5368 × 10¹⁰; pp is 91.5 %) | Derived |

Quote (caption): "Units are: 10^10 (pp), 10^9 (7Be), 10^8 (pep, 13N, 15O), 10^6 (8B, 17F) and 10^3 (hep) cm^-2 s^-1."
Row: "Φ(pp) & 5.98(1 ± 0.006) & 6.03(1 ± 0.005)" (GS98, AGSS09met).

## 5. Inverse-beta-decay cross section (Vogel & Beacom)

Source: P. Vogel, J. F. Beacom, Phys. Rev. D 60, 053003 (1999) (Crossref title: "Angular distribution of neutron inverse
beta decay, ν̄e + p → e⁺ + n"), arXiv:hep-ph/9903554v1; **Eq. (11)** of the arXiv v1 PDF (TeX label `eq:sigtot0`).

| Claim | Verified | Quote | Status |
|---|---|---|---|
| σ ≈ 9.5×10⁻⁴⁴ (E_e p_e/MeV²) cm² | σ_tot^(0) = 0.0952 (E_e^(0) p_e^(0) / 1 MeV²) × 10⁻⁴² cm² = 9.52 × 10⁻⁴⁴ cm² × (E_e p_e/MeV²) | "= 0.0952 (E_e^(0) p_e^(0) / 1 MeV^2) × 10^−42 cm^2" | VERIFIED |
| Order | zeroth order in 1/M; E_e^(0) = E_ν − Δ, Δ = M_n − M_p | "E_e^{(0)} = E_ν − Δ" | VERIFIED |
| Inputs | σ₀ = G_F² cos²θ_C (1+Δ_inner^R)/π, Δ_inner^R ≈ 0.024, f = 1, g = 1.26, cosθ_C = 0.974 | "where Δ^R_inner ≃ 0.024"; "f = 1, g = 1.26"; "cos θ_C = 0.974" | VERIFIED |
| Neutron-lifetime form | σ^(0) = (2π²/m_e⁵)/(f^R τ_n) E_e p_e, f^R = 1.7152 | "where τ_n is the measured neutron lifetime and f^R_p.s. = 1.7152" | VERIFIED (form) |
| Numerical τ_n used | not stated in the paper | — | UNVERIFIED |

Note: the 0.0952 prefactor comes from the coupling-constant form (f, g, cosθ_C), not from a stated τ_n.
Equation number in the *published* PRD not checked (arXiv v1: Eq. 11).

## 6. Baselines and energies

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| Daya Bay far hall ~1.6–1.9 km | EH3 flux-averaged baseline ≈ 1650 m (EH1, EH2 ≈ 500 m) | Daya Bay Collab., PRL 130, 161802 (2023), arXiv:2211.14988, detector paragraph | "having a flux-averaged baseline of about 500 m, 500 m, and 1650 m from the reactors, respectively" | VERIFIED; write "≈1.65 km" |
| JUNO 52.5 km | 52.5 km | JUNO Collab., arXiv:2511.14593 (2025) abstract; also arXiv:2609.37895 (2026) "average reactor baseline of 52.5 km" | "a 20 kton liquid-scintillator detector located 52.5 km from multiple reactor cores" | VERIFIED |
| (JUNO Yellow Book) | "53-km" | F. An et al., J. Phys. G 43, 030401 (2016), arXiv:1507.05613 abstract | "reactor antineutrinos from two power plants at 53-km distance" | VERIFIED (use 52.5 km) |
| KamLAND ~180 km | flux dominated by reactors at ~180 km; 79 % of flux from 26 reactors at 138–214 km | KamLAND, PRL 90, 021802 (2003), hep-ex/0212021, text; also KamLAND GRL 49 (2022) "mean weighted distance of 180 km" | "dominated by a few reactors at an average distance of ∼180 km" | VERIFIED |
| T2K 295 km, peak 0.6 GeV | L = 295 km, 2.5° off-axis, tuned to 1st max ≈ 0.6 GeV | T2K, PRL 107, 041801 (2011), arXiv:1106.2822 | "directed 2.5° off-axis to Super-Kamiokande (SK) at a distance L=295 km" ... "first oscillation maximum ... ≃ 0.6 GeV" | VERIFIED |
| NOvA 810 km | 810 km, ~2 GeV beam | NOvA, PRL 123, 151803 (2019), arXiv:1906.04907 abstract | "observation of ν̄e appearance in a 2 GeV ν̄μ beam at a distance of 810 km" | VERIFIED |
| DUNE 1300 km | 1300 km | DUNE FD TDR Vol. I, JINST 15, T08008 (2020), arXiv:2002.02967, exec. summary Fig. caption | "the DUNE detectors in Illinois and South Dakota, separated by 1300 km" | VERIFIED |

## 7. Earth surface heat flow

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| 47 ± 2 TW | 47 ± 2 TW | J. H. Davies, D. R. Davies, "Earth's surface heat flux", Solid Earth 1, 5–24 (2010), doi:10.5194/se-1-5-2010, abstract | "Our final preferred estimate is 47±2 TW, which is greater than previous estimates." | VERIFIED |
| 46 ± 3 TW (Jaupart et al., Treatise on Geophysics 2015) | primary chapter not accessed | — | — | UNVERIFIED (Borexino 2020, Table of heat-flow estimates, lists "Jaupart et al. (2007) 46 ± 3" — secondary citation only) |

Note: page range is 5–24 (the "Solid Earth 1, 5" citation is correct).

## 8. Geoneutrinos

### Borexino 2020
Source: Borexino Collab. (M. Agostini et al.), "Comprehensive geoneutrino analysis with Borexino", Phys. Rev. D 101, 012009 (2020), arXiv:1909.02257v2. 3262.74 d, exposure (1.29 ± 0.05)×10³² p·yr.

| Claim | Verified | Location | Quote | Status |
|---|---|---|---|---|
| Geoneutrino events | 52.6 (+9.4 −8.6 stat) (+2.7 −2.1 sys) | abstract | "By observing 52.6^{+9.4}_{−8.6}(stat)^{+2.7}_{−2.1}(sys) geoneutrinos (68% interval) from 238U and 232Th" | VERIFIED |
| Signal | 47.0 (+8.4 −7.7 stat) (+2.4 −1.9 sys) TNU; precision +18.3/−17.2 % | abstract; results-summary table | "a signal of 47.0^{+8.4}_{−7.7}(stat)^{+2.4}_{−1.9}(sys) TNU with ^{+18.3}_{−17.2}% total precision" | VERIFIED |
| Mantle null hypothesis | rejected at 99.0 % CL = 2.3σ (p = 9.796×10⁻³) | abstract; Sec. on mantle signal | "the null-hypothesis of the mantle signal can be rejected with 99.0% C.L. (corresponding to 2.3σ significance)" | VERIFIED |
| Mantle signal | 21.2 (+9.5/+9.6 −9.0 stat) (+1.1 −0.9 sys) TNU | abstract | — | VERIFIED, but note: TeX abstract has +9.5, arXiv-listing abstract has +9.6; use "21.2 ^{+9.6}_{−9.0}" only after checking the journal version |
| Mantle radiogenic heat (U+Th) | 24.6 (+11.1 −10.4) TW | abstract | "corresponds to the production of a radiogenic heat of 24.6^{+11.1}_{−10.4} TW (68% interval) from 238U and 232Th in the mantle" | VERIFIED |
| Total Earth radiogenic heat | 38.2 (+13.6 −12.7) TW (assumes 18 % ⁴⁰K in mantle, lithosphere 8.1 (+1.9 −1.4) TW); Urey ratio 0.78 (+0.41 −0.28) | abstract | "the Borexino estimate of the total Earth radiogenic heat is 38.2^{+13.6}_{−12.7} TW" | VERIFIED |

### KamLAND 2022
Source: KamLAND Collab. (S. Abe et al.), "Abundances of uranium and thorium elements in Earth estimated by geoneutrino spectroscopy",
Geophys. Res. Lett. 49, e2022GL099566 (2022), arXiv:2205.14934v2 (TeX `GeoNeutrino.tex`). Live time 5227 d (2002-03-09 to 2020-12-31).

| Claim | Verified | Quote | Status |
|---|---|---|---|
| Geoneutrino events (Th/U free) | 174 (+31 −29); U: 117 (+41 −39), Th: 58 (+25 −24) | "we obtained 174^{+31}_{−29} geoneutrinos in total" | VERIFIED |
| Events with Th/U = 3.9 | 183 (+29 −28) | "the total number of geoneutrinos is constrained to 183^{+29}_{−28}" | VERIFIED |
| Flux | 3.4 ± 0.5 × 10⁶ cm⁻² s⁻¹ (U+Th, at Earth's surface) | "corresponds to a ν̄e flux of 3.4^{+0.5}_{−0.5} × 10^6 cm^−2 s^−1 from 238U and 232Th" | VERIFIED |
| Significance | null hypothesis disfavored at 8.5σ; no-U at 3.3σ | "The null hypothesis is disfavored at 8.5σ C.L." | VERIFIED |
| Radiogenic heat | Q(U+Th) = 15.4 (+8.3 −7.9) TW (Th/U free); 10.6 (+5.2 −4.2) TW (Th/U = 3.9); total incl. ⁴⁰K ≈ 14.6 TW | "we obtain a radiogenic heat of Q^U + Q^Th = 15.4^{+8.3}_{−7.9} TW for the case with Th/U left free" | VERIFIED |
| Model tests | High-Q disfavored at 99.76 % CL; fully radiogenic excluded at 5.2σ (homogeneous mantle) | abstract | VERIFIED |

## 9. Outer-core density deficit

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| Core 5–10 % less dense than pure iron | "between 5 and 10%" (density deficit w.r.t. pure iron) | J. Badro, A. S. Côté, J. P. Brodholt, PNAS 111, 7542–7545 (2014), doi:10.1073/pnas.1316708111, introduction (open access, PMC4040578); their ref. 4 = D. L. Anderson, Int. Geol. Rev. 44, 97 (2002) | "constrained the core's density deficit (with respect to pure iron) to be between 5 and 10%" | VERIFIED |
| Outer core ~8 % lighter than liquid iron | ~8 % | Y. Zhang et al., "Experimental constraints on light elements in the Earth's outer core", Sci. Rep. 6, 22473 (2016), abstract | "Its density, however, is ~8% lower than that of liquid iron" | VERIFIED |
| Hirose, Labrosse & Hernlund 2013 percentage | metadata verified (Annu. Rev. Earth Planet. Sci. 41, 657–691, 2013); abstract contains no percentage; body not accessed | Crossref | — | UNVERIFIED (for the percentage) |
| Birch 1964 | not accessed | — | — | UNVERIFIED |

## 10. Oscillation tomography of the core composition

### Rott, Taketa & Bose 2015
Source: C. Rott, A. Taketa, D. Bose, "Spectrometry of the Earth using Neutrino Oscillations", Sci. Rep. 5, 15225 (2015), arXiv:1502.04930v1 (TeX `main.tex`).

| Claim | Verified | Quote | Status |
|---|---|---|---|
| Z/A convention for pure iron | Z/A(Fe) = 0.4656 (= 26/55.845 = 0.46557, derived with CIAAW Fe = 55.845); Fe + 5 wt% Ni → 0.4661 | "The Z/A ratios of iron, lead, mantle (pyrolite), and water are 0.4656, 0.3958, 0.4957, and 0.5556, respectively." | VERIFIED (paper uses "Z/A", not "Y_e") |
| Benchmark detector | ΔE/E = 20 %, Δθ = 0.25/√(E/GeV) | "We choose α = 0.20 and β=0.25 for our default benchmark detector" | VERIFIED |
| 10 Mton·yr | first confirmation of iron-like core; Pb or water cores rejected > 99 % | "With an acquired dataset of 10 megaton-years, a neutrino detector could for the first time confirm an iron-like core" | VERIFIED |
| 1 Gton·yr | discriminate established outer-core models; H content to 0.4 wt% | "the hydrogen content of the outer core could be measured with a precision of 0.4 wt%" (for a 1,000 Mton-yr dataset) | VERIFIED |

### KM3NeT/ORCA and next-generation studies

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| ORCA, 10 yr: outer-core electron density 7–10 % | mantle 3–5 %, outer core 7–10 % (depends on ordering), preliminary full MC | S. Bourret, J. A. B. Coelho, V. Van Elewyck (KM3NeT), J. Phys. Conf. Ser. 888, 012114 (2017) (Neutrino 2016), arXiv:1702.03723, abstract | "after ten years of operation the electron density can be measured with a precision of 3-5% in the mantle and 7-10% in the outer core" | VERIFIED |
| ORCA/DUNE/HK, 20 yr: Z/A of outer core | ORCA and DUNE: σ(Z/A) = 0.016 abs. (1σ), i.e. 3–4 % rel.; HK 2.5 %; 1 wt% H in FeNi detectable at 1σ only after 50 yr combined | L. Maderer, E. Kaminski, J. A. B. Coelho, S. Bourret, V. Van Elewyck, Front. Earth Sci. 11, 1008396 (2023), arXiv:2208.00532, Sec. on upcoming detectors | "ORCA and DUNE reach a similar precision of 0.016 (at 1σ C.L.) on the absolute Z/A measurement after 20 years of data taking" | VERIFIED |
| Same paper, Z/A of FeNi | FeNi (95 Fe, 5 Ni wt%) Z/A = 0.4661; FeNiH (1 wt% H) 0.4714 | Table of outer-core models | VERIFIED |
| ORCA density (Capozzi & Petcov) | OC density at 3σ after 10 yr: −18 %/+15 % (most favourable NO case) | F. Capozzi, S. T. Petcov, arXiv:2111.13048 (journal version not checked), abstract | VERIFIED (arXiv) |

## 11. Earth-matter enhancement for core-crossing neutrinos

| Claim | Verified | Status |
|---|---|---|
| Akhmedov, "parametric resonance" | E. Kh. Akhmedov, "Parametric resonance of neutrino oscillations and passage of solar and atmospheric neutrinos through the earth", Nucl. Phys. B 538, 25–51 (1999), arXiv:hep-ph/9805272 (submitted 1998-05-10) | VERIFIED |
| Petcov, "neutrino oscillation length resonance" | S. T. Petcov, **"Diffractive-like (or parametric-resonance-like?) enhancement of the Earth (day-night) effect for solar neutrinos crossing the Earth core"**, Phys. Lett. B 434, 321–332 (1998), arXiv:hep-ph/9805262 (submitted 1998-05-08). "Neutrino oscillation length resonance" is a phrase from the abstract, not the title. | CORRECTED (title) |

Petcov quote (abstract): "thus the resonance is a ``neutrino oscillation length resonance''".
Akhmedov quote (abstract): "Atmospheric neutrinos can undergo parametrically enhanced oscillations in the earth when their trajectories deviate from the vertical by about 26°–32°."

## 12. Astronomical unit

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| 1 au = 149 597 870.7 km exactly | 149 597 870 700 m exactly | IAU XXVIII General Assembly (Beijing 2012), Resolution B2 "on the re-definition of the astronomical unit of length", English text (IAU archive PDF IAU2012_English.pdf) | "that the astronomical unit be re-defined to be a conventional unit of length equal to 149 597 870 700 m exactly" | VERIFIED |

## 13. Super-Kamiokande day–night asymmetry

Source: Super-Kamiokande Collab. (K. Abe et al.), "Solar neutrino measurements using the full data period of Super-Kamiokande-IV",
Phys. Rev. D 109, 092001 (2024), arXiv:2312.12907v2 (TeX `main.tex`). SK-I–IV, 5805 d.

| Claim | Verified | Quote | Status |
|---|---|---|---|
| A_DN = −0.0286 ± 0.0085 (stat) ± 0.0032 (syst) | exactly this, SK-I–IV amplitude fit, 3.2σ from zero; computed at Δm²₂₁ = 6.1×10⁻⁵ eV² | "A^{SK, fit}_{D/N} = −0.0286 ± 0.0085 (stat.) ± 0.0032 (syst.)" ... "This is a 3.2σ direct evidence for the existence of earth matter effects" | VERIFIED |
| Definition | A_DN = (Φ_day − Φ_night) / [½(Φ_day + Φ_night)] (⁸B flux) | TeX eq. at line "A_{D/N} = \frac{Φ^{day}−Φ^{night}}{\frac12(Φ^{day}+Φ^{night})}" | VERIFIED |
| Variant | at Δm²₂₁ = 7.5×10⁻⁵ eV²: −0.0274 ± 0.0083 ± 0.0032 (3.1σ), expected −0.0172 | "the combined SK day/night amplitude fit corresponds to a slightly smaller asymmetry" | VERIFIED |

## 14. Mass ordering status (as of 2026-10-14)

| Statement | Source | Quote | Status |
|---|---|---|---|
| JUNO (207.2 d): NO favoured at ≥ 2.1σ (one-sided) when LBL Δm²₃₁ constraints added; Bayes factor 10.18 for NO | JUNO Collab., "Measurement of Neutrino Oscillation Parameters at JUNO and Indication of the Neutrino Mass Ordering", arXiv:2609.37895v1 (29 Sep 2026; preprint) | "favored normal ordering over inverted ordering, with a one-sided significance of at least 2.1σ across all possible CP-violating phases" | VERIFIED (preprint) |
| JUNO (207.2 d) parameters | Δm²₃₁ = +2.509 (+0.027 −0.025)×10⁻³ eV² (NO); sin²θ₁₂ = 0.3036 ± 0.0064; Δm²₂₁ = (7.388 ± 0.078)×10⁻⁵ eV² | same abstract | VERIFIED |
| JUNO first result (59.1 d) | sin²θ₁₂ = 0.3092 ± 0.0087, Δm²₂₁ = (7.50 ± 0.12)×10⁻⁵ eV² (NO) | arXiv:2511.14593 abstract | VERIFIED |
| NuFIT 6.1 (data to Nov 2025, incl. JUNO 59.1 d) | IO disfavoured by Δχ² = 1.5 (IC23 w/o SK-atm) and Δχ² = 5.9 (IC24 with SK-atm) | NuFIT 6.1 parameter table v61.tbl-parameters.pdf, www.nu-fit.org (cite with JHEP 12 (2024) 216, arXiv:2410.05380) | table header "Inverted Ordering (∆χ2 = 1.5)" / "Inverted Ordering (∆χ2 = 5.9)" | VERIFIED |
| NuFIT 6.0 (Sep 2024) | NO preferred Δχ² = 6.1 only with SK-atm table | arXiv:2410.05380 abstract | VERIFIED |
| Esteban et al. 2026 (with JUNO public data) | NO preferred Δχ² = 4.6 / 9.4 without / with SK and IC24 atm; IO p-value 2–2.6 % (2.2–2.3σ) | JHEP 04 (2026) 089, arXiv:2601.09791 | VERIFIED |
| ≥ 5σ established? | **No.** No primary source read claims ≥ 5σ. | — | Safe wording: "not yet established; current data prefer normal ordering at the ~2–3σ level (JUNO ≥2.1σ; global fits Δχ² ≈ 6–9)" |

## 15. KamLAND 2002 first result

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| Observed/expected | 0.611 ± 0.085 (stat) ± 0.041 (syst), E_ν̄ > 3.4 MeV; 162 t·yr (145.1 d); 99.95 % CL | KamLAND Collab., "First Results from KamLAND: Evidence for Reactor Anti-Neutrino Disappearance", PRL 90, 021802 (2003), hep-ex/0212021, abstract | "the ratio of the number of observed inverse β-decay events to the expected number of events without disappearance is 0.611±0.085 (stat)±0.041 (syst)" | VERIFIED |

Note: arXiv posting Dec 2002, journal year 2003.

## 16. SSM electron density at the solar centre (BS05(OP))

Source: J. N. Bahcall, A. M. Serenelli, S. Basu, ApJ 621, L85 (2005), astro-ph/0412440; data files at
sns.ias.edu/~jnb/SNdata/Export/BS2005/: `nele_bs05op.dat` ("BS05(OP) Electron Density") and `bs2005opflux.dat`
(columns: r/R☉, T, log10(n_e/N_A) [cm⁻³/N_A], …, fraction of ⁸B ν produced in zone).

| Claim | Value | Status |
|---|---|---|
| Central log10(n_e/N_A) | 2.0125 (first tabulated point, r = 0.0016 R☉: 2.012519) | VERIFIED (data file) |
| Central n_e/N_A | 102.9 cm⁻³ (mol cm⁻³) | Derived |
| Central n_e | 6.20 × 10²⁵ cm⁻³ (using N_A = 6.022 140 76 × 10²³ mol⁻¹, exact, NIST/CODATA) | Derived |
| ⁸B production region | peak at r ≈ 0.044 R☉, median 0.049 R☉, mean 0.051 R☉ | Derived from `bs2005opflux.dat` column 7 |
| n_e at ⁸B production | log10(n_e/N_A) = 1.97 at peak → n_e ≈ 5.6 × 10²⁵ cm⁻³; ⁸B-weighted mean n_e/N_A = 89.6 → 5.4 × 10²⁵ cm⁻³ | Derived |
| (pp for comparison) | peak r ≈ 0.098 R☉, mean 0.117 R☉; ⟨n_e⟩/N_A ≈ 62 | Derived |
| B16 data release values | not accessed | UNVERIFIED |

## 17. CIAAW standard atomic weights (2024)

Source: CIAAW, "Abridged Standard Atomic Weights 2024" (www.ciaaw.org/abridged-atomic-weights.htm) and
"Standard Atomic Weights 2024" (www.ciaaw.org/atomic-weights.htm). Page quote: "Abridged standard atomic weights are quoted to five significant figures unless such precision cannot be attained".

| Element | Abridged (2024) | Full standard atomic weight (2024) | Status |
|---|---|---|---|
| H | 1.0080 ± 0.0002 | [1.007 84, 1.008 11] | VERIFIED |
| C | 12.011 ± 0.002 | [12.0096, 12.0116] | VERIFIED |
| O | 15.999 ± 0.001 | [15.999 03, 15.999 77] | VERIFIED |
| Mg | 24.305 ± 0.002 | [24.304, 24.307] | VERIFIED |
| Si | 28.085 ± 0.001 | [28.084, 28.086] | VERIFIED |
| S | 32.06 ± 0.02 | [32.059, 32.076] | VERIFIED |
| Fe | 55.845 ± 0.002 | 55.845(2) | VERIFIED |
| Ni | 58.693 ± 0.001 | 58.6934(4) | VERIFIED |

Separate CIAAW "conventional values" page not accessed; the abridged values above are the CIAAW-recommended single values.

## 18. Geoneutrino kinematics

| Claim | Verified | Source | Quote | Status |
|---|---|---|---|---|
| IBD threshold 1.806 MeV | 1.806 MeV | Borexino, PRD 101, 012009 (2020), Sec. on IBD | "the IBD interaction has a kinematic threshold of 1.806 MeV" | VERIFIED |
| Derivation | E_th = [(m_n + m_e)² − m_p²] / (2 m_p) = 1.806 07 MeV, with CODATA 2022 (NIST): m_n c² = 939.565 421 94 MeV, m_p c² = 938.272 089 43 MeV, m_e c² = 0.510 998 950 69 MeV | NIST CODATA 2022 | — | Derived |
| U-chain max E_ν̄ (²¹⁴Bi) | 3.27 MeV (KamLAND: effective end-point 3.272 MeV) | Borexino 2020 (geoneutrino spectra section); KamLAND GRL 2022 | "the 238U and 232Th antineutrino maximal energies are 3.27 MeV and 2.25 MeV, produced from 214Bi and 212Bi, respectively" | VERIFIED |
| Th-chain max E_ν̄ (²¹²Bi) | 2.25 MeV (KamLAND: 2.254 MeV) | same; KamLAND: "effective end-point of 3.272 MeV and 2.254 MeV in neutrino energy, respectively" | VERIFIED |
| Above-threshold yield | 0.38 (U) and 0.15 (Th) ν̄ per decay above threshold; ⁴⁰K and ²³⁵U below threshold | Borexino 2020 | "0.38 and 0.15 antineutrinos per one decay are above this threshold for 238U and 232Th" | VERIFIED |
| NNDC/ENSDF Q_β values for ²¹⁴Bi, ²¹²Bi | nuclear-data tables not accessed (IAEA LiveChart behind a browser check) | — | — | UNVERIFIED (direct nuclear-data value) |

---

## Items not verified

- Homestake: which SSM value Cleveland et al. (1998) themselves compare to (body not read); use BP98/BP2000 values above instead.
- Vogel & Beacom: numerical neutron lifetime (not stated); PRD equation number (arXiv v1 Eq. 11 only).
- Jaupart et al. (Treatise on Geophysics, 2015) 46 ± 3 TW: primary not accessed.
- Hirose, Labrosse & Hernlund (2013) and Birch (1964) density-deficit percentages: not accessed; use Badro et al. 2014 (5–10 %) or Zhang et al. 2016 (~8 %).
- B16 SSM electron-density data release (only BS05(OP) checked).
- NNDC/ENSDF ²¹⁴Bi and ²¹²Bi Q-values (geoneutrino papers quoted instead).
- Borexino mantle-signal upper stat error: +9.5 (TeX) vs +9.6 (arXiv-listing abstract); check the journal version.
- JUNO 2026 result (arXiv:2609.37895) is a preprint; journal version not available.
