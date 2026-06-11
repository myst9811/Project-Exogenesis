# Scientific Reference Index

Every scientific paper, data compilation, and standards document used by the
simulation, per CLAUDE.md §12. Add a row in the same commit that introduces
a new citation in code.

## Standards & Data Compilations

| Reference | DOI / URL | Used by | Purpose |
|---|---|---|---|
| CODATA 2022 — Mohr, Tiesinga, Newell & Taylor (2024), *CODATA Recommended Values of the Fundamental Physical Constants: 2022*, Rev. Mod. Phys. 97, 025002 | doi:10.1103/RevModPhys.97.025002 | `physics/constants` | G, Stefan–Boltzmann constant, Boltzmann constant |
| IAU 2015 Resolution B3 — Prša et al. (2016), *Nominal Values for Selected Solar and Planetary Quantities*, AJ 152, 41 | doi:10.3847/0004-6256/152/2/41 | `physics/constants` | Nominal solar radius/temperature/luminosity, solar/terrestrial/jovian mass parameters, Earth equatorial radius |
| IAU 2012 Resolution B2, *Re-definition of the Astronomical Unit of Length* | https://www.iau.org/static/resolutions/IAU2012_English.pdf | `physics/constants` | Exact definition of the astronomical unit |
| US Standard Atmosphere 1976 (NOAA/NASA/USAF) | https://ntrs.nasa.gov/citations/19770009539 | `physics/configuration/earthBaseline` | Earth sea-level pressure (101.325 kPa) |
| CRC Handbook of Chemistry and Physics — dry-air composition | — | `physics/configuration/earthBaseline` | Molar fractions of N₂, O₂, Ar, CO₂ |
| NASA Earth Fact Sheet (NSSDC) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html | `physics/configuration/earthBaseline`, `physics/planetary` tests | Orbital eccentricity, sidereal day, obliquity, mean radius, bulk density |
| Planck Collaboration (2020), *Planck 2018 results. VI. Cosmological parameters*, A&A 641, A6 | doi:10.1051/0004-6361/201833910 | `physics/constants` | Age of the universe (stellar age upper bound) |
| CIAAW 2021 standard atomic weights (via NIST Chemistry WebBook) | https://www.ciaaw.org/atomic-weights.htm | `physics/constants` | Molar masses of modeled atmospheric gases |

## Peer-Reviewed Papers

| Reference | DOI | Used by | Purpose |
|---|---|---|---|
| Chabrier & Baraffe (2000), *Theory of Low-Mass Stars and Substellar Objects*, ARA&A 38, 337 | doi:10.1146/annurev.astro.38.1.337 | `physics/constants` | Hydrogen-burning minimum stellar mass (~0.075 M☉) |
| Figer (2005), *An upper limit to the masses of stars*, Nature 434, 192 | doi:10.1038/nature03293 | `physics/constants` | Empirical stellar upper mass limit (~150 M☉) |
| Spiegel, Burrows & Milsom (2011), *The Deuterium-Burning Mass Limit for Brown Dwarfs and Giant Planets*, ApJ 727, 57 | doi:10.1088/0004-637X/727/1/57 | `physics/constants` | Planet / brown-dwarf boundary (13 M♃) |
| Pecaut & Mamajek (2013), *Intrinsic Colors, Temperatures, and Bolometric Corrections of Pre-main-sequence Stars*, ApJS 208, 9 | doi:10.1088/0067-0049/208/1/9 | `physics/constants` | Main-sequence mass ranges per spectral class |
| Libby-Roberts et al. (2020), *The Featureless Transmission Spectra of Two Super-puff Planets*, AJ 159, 57 | doi:10.3847/1538-3881/ab5d36 | `physics/constants` | Minimum plausible planetary bulk density (Kepler-51 super-puffs) |
| Mocquet, Grasset & Sotin (2014), *Very high-density planets: a possible remnant of gas giants*, Phil. Trans. R. Soc. A 372, 20130164 | doi:10.1098/rsta.2013.0164 | `physics/constants` | Maximum plausible planetary bulk density |
| Jiang & Tremaine (2010), *The evolution of wide binary stars*, MNRAS 401, 977 | doi:10.1111/j.1365-2966.2009.15744.x | `physics/constants` | Galactic-tide limit on bound-orbit semi-major axis (~1 pc) |
| Anderson et al. (2010), *WASP-17b: an ultra-low density planet in a probable retrograde orbit*, ApJ 709, 159 | doi:10.1088/0004-637X/709/1/159 | `physics/constants` | Maximum observed planetary radius (~2 R♃) |
| Bouvier & Wadhwa (2010), *The age of the Solar System redefined by the oldest Pb–Pb age of a meteoritic inclusion*, Nature Geoscience 3, 637 | doi:10.1038/ngeo941 | `physics/configuration/earthBaseline` | Solar age (4.567 Gyr) |
| Dumusque et al. (2014), *The Kepler-10 Planetary System Revisited by HARPS-N*, ApJ 789, 154 | doi:10.1088/0004-637X/789/2/154 | `physics/planetary` tests | Kepler-10b mass, radius, and density test case |
| Duric (2004), *Advanced Astrophysics*, Cambridge University Press, §1.3 | ISBN 978-0521525717 | `physics/stellar` | Piecewise main-sequence mass–luminosity relation |
| Demircan & Kahraman (1991), *Stellar mass-luminosity and mass-radius relations*, Ap&SS 181, 313 | doi:10.1007/BF00639097 | `physics/stellar` | Main-sequence mass–radius relation |
| Anglada-Escudé et al. (2016), *A terrestrial planet candidate in a temperate orbit around Proxima Centauri*, Nature 536, 437 | doi:10.1038/nature19106 | `physics/stellar` tests | Proxima Centauri mass, luminosity, radius, temperature test case |
| Catling & Zahnle (2009), *The Planetary Air Leak*, Scientific American 300(5), 36 | doi:10.1038/scientificamerican0509-36 | `physics/atmosphere` | Jeans escape rule-of-thumb retention thresholds |
| de Pater & Lissauer (2015), *Planetary Sciences*, 2nd ed., Cambridge University Press, §3.1 | doi:10.1017/CBO9781316165270 | `physics/climate` | Energy balance equilibrium temperature model |
| Pierrehumbert (2010), *Principles of Planetary Climate*, Cambridge University Press, ch. 4 | doi:10.1017/CBO9780511780783 | `physics/climate` | Gray two-stream greenhouse model; curve-of-growth √p scaling |
| Schmidt et al. (2010), *Attribution of the present-day total greenhouse effect*, JGR 115, D20106 | doi:10.1029/2010JD014287 | `physics/climate` | Per-gas split of Earth's greenhouse optical depth anchors |
| Gillon et al. (2017), *Seven temperate terrestrial planets around the nearby ultracool dwarf star TRAPPIST-1*, Nature 542, 456 | doi:10.1038/nature21360 | `physics/climate` tests | TRAPPIST-1b equilibrium temperature test case |
| NASA Venus / Mars / Jupiter Fact Sheets (NSSDC) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/ | `physics/climate`, `physics/planetary`, `physics/atmosphere` tests | Bond albedos, surface pressures/temperatures, escape velocity anchors |
| Hartmann (2016), *Global Physical Climatology*, 2nd ed., Elsevier | ISBN 978-0123285317 | `physics/configuration/earthBaseline` | Global-mean surface water-vapor partial pressure |

## Reserved for Phase 2 (selected, not yet implemented)

| Reference | DOI | Planned use |
|---|---|---|
| Kopparapu et al. (2013), *Habitable Zones around Main-sequence Stars*, ApJ 765, 131 | doi:10.1088/0004-637X/765/2/131 | Habitable zone boundary calculator |
