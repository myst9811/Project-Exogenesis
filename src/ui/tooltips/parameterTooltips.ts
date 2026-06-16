/**
 * @module ui/tooltips/parameterTooltips
 *
 * Static authored tooltip content for every input parameter and output
 * readout. Content is deterministic — no AI, no runtime computation.
 * Inputs receive definition + analogy + solar-system anchors.
 * Outputs receive definition only (ReadoutCard already contextualises the value).
 */

import type { ParameterTooltip, ParameterTooltipKey } from './types';

export const PARAMETER_TOOLTIPS: Record<ParameterTooltipKey, ParameterTooltip> = {

  // ── Stellar inputs ──────────────────────────────────────────────────────

  spectralClass: {
    title: 'Spectral Class',
    definition:
      'A letter code classifying a star by its surface temperature and colour. O and B stars burn hot and blue; G stars (like our Sun) are yellow-white; K and M stars are cooler and red.',
    analogy:
      "Think of it as the star's colour temperature — the same scale as a metal rod heated from dull red to white-hot to blue.",
    anchors: [
      { label: 'M — Red dwarf', value: '< 3,700 K · dim red' },
      { label: 'K — Orange', value: '3,700–5,200 K' },
      { label: 'G — Sun', value: '5,200–6,000 K', isEarth: true },
      { label: 'F — White-yellow', value: '6,000–7,500 K' },
      { label: 'A — White', value: '7,500–10,000 K' },
      { label: 'B — Blue', value: '10,000–30,000 K' },
    ],
  },

  stellarMass: {
    title: 'Stellar Mass',
    definition:
      "The mass of the host star relative to our Sun (1 M☉ = solar mass). Mass determines a star's luminosity, surface temperature, lifespan, and the width of its habitable zone.",
    analogy:
      'A heavier star burns its fuel faster — like a larger bonfire that blazes brighter but burns out sooner.',
    anchors: [
      { label: 'Proxima Centauri', value: '0.12 M☉' },
      { label: 'Sun', value: '1.0 M☉', isEarth: true },
      { label: 'Sirius A', value: '2.1 M☉' },
      { label: 'Rigel', value: '21 M☉' },
    ],
  },

  stellarAge: {
    title: 'Stellar Age',
    definition:
      'How long the star has been on the main sequence, in billions of years (Gyr). Older stars have had more time to settle, potentially giving orbiting planets more time to develop complex chemistry.',
    analogy:
      'A younger star is more active and flares more unpredictably — like a young fire throwing sparks before it settles into steady burning.',
    anchors: [
      { label: 'Sun', value: '4.6 Gyr', isEarth: true },
      { label: 'Proxima Centauri', value: '~4.9 Gyr' },
      { label: 'TRAPPIST-1', value: '~7.6 Gyr' },
    ],
  },

  // ── Orbital inputs ──────────────────────────────────────────────────────

  semiMajorAxis: {
    title: 'Semi-Major Axis',
    definition:
      'The average distance between a planet and its star, in Astronomical Units (1 AU = Earth–Sun distance). This is the primary driver of how much stellar energy the planet receives.',
    analogy:
      'How far from the campfire you sit — too close and you burn, too far and you freeze.',
    anchors: [
      { label: 'Venus', value: '0.72 AU' },
      { label: 'Earth', value: '1.00 AU', isEarth: true },
      { label: 'Mars', value: '1.52 AU' },
      { label: 'Jupiter', value: '5.20 AU' },
    ],
  },

  eccentricity: {
    title: 'Orbital Eccentricity',
    definition:
      'How elliptical the orbit is, from 0 (perfect circle) to 1 (escape trajectory). Higher eccentricity means the planet swings much closer and farther from its star each year, driving seasonal temperature extremes.',
    analogy:
      'A circular orbit is a merry-go-round; a high-eccentricity orbit is a pendulum — swinging close and fast, then far and slow.',
    anchors: [
      { label: 'Earth', value: '0.017', isEarth: true },
      { label: 'Mars', value: '0.093' },
      { label: 'Mercury', value: '0.206' },
      { label: 'Pluto', value: '0.249' },
    ],
  },

  // ── Planetary inputs ────────────────────────────────────────────────────

  planetMass: {
    title: 'Planetary Mass',
    definition:
      "The total mass of the planet relative to Earth (1 M⊕ = Earth mass). Mass determines surface gravity, how much atmosphere a planet can retain, and its internal heat budget.",
    analogy:
      "A heavier planet holds onto its atmosphere more tightly — like a deeper bucket that's harder to spill.",
    anchors: [
      { label: 'Mars', value: '0.11 M⊕' },
      { label: 'Earth', value: '1.0 M⊕', isEarth: true },
      { label: 'Neptune', value: '17.1 M⊕' },
      { label: 'Jupiter', value: '317.8 M⊕' },
    ],
  },

  planetRadius: {
    title: 'Planetary Radius',
    definition:
      'The radius of the planet relative to Earth (1 R⊕ = Earth radius). Together with mass, radius determines surface gravity and mean density — which hints at internal composition.',
    analogy:
      'A larger radius spreads the same gravitational pull over a wider surface — the bigger the planet, the lower the surface gravity for the same mass.',
    anchors: [
      { label: 'Mars', value: '0.53 R⊕' },
      { label: 'Earth', value: '1.0 R⊕', isEarth: true },
      { label: 'Neptune', value: '3.9 R⊕' },
      { label: 'Jupiter', value: '11.2 R⊕' },
    ],
  },

  compositionClass: {
    title: 'Composition Class',
    definition:
      "The dominant material making up the planet's bulk interior. Silicate planets are rocky like Earth; iron-rich planets have large dense cores; icy planets are rich in water-ice and volatiles; carbon planets replace silicates with carbon compounds.",
    analogy:
      'Like the difference between a sandstone building, a lead safe, an ice sculpture, and a charcoal block — same shape, very different properties.',
    anchors: [
      { label: 'Silicate (Earth-like)', value: '~5.5 g/cm³' },
      { label: 'Iron-rich (Mercury-like)', value: 'dense core, ~5.4 g/cm³' },
      { label: 'Icy (Ganymede-like)', value: '~1.9 g/cm³' },
    ],
  },

  // ── Rotation inputs ─────────────────────────────────────────────────────

  rotationPeriod: {
    title: 'Rotation Period',
    definition:
      'How long it takes the planet to complete one full rotation on its axis, in hours. This sets the length of a day. Very slow rotation increases the temperature contrast between the sunlit and dark hemispheres.',
    analogy:
      'A slowly spinning planet is like a rotisserie chicken that barely turns — one side cooks while the other stays cold.',
    anchors: [
      { label: 'Jupiter', value: '9.9 h' },
      { label: 'Earth', value: '24 h', isEarth: true },
      { label: 'Mars', value: '24.6 h' },
      { label: 'Venus', value: '5,832 h (retrograde)' },
    ],
  },

  axialTilt: {
    title: 'Axial Tilt',
    definition:
      "The angle between the planet's rotation axis and the perpendicular to its orbital plane, in degrees. Axial tilt drives the seasons: 0° means no seasons; high tilt means extreme hemispheric cycles.",
    analogy:
      "Earth's 23.4° tilt is why you need a winter coat — one hemisphere leans toward the Sun for half the year, then away for the other half.",
    anchors: [
      { label: 'Mercury', value: '0.03° — no seasons' },
      { label: 'Earth', value: '23.4°', isEarth: true },
      { label: 'Mars', value: '25.2°' },
      { label: 'Uranus', value: '97.8° — extreme seasons' },
    ],
  },

  // ── Atmospheric gas inputs ───────────────────────────────────────────────

  pressureN2: {
    title: 'Nitrogen (N₂) Pressure',
    definition:
      "The partial pressure contributed by molecular nitrogen. N₂ is chemically inert and forms the bulk of Earth's atmosphere. It has no direct greenhouse effect but raises total pressure, influencing the boiling point of water and biological respiration thresholds.",
    analogy:
      "Nitrogen is the atmosphere's filler — it provides bulk and pressure without reacting with much of anything.",
    anchors: [
      { label: 'Mars', value: '0.019 kPa' },
      { label: 'Earth', value: '78.1 kPa', isEarth: true },
      { label: 'Titan', value: '146.7 kPa' },
    ],
  },

  pressureO2: {
    title: 'Oxygen (O₂) Pressure',
    definition:
      'The partial pressure of molecular oxygen. O₂ is required for aerobic respiration. Below ~16 kPa humans cannot survive without supplemental oxygen; above ~50 kPa it becomes a fire hazard and toxic to lung tissue.',
    analogy:
      'Oxygen is the engine fuel — just enough and it runs cleanly, too little and it stalls, too much and it becomes dangerous.',
    anchors: [
      { label: 'Breathable minimum', value: '~16 kPa' },
      { label: 'Earth', value: '21.2 kPa', isEarth: true },
      { label: 'Toxic threshold', value: '> 50 kPa' },
    ],
  },

  pressureCO2: {
    title: 'Carbon Dioxide (CO₂) Pressure',
    definition:
      "The partial pressure of CO₂. Even small amounts produce a strong greenhouse effect, warming the surface. Very high concentrations are toxic. Venus's thick CO₂ atmosphere has driven its surface temperature above 460 °C.",
    analogy:
      'CO₂ is a greenhouse gas — like a blanket over the planet that thickens with every molecule you add.',
    anchors: [
      { label: 'Earth', value: '0.04 kPa', isEarth: true },
      { label: 'Mars', value: '0.64 kPa' },
      { label: 'Venus', value: '9,200 kPa' },
    ],
  },

  pressureH2O: {
    title: 'Water Vapour (H₂O) Pressure',
    definition:
      'The partial pressure of water vapour. Water vapour is a powerful greenhouse gas and the key ingredient for clouds, rain, and liquid surface water. Its amount depends on surface temperature and the availability of liquid water.',
    analogy:
      "Water vapour is the atmosphere's humidity — raise the temperature and more evaporates upward; raise it enough and you get a runaway greenhouse.",
    anchors: [
      { label: 'Earth (typical)', value: '~1–3 kPa', isEarth: true },
      { label: 'Saturation at 100 °C', value: '101.3 kPa' },
    ],
  },

  pressureCH4: {
    title: 'Methane (CH₄) Pressure',
    definition:
      'The partial pressure of methane. CH₄ is a potent greenhouse gas — roughly 80× more warming than CO₂ over 20 years. On Earth it is produced primarily by biology and anaerobic decay. Significant concentrations can be a biosignature.',
    analogy:
      'Methane is a short-lived but powerful greenhouse gas — like a concentrated fire-starter that burns hot but quickly.',
    anchors: [
      { label: 'Earth', value: '~0.00019 kPa', isEarth: true },
      { label: 'Titan', value: '~5.3 kPa' },
    ],
  },

  pressureAr: {
    title: 'Argon (Ar) Pressure',
    definition:
      'The partial pressure of argon. Ar is a noble gas — completely inert, neither a greenhouse gas nor biologically active. It accumulates in planetary atmospheres over time from the radioactive decay of potassium-40.',
    analogy:
      'Argon is a true bystander — it witnesses everything but does absolutely nothing.',
    anchors: [
      { label: 'Mars', value: '~0.016 kPa' },
      { label: 'Earth', value: '0.96 kPa', isEarth: true },
    ],
  },

  pressureHe: {
    title: 'Helium (He) Pressure',
    definition:
      'The partial pressure of helium. He is light enough to escape from rocky planets over geological time via thermal (Jeans) escape. Its presence indicates ongoing outgassing or capture. Chemically inert with no greenhouse effect.',
    analogy:
      'Helium is the balloon gas of atmospheres — on a rocky planet it slowly leaks away to space over millions of years.',
    anchors: [
      { label: 'Earth', value: '~0.0005 kPa', isEarth: true },
      { label: 'Gas giants', value: 'second most abundant' },
    ],
  },

  pressureH2: {
    title: 'Hydrogen (H₂) Pressure',
    definition:
      'The partial pressure of molecular hydrogen. H₂ is the lightest gas and escapes rocky planets rapidly unless gravity is strong enough to retain it. Thick H₂ envelopes create a potent greenhouse effect and are characteristic of sub-Neptune planets.',
    analogy:
      'Hydrogen is so light it escapes easily — only a very massive planet has the gravitational grip to hold it in large quantities.',
    anchors: [
      { label: 'Earth', value: '~0.00005 kPa (trace)', isEarth: true },
      { label: 'Jupiter', value: 'dominant component' },
    ],
  },

  // ── Output readouts (definition only) ───────────────────────────────────

  gravity: {
    title: 'Surface Gravity',
    definition:
      "The gravitational acceleration at the planet's surface, computed from its mass and radius. Determines how much weight an object feels, how easily the atmosphere escapes to space, and the energy cost of geological and biological processes.",
  },

  surfaceTemperature: {
    title: 'Surface Temperature',
    definition:
      'The equilibrium temperature at the planet\'s surface, accounting for stellar energy input, albedo, and the greenhouse effect from the atmospheric composition. Does not model day–night variation or latitudinal gradients.',
  },

  habitability: {
    title: 'Habitability Score',
    definition:
      'A composite score from 0–100 estimating how survivable this world is for an unprotected human, based on surface gravity, atmospheric pressure, temperature, and oxygen availability. This is a survivability index, not a measure of whether life of any kind could exist.',
  },

  atmosphericPressure: {
    title: 'Atmospheric Pressure',
    definition:
      "The total pressure exerted by the atmosphere at the planet's surface, equal to the sum of all gas partial pressures. Determines whether liquids can exist at the surface, how dense the air is for flight and respiration, and the rate of atmospheric escape.",
  },

  atmosphere: {
    title: 'Atmospheric Composition',
    definition:
      'The breakdown of the atmosphere by partial pressure of each gas. Each bar segment represents the fractional contribution of one gas to the total surface pressure. The composition drives the greenhouse effect, surface chemistry, and habitability.',
  },

  escapeVelocity: {
    title: 'Escape Velocity',
    definition:
      "The minimum speed an object must reach to escape the planet's gravitational pull entirely. Lighter gas molecules move faster at a given temperature — if their average speed approaches the escape velocity, the planet gradually loses that gas to space over geological time.",
  },

  dayLength: {
    title: 'Day Length',
    definition:
      'The time it takes the planet to complete one rotation on its axis. Very long days increase temperature extremes between sunlit and dark sides. Planets tidally locked to their star have a permanent day side and a permanent night side.',
  },

  yearLength: {
    title: 'Year Length',
    definition:
      "The time for the planet to complete one full orbit around its star, derived from Kepler's third law. Year length determines the duration of seasonal cycles and the planet's time-averaged energy budget.",
  },
};
