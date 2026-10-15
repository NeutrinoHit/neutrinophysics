# SOURCES-check-2 — school mini-course on neutrino oscillations, new slides

Checked 2026-10-14. Continues SOURCES-check.md; items already covered there are not repeated
(IBD threshold 1.806 MeV, ²¹⁴Bi/²¹²Bi end-points 3.27/2.25 MeV, 0.38/0.15 ν̄ per decay above threshold,
Borexino 2020 / KamLAND 2022 measured signals, 47 ± 2 TW heat flow, DUNE 1300 km, T2K 295 km).
Every value below was read on 2026-10-14 from the primary source named (arXiv TeX source or PDF,
arXiv API metadata, Crossref, INSPIRE, NNDC NuDat 3, collaboration web page, scan of the PREM paper).
"Derived" means arithmetic on verified inputs, shown explicitly.
Status: VERIFIED / CORRECTED / UNVERIFIED. Quotes are verbatim (LaTeX lightly simplified).
"Table N (TeX order)" means the N-th table environment in the arXiv source; numbering in the
journal version was not checked unless stated.

---

## A. Geoneutrinos

### A1. Which β decays give ν̄e above the IBD threshold

Source: G. Fiorentini, M. Lissia, F. Mantovani, "Geo-neutrinos and Earth's interior",
Phys. Rep. 453, 117–172 (2007), doi:10.1016/j.physrep.2007.09.001, arXiv:0707.3203v2 (TeX `review83.tex`).
Cross-check: Borexino Collab. (M. Agostini et al.), Phys. Rev. D 101, 012009 (2020), arXiv:1909.02257v2, Sec. on geoneutrino spectra.
Q-values: NNDC NuDat 3 decay-radiation search (ENSDF), www.nndc.bnl.gov/nudat3.

| Claim on slide | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| U chain: ²³⁴ᵐPa and ²¹⁴Bi give the detectable ν̄ | ²³⁴ᵐPa (E_max 2268.92 keV, 1 effective transition) and ²¹⁴Bi (E_max 3272 keV, 4 effective transitions); ²¹⁰Tl also above threshold but negligible (branching 0.0002) | Fiorentini et al., Table II (TeX order; label `tab:uBetaNuclei`) and text after it | "Only three nuclides (234Pa, 214Bi, 210Tl) yield antineutrinos with energy larger than 1.806 MeV and contribute to the geo-neutrino signal." | VERIFIED |
| Th chain: ²²⁸Ac and ²¹²Bi | ²²⁸Ac (E_max 2069.24 keV, 2 effective transitions) and ²¹²Bi (E_max 2254 keV, 1 effective transition); ²⁰⁸Tl 1803.26 keV is just below | Fiorentini et al., Table IV (TeX order; `tab:thBetaNuclei`) and text | "Only two nuclides (228Ac and 212Bi) yield antineutrinos with energy larger than 1.806 MeV." | VERIFIED |
| Same four nuclides (independent statement) | ²³⁴ᵐPa, ²¹⁴Bi (U); ²²⁸Ac, ²¹²Bi (Th) | Borexino 2020, geoneutrino-spectrum paragraph | "The effective transitions producing detectable antineutrinos are given by 234mPa and 214Bi in 238U decay chain and 228Ac and 212Bi in the 232Th decay chain." | VERIFIED |
| ⁴⁰K ν̄ below threshold; E_max = 1.311 MeV | E_max = 1.311 MeV (β⁻ branch 89 %); ⁴⁰K and ²³⁵U ν̄ undetectable by IBD | Fiorentini et al., Table I (`tab:propertiesIsotopes`) and Sec. on ⁴⁰K | "We remind that the antineutrinos from 40K (E_max = 1.311 MeV) are below the threshold for inverse beta on free protons." | VERIFIED |
| ⁴⁰K β⁻ end-point (nuclear data) | 1310.89(6) keV, β⁻ intensity 89.27(17) %, T½ = 1.248(3)×10⁹ y | NNDC NuDat 3, ⁴⁰K, ENSDF J. Chen, Nucl. Data Sheets 140, 1 (2017) | "End-point energy (keV) ... 1310.89 6 ... 89.27 % 17" | VERIFIED |
| ²¹⁴Bi Q_β⁻ | 3269(11) keV (β⁻ 99.979 %) | NNDC NuDat 3, ENSDF S. Zhu, E. A. McCutchan, Nucl. Data Sheets 175, 1 (2021) | "β - : 99.9790 13 % 3269 11" | VERIFIED |
| ²¹²Bi Q_β⁻ | 2251.5(17) keV (β⁻ 64.06 %) | NNDC NuDat 3, ENSDF K. Auranen, E. A. McCutchan, Nucl. Data Sheets 168, 117 (2020) | "β - : 64.06 6 % 2251.5 17" | VERIFIED |
| ²³⁴ᵐPa | isomer at 73.92+X keV, T½ = 1.159 min, β⁻ 99.84 %; GS–GS Q_β⁻ = 2195(4) keV (end-point from the isomer ≈ Q + 73.92 keV ≈ 2269 keV, derived; matches Fiorentini's 2268.92 keV) | NNDC NuDat 3, ENSDF E. Browne, J. K. Tuli, Nucl. Data Sheets 108, 681 (2007) | "73.92+X (0-) 1.159 m 11 β - : 99.84 4 % 2195 4" | VERIFIED (Q); end-point derived |
| ²²⁸Ac | T½ = 6.15 h, GS–GS Q_β⁻ = 2134(3) keV; highest end-point used for geo-ν̄: 2069.24 keV (Fiorentini) | NNDC NuDat 3, ENSDF K. Abusaleem, Nucl. Data Sheets 116, 163 (2014) | "228 89 Ac 0 3+ 6.15 h 2 β - : 100 % 2134 3" | VERIFIED |

Note: the item "NNDC/ENSDF Q-values for ²¹⁴Bi, ²¹²Bi" listed as UNVERIFIED in SOURCES-check.md §18 is now verified (above).
On a slide, say "end-point" for the E_max of the ν̄ spectrum; the GS–GS Q-value is not always the maximal ν̄ energy (²²⁸Ac, ²³⁴ᵐPa).

### A2. Chondritic Th/U mass ratio 3.9

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| Th/U = 3.9 (chondritic, CI) used in the Borexino fit | 3.9 (mass ratio) → signal ratio R_s = S(Th)/S(U) = 0.27 | Borexino 2020, arXiv:1909.02257v2, abstract and Sec. on expected signal (eq. `eq:RS`) | "Adopting the CI chondrites a(Th)/a(U) = 3.9 for the bulk Earth, we get R_s = 0.27." | VERIFIED |
| Same in Borexino conclusions | 3.9 | Borexino 2020, Conclusions | "This result assumes a Th/U mass ratio of 3.9, as found in chondritic CI meteorites" | VERIFIED |
| Refined planetary value | M_Th/M_U = 3.876 ± 0.016 (Blichert-Toft et al., EPSL 300, 2010, as cited); 3.90 (+0.13 −0.08) (Wipperfurth et al., as cited) | Borexino 2020, Sec. on BSE models | "has been refined to a value of M_Th/M_U = (3.876 ± 0.016)" | VERIFIED (as quoted by Borexino; originals not read) |
| Fiorentini et al. reference value | Th/U = 3.9 (mass), a_BSE(U) = 2×10⁻⁸, K/U = 1.14×10⁴ | Fiorentini et al. 2007, Sec. on BSE | "for the ratio of elemental abundances Th/U ≡ a_BSE(Th)/a_BSE(U) = 3.9" | VERIFIED |
| JUNO uses the same | 3.9 → signal ratio 0.27 | JUNO Yellow Book (A6 source), Sec. 8 "JUNO potential in measuring geoneutrinos" | "the fixed chondritic mass Th/U ratio of 3.9" | VERIFIED |
| KamLAND 2022 | fit with Th/U = 3.9 (already in SOURCES-check.md §8) | — | — | VERIFIED earlier |

### A3. Radiogenic heat and ν̄ luminosity per unit mass

Source 1: S. T. Dye, "Geo-neutrinos and the Radioactive Power of the Earth", Rev. Geophys. 50, RG3007 (2012),
doi:10.1029/2012RG000400, arXiv:1111.6099v3 (PDF), **Table 3** "Element Specific Heat Generation and Antineutrino Luminosity per Unit Mass" and Table 2.

| Element (natural composition) | h (µW/kg) | l (kg⁻¹ µs⁻¹) | l (kg⁻¹ s⁻¹), derived | Status |
|---|---|---|---|---|
| U | 98.5 | 76.4 | 7.64×10⁷ | VERIFIED |
| Th | 26.3 | 16.2 | 1.62×10⁷ | VERIFIED |
| K | 3.33×10⁻³ | 27.1×10⁻³ | 2.71×10⁴ | VERIFIED |

Per isotope (Dye Table 2): ²³⁸U 95.13, ²³⁵U 568.47, ²³²Th 26.28, ⁴⁰K 28.47 µW/kg — VERIFIED.

Source 2 (cross-check): Fiorentini et al. 2007, **Table I** (`tab:propertiesIsotopes`), per kg of natural element:
²³⁸U chain ε′_H = 0.94×10⁻⁴ W/kg, ²³²Th 0.27×10⁻⁴ W/kg, ²³⁵U 0.40×10⁻⁵ W/kg; ⁴⁰K: 2.55×10⁻⁹ (β⁻) + 0.78×10⁻⁹ (EC) W/kg.
Derived: natural U = 0.94×10⁻⁴ + 0.040×10⁻⁴ = 0.98×10⁻⁴ W/kg = 98 µW/kg; natural K = 3.33×10⁻³ µW/kg — consistent with Dye.
ν̄ luminosity per kg natural element: ²³⁸U 7.41×10⁷ s⁻¹, ²³²Th 1.62×10⁷ s⁻¹, ⁴⁰K 2.71×10⁴ s⁻¹ — VERIFIED.

Borexino 2020 (Table II, TeX order, `tab:BSE` caption) uses the same numbers: "h(U) = 98.5 µW/kg, h(Th) = 26.3 µW/kg, and h(K) = 3.33 × 10⁻³ µW/kg" — VERIFIED (Borexino attributes them to Mantovani et al., PRD 69, 013001 (2004); that paper was not read).

Whole-Earth BSE (Fiorentini et al., Table VIII, TeX order, `tab:UthKbse`): U 8.0, Th 8.7, ⁴⁰K 3.6 (10¹² W; the TeX unit label is misprinted "[10¹² 2]"); L_ν̄ = 6.2, 5.3, 26.5 ×10²⁴ s⁻¹; "Its prediction for the present radiogenic production is 19 TW." — VERIFIED.

Slide suggestion: "1 kg of U: ≈ 0.1 mW and ≈ 7.6×10⁷ ν̄/s; 1 kg of Th: ≈ 0.026 mW and ≈ 1.6×10⁷ ν̄/s" (rounded, derived from Dye Table 3).

### A4. Bulk Silicate Earth model classes

Source: O. Šrámek, W. F. McDonough, E. S. Kite, V. Lekić, S. T. Dye, S. Zhong, "Geophysical and geochemical constraints
on geoneutrino fluxes from Earth's mantle", Earth Planet. Sci. Lett. 361, 356–366 (2013), doi:10.1016/j.epsl.2012.11.001
(Crossref), arXiv:1207.0853v2 (TeX `arXiv2-Manuscript-rev1.tex`), Sec. 3 "HPE abundances in BSE and the crust" and **Table 2** (TeX order, `tab:abund`).

| Model class | BSE radiogenic power | Basis (paper) | Status |
|---|---|---|---|
| Cosmochemical | 11 ± 2 TW (U 12 ± 2 ppb, Th 43 ± 4 ppb) | enstatite chondrites (Javoy et al. 2010) | VERIFIED |
| Geochemical | 20 ± 4 TW (U 20 ± 4 ppb, Th 80 ± 13 ppb) | CI-chondrite ratios + terrestrial samples (McDonough & Sun 1995; Arevalo et al. 2009) | VERIFIED |
| Geodynamical | 33 ± 3 TW (U 35 ± 4 ppb, Th 140 ± 14 ppb) | mantle-convection energetics (Turcotte & Schubert 2002), scaled to mantle Urey ratio 0.6–0.8 | VERIFIED |
| Mantle Urey ratio | 0.08 ± 0.05 / 0.3 ± 0.1 / 0.7 ± 0.1 | Table 2 | VERIFIED |

Quote: "The rates of radiogenic heat production are 11±2 TW, 20±4 TW and 33±3 TW for the cosmochemical, geochemical and geodynamical estimates, respectively."

Borexino 2020, Table II (TeX order, `tab:BSE`), same classes recomputed with h-values of A3:
CC 11.3 ± 1.6 TW, GC 20.2 ± 3.8 TW, GD 33.5 ± 3.6 TW, Fully Radiogenic 47 ± 2 TW — VERIFIED.
Quote: "The Cosmochemical (CC) model is characterized by a relatively low amount of U and Th producing a total H_rad = (11 ± 2) TW."

KamLAND 2022 (GRL 49, e2022GL099566, arXiv:2205.14934v2) uses the names Low-Q / Middle-Q / High-Q:
"Low-Q (10-15 TW), Middle-Q (17-22 TW), and High-Q models (> 25 TW)" — VERIFIED.

Dye 2012, Table 7 (BSE / primitive mantle): Cosmochemical 11–21 TW, Geophysical 19–38 TW, Chondritic (CI) 13 TW — VERIFIED (older two-class scheme; prefer Šrámek et al. on the slide).

### A5. Radiogenic power of the continental crust

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| Continental crust ≈ 7 TW (Huang et al. 2013) | **6.8 (+1.4 −1.1) TW** (U+Th+K); bulk crust (CC+OC) 7.0 (+1.4 −1.1) TW; lithosphere (crust + CLM) 8.1 (+1.9 −1.4) TW | Y. Huang, V. Chubakov, F. Mantovani, R. L. Rudnick, W. F. McDonough, "A reference Earth model for the heat-producing elements and associated geoneutrino flux", Geochem. Geophys. Geosyst. 14(6), 2003–2029 (2013), doi:10.1002/ggge.20129 (Crossref), arXiv:1301.0365v2 (PDF), Conclusions item 2 and Table 3 | "has Th/U = 4.3 ... K/U = 11,621 ... and produces 6.8 [+1.4 −1.1] TW of heat" (asymmetric errors are typeset as super/subscripts; PDF text extraction garbles them) | VERIFIED |
| Same numbers, independent table | CC 6.8 (+1.4 −1.1) TW, OC 0.2 ± 0.1, CLM 0.8 (+1.1 −0.6), lithosphere 8.1 (+1.9 −1.4) TW | Borexino 2020, Table V (TeX order, `tab:MH_litho`) | "Continental crust (CC) & 20.6 ± 2.5 & ... & 6.8^{+1.4}_{-1.1}" | VERIFIED |
| Alternative estimate | CC 7.8 ± 0.9 TW, OC 0.22 ± 0.03 TW (Rudnick & Gao crust) | Šrámek et al. 2013, Sec. 3 and Table 2 | "the continental crust (CC) generates 7.8±0.9 TW of radiogenic power, whereas the oceanic crust (OC) only gives off 0.22±0.03 TW" | VERIFIED |
| Dye 2012 | bulk crust 8.1 ± 0.8 TW | Dye 2012, Table 5 | — | VERIFIED |

Recommendation: "continental crust ≈ 7 TW (6.8 +1.4/−1.1 TW, Huang et al. 2013)".

### A6. JUNO expected geoneutrino signal

Source: JUNO Collab. (F. An et al.), "Neutrino Physics with JUNO", J. Phys. G 43, 030401 (2016),
doi:10.1088/0954-3899/43/3/030401, arXiv:1507.05613v2, **Sec. 8 "Geoneutrinos"** (TeX `Geoneutrino/main.tex`); signal model from Strati et al. (cited as Strati:2014kaa).

| Claim | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| ~400 geo-ν̄ events per year | 408 ± 60 events/yr (U 311 ± 55, Th 92 ± 37), for 80 % efficiency, 17.2 m radial cut (18.35 kt LS, 12.85×10³² protons), prompt 0.7–12 MeV | Sec. 8.7, Table `tab:geo:Nev` | "Geoneutrinos & 408 ± 60" | VERIFIED |
| Same, in words | 300–500 per year | Sec. 8 Conclusions | "allows for the recording of 300 to 500 geoneutrino interactions per year" | VERIFIED |
| Abstract | ~400 per year | abstract | "Geo-neutrinos can be detected in JUNO with a rate of ~400 events per year" | VERIFIED |
| Total signal in TNU | S_TOT = 39.7 (+6.5 −5.2) TNU (U 30.3, Th 9.0) | Sec. 8.2, Table `tab:geo:GeoJuno` | "The Total predicted geoneutrino signal at JUNO S_TOT = 39.7^{+6.5}_{-5.2} TNU" | VERIFIED |
| Crust / CLM / mantle | bulk crust 28.2 (+5.2 −4.5), CLM 2.1 (+2.9 −1.3), lithosphere 30.9 (+6.5 −5.2), mantle ≈ 9 TNU (DM 4.9 + EM 3.8); mantle range 1–19 TNU depending on BSE model | same table and text | "S_BC = 28.2^{+5.2}_{-4.5} TNU ... and S_CLM = 2.1^{+2.9}_{-1.3} TNU" | VERIFIED |
| Crustal fraction | bulk crust 28.2/39.7 = **71 %**; whole lithosphere 30.9/39.7 = **78 %** | — | — | Derived |
| Local crust | S_LOC = 17.4 (+3.3 −2.8) TNU ≈ 44 % of total, more than the whole mantle; first 550 km give ~50 % | Sec. 8.3 and 8.2 | "This flux contribution corresponds to ~44% of the expected geoneutrino signal at JUNO and exceeds the signal from the whole mantle." | VERIFIED |
| Reactor background in geo window | (351 ± 27) TNU for 1.8 < E < 3.27 MeV (2020 reactor scenario) | Sec. 8.5 | — | VERIFIED |

Note: these are 2015 predictions; a later dedicated JUNO geoneutrino paper was not read.

### A7. Expected U+Th signal at KamLAND / Borexino; definition of TNU

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| 1 TNU definition | 1 event per 10³² target protons per year (100 % efficiency) = 3.17×10⁻⁴⁰ s⁻¹ per target; 10³² free protons ≈ 1 kt of liquid scintillator | Fiorentini et al. 2007, Sec. on detection | "defined as one event per 10^32 target nuclei per year, or 3.17 × 10^-40 s^-1 per target nucleus" | VERIFIED |
| Same (Borexino wording) | — | Borexino 2020, Sec. "Expected antineutrino signal" | "1 TNU corresponds to 1 antineutrino event detected via IBD ... over 1 year by a detector with 100% detection efficiency containing 10^32 free target protons" | VERIFIED |
| Borexino site (LNGS), expected | lithosphere 25.9 (+4.9 −4.1) TNU; total 28.5 (CC) / 34.6 (+5.5 −4.8) (GC) / 45.6 (GD) / 55.3 (FR) TNU | Borexino 2020, Sec. "Total geoneutrino signal at Borexino", Table VI (`tab:S_litho`) | "can cover a wide range from S^CC_tot = 28.5^{+5.5}_{-4.8} TNU to S^GD_tot = 45.6^{+5.6}_{-4.9} TNU passing through S^GC_tot = 34.6^{+5.5}_{-4.8} TNU" | VERIFIED |
| Predictions by site (older reference model) | Kamioka 34.8 ± 5.9, Gran Sasso 40.5 ± 6.5, Sudbury 49.6 ± 7.3, Hawaii 12.5 ± 3.6 TNU (Mantovani et al. 2004); Fogli et al.: Kamioka 31.6 ± 2.5, Gran Sasso 40.5 ± 2.9 TNU; all with ⟨P_ee⟩ = 0.57 | Fiorentini et al. 2007, Table XI (TeX order, `tab:predicRateCompare`) | "Predicted geo-neutrino rate from U+Th at various locations. Rates are in TNU." | VERIFIED |
| KamLAND site, Fiorentini et al. own prediction | S(U+Th) = 32 ± 2 TNU (BSE, chondritic Th/U); 32 (+8 −4) TNU without BSE constraint | Fiorentini et al. 2007, Sec. on KamLAND | "If the chondritic Th/U ratio is assumed, one finds S(U+Th) = (32 ± 2) TNU" | VERIFIED |
| Typical continental vs oceanic crust signal | continental crust ≈ 40 ± 6 TNU; oceanic-crust minimum 3.2 ± 0.4 TNU; Himalaya maximum 52 ± 7 TNU | Dye 2012, section on crustal signal (PDF text) | "A typical geo-neutrino signal from the crust at a continental location is 40 ±6 TNU." | VERIFIED |

---

## B. Detection

### B8. Super-Kamiokande

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| Total water 50 kt | net mass 50 000 t | S. Fukuda et al. (Super-Kamiokande), "The Super-Kamiokande detector", Nucl. Instrum. Meth. A 501, 418–462 (2003), doi:10.1016/S0168-9002(03)00425-X (Crossref); abstract (Elsevier abstract via INSPIRE record 607144) | "Super-Kamiokande is the world's largest water Cherenkov detector, with net mass 50,000 tons." | VERIFIED |
| Fiducial 22.5 kt, ~11 000 inner PMTs | 22.5 kt fiducial; ID 11 146 PMTs (50 cm, Hamamatsu R3600), ~40 % photocathode coverage; OD 1885 PMTs (20 cm); tank 42 m high, 39.3 m diameter | Super-Kamiokande Collab. (Y. Ashie et al.), "A Measurement of Atmospheric Neutrino Oscillation Parameters by Super-Kamiokande I", Phys. Rev. D 71, 112005 (2005), arXiv:hep-ex/0501064v2, Sec. I (introduction) and Sec. II (detector) | "holding a total mass of 50,000 tons of water. The inner detector (ID) is comprised of 11,146 Hamamatsu R3600 50 cm diameter photomultiplier tubes" / "in the 22.5 kiloton water fiducial mass" | VERIFIED (SK-I) |
| NIM paper body (PMT count, fiducial) | body of NIM A 501, 418 not accessed (publisher 403) | — | — | UNVERIFIED in the NIM paper itself; cite PRD 71, 112005 for 22.5 kt and 11 146 |
| Note | Hyper-K Design Report Table (`Table:detectorparameters`) lists SK with 11 129 ID PMTs (later SK phases) | arXiv:1805.04163 | — | Use "≈ 11 000" on the slide |

### B9. μ-like vs e-like rings

Source: Super-K, PRD 71, 112005 (2005), arXiv:hep-ex/0501064v2, Sec. on fully-contained events, particle identification, Figs. `fig:e-like`, `fig:mu-like`.

| Claim | Quote | Status |
|---|---|---|
| e-like rings fuzzy (showers) | "In this event the boundary of the Cherenkov light is smeared over many PMTs as the light comes from numerous positrons and electrons in the electromagnetic shower." (caption, e-like event display) | VERIFIED |
| μ-like rings sharp | "In this event the boundary of the Cherenkov light is sharp as the muon travels relatively straight as it comes to a stop." (caption, μ-like event display) | VERIFIED |
| PID principle | "Cherenkov rings from electromagnetic cascades exhibit a more diffuse light distribution than those from muons." | VERIFIED |
| Showering / non-showering classification | "The neutrino type, νe or νμ is classified by the identification of the main Cherenkov pattern as showering or non-showering respectively." | VERIFIED |

### B10. IBD delayed coincidence: 2.2 MeV γ, ~200 µs

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| n + p → d + γ (2.2 MeV), capture ~200 µs later | 2.2 MeV γ; "~200 µs" | KamLAND 2022, GRL 49, e2022GL099566, arXiv:2205.14934v2, Sec. on detection | "the delayed neutron capture by a proton with the 2.2 MeV γ-ray emission which takes place ~200 μs later than the prompt signal" | VERIFIED |
| KamLAND measured mean capture time | 207.5 ± 2.8 µs; > 99 % captures on free protons | KamLAND Collab. (S. Abe et al.), "Precision Measurement of Neutrino Oscillation Parameters with KamLAND", PRL 100, 221803 (2008), arXiv:0801.4589v3 | "The mean neutron capture time is 207.5 ± 2.8 μs. More than 99% capture on free protons, producing a 2.2 MeV γ ray." | VERIFIED |
| Borexino (pseudocumene) | 2.22 MeV γ; capture time 254.5 ± 1.8 µs (AmBe calibration); 1.1 % captures on ¹²C give 4.95 MeV | Borexino 2020, Sec. on IBD detection | "In Borexino, the neutron capture time was measured with the 241Am-9Be calibration source to be (254.5 ± 1.8) μs" | VERIFIED |
| Prompt energy | E_prompt ≈ E_ν̄ − 0.784 MeV | Borexino 2020, Eq. `eq:Epro` | "E_p ~ E_ν̄e − 0.784 MeV" | VERIFIED |

Slide wording: "≈ 200–250 µs (KamLAND 207.5 µs, Borexino 254.5 µs)". Capture time depends on scintillator H density.

---

## C. Long baselines and matter

### C11. DUNE far detector

Source: DUNE Collab. (B. Abi et al.), "Deep Underground Neutrino Experiment (DUNE), Far Detector Technical Design Report,
Volume I: Introduction to DUNE", JINST 15, T08008 (2020) (Crossref: "Volume I. Introduction to DUNE"), arXiv:2002.02967v3, TeX `vol-exec/*` with macros from `common/defs.tex` (`\larmass` = 17.5 kt, `\fdfiducialmass` = 40 kt, `\nominalmodsize` = 10 kt).

| Claim | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| 4 modules × 17 kt LAr | **4 modules, ≈ 17.5 kt of LAr per cryostat** ("nearly 70 kt" total); each module ≥ 10 kt fiducial | Ch. 1 Executive Summary, Sec. 1.1.4 "Strategy for the DUNE Far Detector Design" and Sec. 1.3.1 "Far Detector" | "The DUNE FD cryostats will hold 17.5 kt of LAr each, for a total of nearly 70 kt, of which at least 40 kt will be encompassed by the four detector modules as fiducial mass." | CORRECTED (17 → 17.5 kt) |
| (same volume, SP chapter) | 17 000 000 kg of LAr per cryostat fill | Ch. 3 "Single-Phase Far Detector Technology", Sec. Installation | "filling the cryostat with 17000000 kg of LAr begins" | VERIFIED — the TDR itself uses both 17 and 17.5 kt; write "≈ 17 kt" or "17.5 kt" |
| ~40 kt fiducial | ≥ 40 kt (4 × ≥ 10 kt) | same | (quote above) | VERIFIED |
| Depth | ≈ 1.5 km underground at SURF | Sec. 1.1.2 | "a massive FD situated 1.5 km underground at the SURF in South Dakota" | VERIFIED |
| Baseline 1300 km | 1300 km (already VERIFIED in SOURCES-check.md §6) | Fig. `fig:lbnf` caption | — | VERIFIED |
| Beam power | 1.2 MW, upgradable; 60–120 GeV protons | Sec. 1.1.2; Ch. 2 Sec. "Beam and Detector" | "will deliver between 1.0 and 1.2 MW of proton beam power" | VERIFIED |
| Energy range of analysis | ν_e/ν_μ selections integrated 0.5–8.0 GeV (Vol. I) / 0.5–10 GeV (EPJC 80, 978); spectrum needed down to ≥ 500 MeV | Vol. I Ch. 2 tables `tab:execsumm-apprates`; text | "mapping out the spectrum of observed oscillations down to energies of at least 500 MeV, is desirable" | VERIFIED |
| Flux "1–5 GeV", peak ~2.5 GeV | not stated in Vol. I or in EPJC 80, 978 text (EPJC mentions only the "falling edge of the focusing peak (~4 GeV)") | — | — | **UNVERIFIED** (would need DUNE TDR Vol. II or LBNF beam paper; read the number off the flux figure only if sourced) |

### C12. Hyper-Kamiokande

Source: Hyper-Kamiokande Proto-Collaboration (K. Abe et al.), "Hyper-Kamiokande Design Report", arXiv:1805.04163v2 (2018; no journal reference on arXiv).

| Claim | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| Fiducial mass 188 kt | **187 kt** per tank (0.187 Mt); total water 258 kt; 40 000 ID PMTs (50 cm), 40 % coverage; tank 74 m Ø × 60 m | Part "Detector design" introduction, table `Table:detectorparameters`; tank overview | "A standard fiducial volume in each tank, defined as the region inside a surface drawn 1.5 m from the ID wall, is 0.187 million tons" | CORRECTED (188 → 187 kt) |
| ~8× SK fiducial | 187/22.5 = 8.3 (derived); DR says two tanks (0.374 Mt) ≈ 17× SK | tank overview | "is about 17 times the fiducial volume of Super-K" | Derived / VERIFIED |
| T2HK baseline 295 km | 295 km (Tochibora mine – J-PARC) | abstract; Summary | "hosted in the Tochibora mine, about 295 km away from the J-PARC proton accelerator research complex in Tokai, Japan" | VERIFIED |
| LBL analyses assume | 187 kt, 10 years, single tank | LBL chapter, "observables" | "assuming ten years of running with a single tank detector with 187 kton fiducial volume" | VERIFIED |

Note: the final as-built Hyper-K parameters (2020s) were not checked; the 2018 Design Report is the source here.

### C13. KM3NeT/ORCA

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| Purpose: mass ordering with atmospheric ν crossing the Earth | ORCA = one building block "densely configured to precisely measure atmospheric neutrino oscillations"; NMH via matter effects for long baselines | S. Adrián-Martínez et al. (KM3NeT Collab.), "Letter of Intent for KM3NeT 2.0", J. Phys. G 43, 084001 (2016), doi:10.1088/0954-3899/43/8/084001, arXiv:1601.07459v2; abstract and ORCA Introduction (TeX `orca/LoI_ORCA_introduction.tex`) | "One building block will be configured to precisely measure atmospheric neutrino oscillations." / "this option requires long oscillation baselines and matter effects" | VERIFIED |
| ~7 Mt instrumented (LoI) | **LoI benchmark: 115 strings × 18 DOMs, 20 m horizontal, 6 m vertical spacing → 3.6×10⁶ m³ ≈ 3.7 Mt** | LoI, ORCA detector section, Fig. `fig:footprint` caption and text | "the detector has a total instrumented volume of about 3.6×10^6 m^3 (equivalent to ~3.7 Mt for sea water)" | CORRECTED (LoI says 3.7 Mt, not 7 Mt) |
| ~7 Mt (final design) | 115 DUs, ~9 m vertical, ~20 m horizontal spacing → ≈ 7×10⁶ m³ ≈ 7 Mt; site off Toulon, ≈ 2500 m depth | KM3NeT Collab., "Measurement of neutrino oscillation parameters with the first six detection units of KM3NeT/ORCA", arXiv:2408.07015v2, Sec. 2.1 (arXiv HTML); KM3NeT web page km3net.org/research/detector/arca-and-orca-detector/ | "The final instrumented volume will be about 7×10^6 m^3." / "In ORCA about 7 Megatonnes of seawater will be instrumented." | VERIFIED (cite arXiv:2408.07015 or the collaboration page, not the LoI) |
| NMH significance claimed in LoI | ≥ 3σ after 3 years | LoI executive summary | "A determination of the neutrino mass hierarchy with at least 3-sigma significance can be made after three years of operation" | VERIFIED (2016 projection) |

Journal reference of arXiv:2408.07015 not checked.

### C14. MSW founding papers

| Claim | Verified | Source | Status |
|---|---|---|---|
| L. Wolfenstein, Phys. Rev. D 17, 2369 (1978) | "Neutrino oscillations in matter", Phys. Rev. D 17(9), 2369–2374, issued 1978-05-01, doi:10.1103/PhysRevD.17.2369 | Crossref; INSPIRE recid 122259 | VERIFIED |
| S. P. Mikheyev & A. Yu. Smirnov, Sov. J. Nucl. Phys. 42, 913 (1985) | "Resonance Amplification of Oscillations in Matter and Spectroscopy of Solar Neutrinos", Sov. J. Nucl. Phys. 42, 913–917 (1985); Russian original Yad. Fiz. 42, 1441–1448 (1985); no DOI | INSPIRE recid 228623 | VERIFIED |

Note: the English title in INSPIRE is "Resonance Amplification ..."; "Resonance enhancement of oscillations in matter and solar neutrino spectroscopy" is the title of the arXiv reprint record. Cite as: S. P. Mikheyev, A. Yu. Smirnov, Yad. Fiz. 42, 1441 (1985) [Sov. J. Nucl. Phys. 42, 913 (1985)].

### C15. Average density along the DUNE beam

| Claim | Verified value | Source / location | Quote | Status |
|---|---|---|---|---|
| ρ̄ ≈ 2.8 g/cm³ Fermilab → SURF | **ρ = 2.848 g cm⁻³, 2 % uncertainty** (Gaussian penalty in the fit) | DUNE Collab. (B. Abi et al.), "Long-baseline neutrino oscillation physics potential of the DUNE experiment", Eur. Phys. J. C 80, 978 (2020), doi:10.1140/epjc/s10052-020-08456-z, arXiv:2006.16043v2, Table 8 (TeX order, label `tab:oscpar_nufit`) | "ρ & 2.848 g cm^-3 & 2%"; caption: "The matter density is taken from Ref. [Roe:2017zdw]." | VERIFIED |
| Underlying calculation | B. Roe, Phys. Rev. D 95, 113004 (2017), arXiv:1707.02322 (densities from CRUST1.0, Shen–Ritzwoller, PEMC) | arXiv abstract | abstract gives no numerical mean | VERIFIED (citation); number from EPJC table |
| Matter potential scale | a = G_F N_e/√2 ≈ 1/(3500 km) × (ρ/3.0 g/cm³) | EPJC 80, 978, overview, after Eq. for P(ν_μ→ν_e) | "a = ± G_F N_e/√2 ≈ ± 1/3500 km (ρ/3.0 g/cm^3)" | VERIFIED |

---

## D. Earth

### D16. PREM reference

| Claim | Verified | Source | Status |
|---|---|---|---|
| A. M. Dziewonski & D. L. Anderson, Phys. Earth Planet. Inter. 25, 297–356 (1981), doi:10.1016/0031-9201(81)90046-7 | title "Preliminary reference Earth model", PEPI 25(4), 297–356, June 1981, authors Adam M. Dziewonski, Don L. Anderson | Crossref; title page of the paper (scan) | VERIFIED |

### D17. PREM radii

Source: the PREM paper itself (scanned copy of the published article, 60 pp.; text read via OCR), Dziewonski & Anderson 1981.

| Claim | Verified value | Location | Quote | Status |
|---|---|---|---|---|
| Earth radius 6371 km | a = 6371 km (surface of the ocean layer 6368.0–6371.0 km) | p. 300, Sec. 3 "Astronomic-geodetic data"; Table I (p. 308) | "Radius of the Earth: 6371 km. Mass: 5.974 × 10^24 kg. I/MR^2: 0.3308." | VERIFIED |
| Core–mantle boundary 3480 km | outer core 1221.5–3480.0 km | Table I, p. 308; text p. 343 "Radius of the core" | "The radius of the outer core in PREM is 3480 km." | VERIFIED |
| Inner-core boundary 1221.5 km | inner core 0–1221.5 km | Table I, p. 308 ("Coefficients of the polynomials describing the Preliminary Reference Earth Model (PREM)") | "Inner core 0— 1221.5 ... Outer core 1221.5— 3480.0" | VERIFIED |
| Depths (derived) | CMB depth 6371 − 3480 = 2891 km; ICB depth 6371 − 1221.5 = 5149.5 km | — | — | Derived |
| Other PREM boundaries (Table I) | lower mantle 3480–5701 km (670 km discontinuity at r = 5701 km), crust from 6346.6 km (Moho depth 24.4 km) | Table I, p. 308 | — | VERIFIED |

Page numbers: PDF page 1 = journal p. 297 (title page); pages 300, 308, 343 checked against printed page headers/offset.

---

## Items not verified

- DUNE beam flux range "1–5 GeV" and flux peak "~2.5 GeV": not stated in DUNE TDR Vol. I or EPJC 80, 978 text (only "falling edge of the focusing peak (~4 GeV)"). Needs TDR Vol. II (arXiv:2002.03005) or the LBNF beam-optimisation paper.
- Super-K NIM A 501, 418 (2003) body: fiducial mass and PMT count not read in that paper (publisher blocked); verified instead from PRD 71, 112005 (2005).
- Borexino h-values attributed to Mantovani et al., PRD 69, 013001 (2004): that paper not read; identical values verified in Dye 2012, Table 3.
- Primary papers behind Th/U = 3.876 ± 0.016 (Blichert-Toft et al. 2010) and 3.90 (+0.13 −0.08) (Wipperfurth et al.): only as quoted by Borexino 2020.
- Journal version table/section numbers (Fiorentini et al. Phys. Rep.; Borexino PRD; JUNO J. Phys. G; EPJC 80, 978) — TeX order given.
- Hyper-K: final (post-2018) detector parameters not checked; values are from the 2018 Design Report (arXiv only).
- JUNO geoneutrino numbers are the 2015 Yellow Book predictions; no newer JUNO geoneutrino paper read.
- arXiv:2408.07015 (ORCA6) journal reference not checked.
