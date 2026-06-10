# Project Exogenesis — Vision

> **This document defines the emotional and experiential north star of Project Exogenesis.**
>
> When a feature decision is unclear, return here.
> When a design feels wrong, return here.
> When priorities conflict, return here.
>
> Every engineering decision, visual choice, and AI interaction must serve this vision.

---

## Table of Contents

1. [Core Idea](#1-core-idea)
2. [The Problem We Are Solving](#2-the-problem-we-are-solving)
3. [Emotional Goals](#3-emotional-goals)
4. [The User We Are Building For](#4-the-user-we-are-building-for)
5. [Example User Journeys](#5-example-user-journeys)
6. [Product Pillars](#6-product-pillars)
7. [What We Are Not](#7-what-we-are-not)
8. [Reference Experiences](#8-reference-experiences)
9. [The Signature Moment](#9-the-signature-moment)
10. [Success Metrics](#10-success-metrics)
11. [Long-Term Scope](#11-long-term-scope)

---

## 1. Core Idea

**Create a planet. Watch science determine its fate.**

Project Exogenesis allows users to define the physical parameters of an alien world and observe the consequences unfold through the lens of real planetary science.

A user sets a planet's mass, composition, orbital distance, and atmospheric makeup. The physics engine responds. A world takes shape — not because an algorithm invented it, but because physics demanded it.

The experience is not about building a world. It is about **discovering the world that must exist** given a set of physical constraints.

This is the fundamental inversion that makes Exogenesis different from every other world-building tool:

> In most tools, you design the outcome.
> In Exogenesis, you set the conditions. Science designs the outcome.

---

## 2. The Problem We Are Solving

### Planetary Science Is Inaccessible

The physics of planetary formation, atmospheric chemistry, habitability, and stellar interaction are among the most fascinating domains in all of science. Missions like Kepler, TESS, and JWST have revealed thousands of alien worlds. The public is interested.

But the science is locked behind jargon, equations, and academic papers.

### Existing Tools Are Either Too Simple or Too Inaccessible

| Tool | Problem |
|---|---|
| Wikipedia / textbooks | Passive, no interactivity, no consequences |
| Universe Sandbox | Powerful but intimidating, no guided narrative |
| Space Engine | Beautiful but shallow — no physics feedback loop |
| No Man's Sky | Evocative but scientifically incoherent |
| NASA educational tools | Accurate but visually unengaging and non-interactive |

There is no tool that gives a curious non-scientist the ability to **experiment with planetary physics and immediately understand the consequences** of what they changed.

### The Gap We Fill

Project Exogenesis sits in the gap between scientific accuracy and experiential accessibility. It makes the physics legible through consequence. It makes the consequence beautiful through rendering. It makes the beauty meaningful through education.

---

## 3. Emotional Goals

When a user interacts with Project Exogenesis, they should feel:

### Curiosity
> "I wonder what happens if I move this planet closer to the star."

The interface must invite experimentation. Every parameter should feel like a question worth asking.

### Wonder
> "I didn't expect a planet this massive to have such thin air."

The consequences of physics should surprise users in ways that feel earned, not arbitrary. Surprise through science, not randomness.

### Discovery
> "I found a world where liquid water could exist — but only at the poles."

Users should feel like they are finding something, not making something. The physics reveals; the user uncovers.

### Scientific Intuition
> "I bet doubling the atmospheric pressure would push the temperature up even more."

After spending time with the platform, users should develop genuine physical intuition. They should begin to predict consequences before they occur.

### Ownership
> "This is my world. These are its conditions. This is what it means."

Even though the physics determines the outcome, users should feel a deep sense of connection to the world they initialized. The world is theirs because the choices were theirs.

---

## 4. The User We Are Building For

### Primary User: The Curious Non-Scientist

- Has a genuine interest in space, astronomy, and science fiction
- Does not have a formal background in astrophysics
- Has probably played No Man's Sky, Stellaris, or Kerbal Space Program
- Reads space news, watches documentaries, follows NASA missions
- Is frustrated by how shallow most "space games" feel scientifically
- Does not want to read equations — but does want to understand consequences

### Secondary User: The Educator

- A teacher, professor, or science communicator
- Wants an interactive tool to demonstrate planetary science concepts
- Needs scientific credibility — cannot use a tool that is physically wrong
- Values the ability to set up specific scenarios and walk students through them

### Tertiary User: The Enthusiast / Worldbuilder

- A science fiction writer building a believable alien world
- A game designer creating a scientifically plausible setting
- Wants a tool that generates defensible physical parameters for a creative project
- Will push the boundaries of the parameter space intentionally

### Who We Are Not Building For

- Professional planetary scientists running research simulations (they have better tools)
- Casual gamers seeking entertainment without engagement (this is not a game)
- Users who want to override physics for aesthetic reasons

---

## 5. Example User Journeys

### Journey 1: The First-Time Explorer

> Maya is a 19-year-old who just watched a documentary about TRAPPIST-1. She opens Exogenesis and sees a default Earth-like world. She drags the orbital distance slider inward toward the red dwarf star. The planet's surface temperature climbs. The atmosphere begins to erode. The AI narrator explains: *"Closer to this star, the surface is bathed in intense UV radiation. Without a strong magnetic field, the atmosphere is being stripped away."*
>
> Maya didn't know atmospheric erosion worked like that. She moves the slider back out, curious. She spends 45 minutes experimenting without ever reading a tutorial.

### Journey 2: The Worldbuilder

> Dara is writing a science fiction novel set on a high-gravity super-Earth. She opens Exogenesis and sets the planet's mass to 3.2 Earth masses. The physics engine computes a surface gravity of 2.1g, a denser atmosphere, and a shorter orbital period. The AI generates a description: *"Standing on this world, you carry the weight of a second person at all times. The horizon is closer than on Earth — the curvature of this massive planet makes itself known."*
>
> Dara copies this for her novel's setting notes. She has a physically accurate world she can write with confidence.

### Journey 3: The Student

> Kenji is studying for a planetary science exam. His professor has assigned a session on the habitable zone concept. He opens Exogenesis and moves a planet from inside the habitable zone outward. The platform shows the liquid water window narrowing and then closing. The AI explains the energy balance model. Kenji adjusts the greenhouse gas concentration and watches the effective temperature shift.
>
> By the end of the session, he understands the greenhouse effect more viscerally than from any diagram in his textbook.

---

## 6. Product Pillars

### I. Scientific Credibility

Every value in the system must be defensible against published planetary science. No compromise.

If a physical model is uncertain, document the uncertainty. If a simplification is made, label it as a simplification. If a value is estimated rather than calculated, say so.

The product earns trust through honesty about its own limitations.

### II. Interactive Consequence

Every parameter the user touches must produce visible, legible consequences.

Not just a number changing. An experience changing. A world transforming.

The feedback loop between input and consequence must be immediate, clear, and physically meaningful.

### III. Visual Fidelity

The world must look like a place that exists.

Not a cartoon. Not a stylized illustration. A place.

The rendering must honor the physics — a thick CO₂ atmosphere produces an orange-tinted haze. A tidally locked world has a permanent noon and a permanent midnight. A world orbiting a red dwarf has a sky that glows in deep amber tones.

Visual parameters are computed, not chosen.

### IV. Accessible Depth

The surface must be immediately understandable by a curious 15-year-old.
The depth must be satisfying to a graduate student in planetary science.

No dumbing down. No barrier to entry. Both simultaneously, through layered disclosure.

### V. Educational Integrity

Users must leave each session knowing something true that they did not know before.

The platform is an educational instrument. It must never teach incorrect physics — even if correct physics is less dramatic.

---

## 7. What We Are Not

### Not a Game

There are no win conditions. There are no lose conditions. There is no score.

There is only: *here is a world. here is what physics says about it.*

If a feature introduces gamification that overrides or ignores physics, it does not belong here.

### Not a Fantasy World Generator

Magic, fictional physics, and arbitrary randomization are not part of this platform.

A world either emerges from the equations or it does not exist here.

### Not a Toy

"Toy" implies shallow interactivity. Exogenesis is a tool that happens to be joyful to use. The distinction matters.

Toys can be wrong. Exogenesis cannot be wrong.

### Not a Replacement for Real Simulation

We are not building a professional-grade planetary formation code. We are not competing with MESA, ROCKE-3D, or ExoCAM.

We are building the most accessible, scientifically honest, and visually compelling educational platform in this space.

### Not Comprehensive (Yet)

The MVP does not model tidal forces in detail. It does not run atmospheric chemistry. It does not simulate evolution.

These are future modules. The MVP establishes the correct foundation.

---

## 8. Reference Experiences

When making a product decision, ask: would this feel at home in all five of these?

### NASA / ESA Mission Pages

What we borrow: scientific credibility, real units, honest uncertainty, reference to published research.

What we reject: impenetrable jargon, passive presentation, zero interactivity.

### Universe Sandbox

What we borrow: cause-and-effect physics, sliders that change simulation state, sense of real consequence.

What we reject: overwhelming complexity with no guided narrative, no translation of values into human experience.

### Kerbal Space Program

What we borrow: physics learned through play, failure as a teaching mechanism, the joy of understanding why something works.

What we reject: game mechanics, scores, missions, anything that makes physics feel like an obstacle rather than the point.

### No Man's Sky

What we borrow: sense of discovery on an alien world, visual coherence of environment, the feeling that a place *has a personality*.

What we reject: physically incoherent worlds, procedural randomness masquerading as science, anything that sacrifices plausibility for spectacle.

### Scientific Visualization (NASA Eyes, JWST imagery, Windy.com)

What we borrow: data made beautiful, parameters rendered with visual honesty, no ornamentation that distorts the underlying data.

What we reject: decoration for its own sake, visualizations that obscure rather than reveal.

---

## 9. The Signature Moment

Every great product has a signature moment — the moment a user first truly understands what they are using.

For Exogenesis, that moment is:

> The user moves a slider. The world changes. Not just a number. The sky changes color. The temperature climbs. The AI says something that connects what just happened to something they already understand.
>
> They didn't expect it. But it makes complete sense.
>
> They move the slider again.

That moment of unexpected, scientifically coherent consequence is what we are building toward with every line of code.

The entire system — physics engine, renderer, AI narrator, translation layer — exists to produce that moment, reliably, for every user, on every interaction.

---

## 10. Success Metrics

### Engagement (What We Measure)

| Metric | Target |
|---|---|
| Session length (median) | > 12 minutes |
| Parameter adjustments per session | > 15 |
| Return sessions within 7 days | > 40% |
| Worlds created and shared | Growing week-over-week |

### Education (What We Aim For — Harder to Measure)

- A user who spends 20 minutes on the platform can correctly predict the direction of a temperature change given a parameter change
- A user can explain — in plain language — why a planet with high gravity tends to retain a thicker atmosphere
- A teacher can use the platform to supplement a lesson and cite it without embarrassment

### The Feeling Test

Show the product to a person with no background in planetary science. Watch them use it for 10 minutes without instruction. Then ask:

> "What did you learn?"

If they can articulate something true about planetary physics that they didn't know before, the product is working.

If they say "I don't know, I was just clicking things," the product has failed.

---

## 11. Long-Term Scope

The following modules represent the full long-term vision. They are listed in rough priority order. The MVP implements none of them fully — but the architecture must accommodate all of them.

### Phase 1 — Foundation (MVP)
- Stellar parameter definition
- Orbital mechanics
- Planetary physical properties
- Atmospheric composition
- Basic habitability analysis
- Equilibrium temperature and energy balance
- Physics-driven 3D rendering
- Human translation layer
- AI narrative descriptions
- Shareable world URLs

### Phase 2 — Climate & Sky
- Full energy balance model with greenhouse feedback
- Atmospheric scattering and sky rendering
- Day/night cycle visualization
- Seasonal variation from axial tilt

### Phase 3 — Life & Habitability
- Detailed habitability scoring by domain (liquid water, UV exposure, atmospheric chemistry)
- Biosignature proxy analysis
- Evolutionary pressure modeling (what pressures would life face here?)

### Phase 4 — Systems & History
- Multi-body stellar system design
- Orbital resonance detection
- Stellar evolution over time
- Planetary geological history modeling

### Phase 5 — Civilization & Transformation
- Civilization viability projection
- Terraforming simulation
- Long-term climate intervention modeling

### Phase 6 — Reports & Science
- Exportable scientific reports in standard format
- Comparison to known exoplanet catalog (Kepler, TESS, JWST)
- Shareable parameter sets for educational use

---

*This document describes where we are going. ARCHITECTURE.md describes how we get there. CLAUDE.md describes how we behave while building.*