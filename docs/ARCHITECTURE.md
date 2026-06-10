# Project Exogenesis: System Architecture Specification

**Version:** 2.0.0-RC
**Author:** Shannen Saikia
**Status:** Approved for Implementation

---

## 1. Architectural Design Principles

To ensure extreme scalability, strict isolation, and multi-platform determinism, Project Exogenesis is governed by four core architectural pillars:

* **Strict Unidirectional Data Flow:** Data flows strictly downstream. Subsystems cannot write back to upstream dependencies.
* **Mathematical Determinism:** The simulation core must yield identical bitwise results given identical inputs, independent of underlying hardware, operating system, or CPU thread scheduling.
* **Data-Oriented Isolation:** State is separated entirely from behavior. Subsystems share read-only data via immutable, versioned schema snapshots (e.g., Protocol Buffers or flat binary buffers) rather than passing rich object instances.
* **Asynchronous Content Execution:** Heavy analytical and cognitive tasks (AI Scientist, Report Generation) run out-of-band to prevent blocking the real-time processing pipelines (Physics, Visualization).

---

## 2. System Topology & Data Pipeline

```
[ Planet Configuration ] 
          │ (JSON/Protocol Buffer Manifest)
          ▼
┌───────────────────────────────┐
│    Physics Engine (Core)      │ ◄── [ Future Engines: Terraforming / Stellar ]
└──────────────┬────────────────┘
               │
               ├──────────────────────────────────────────┐
               ▼ (Immutable Bitwise State Snapshot)       ▼ (Snapshot)
┌───────────────────────────────┐          ┌───────────────────────────────┐
│     Visualization Engine      │          │      Habitability Engine      │
└───────────────────────────────┘          └──────────────┬────────────────┘
                                                          │
                                                          ▼ (Habitability Matrix)
                                           ┌───────────────────────────────┐
                                           │         AI Scientist          │
                                           └──────────────┬────────────────┘
                                                          │
                                                          ▼ (Telemetry & Analysis)
                                           ┌───────────────────────────────┐
                                           │    Report Generation Engine   │
                                           └───────────────────────────────┘

```

---

## 3. Deep-Dive Subsystem Specifications

### 3.1 Planet Configuration System (PCS)

The ingestion and validation gateway for initial conditions. It guarantees that only physically plausible or explicitly overrides-sanctioned parameters enter the pipeline.

* **Ingestion Formats:** Strongly typed JSON Schemas, YAML configs, or binary Protocol Buffers.
* **Validation Layer:** Executes range bounding, dimensional analysis validation, and relational checks (e.g., verifying that `axial_tilt` remains within $[0, 180]$ degrees, and `star_type` matches standard stellar classifications).
* **Output:** Generates a unique, cryptographically hashed `ConfigurationManifest` that serves as the genesis block for the simulation run.

### 3.2 Physics Engine (Deterministic Core)

The absolute source of truth for the system. It contains zero state tracking for rendering, UI, or heuristic AI logic.

* **Execution Paradigms:** * **Fixed-Timestep Tick System:** No variable deltas ($\Delta t$). Every simulation tick advances at a statically defined temporal interval.
* **Hardware-Agnostic Math:** Utilizes fixed-point arithmetic or strict IEEE 754 software-floats to eliminate cross-compiler or cross-architecture floating-point drift (e.g., preventing $x87$ 80-bit vs SSE 64-bit precision mismatches).


* **Input/Output Contract:**

| Category | Parameter | Data Type / Unit | Constraints |
| --- | --- | --- | --- |
| **Inputs** | `mass` | Float64 ($M_\oplus$) | $> 0.0$ |
|  | `radius` | Float64 ($R_\oplus$) | $> 0.0$ |
|  | `atmosphere_composition` | Map[Gas, Float32] | Sum of partial pressures == total pressure |
|  | `orbital_distance` | Float64 (AU) | $> 0.0$ |
|  | `star_type` | Enum (O, B, A, F, G, K, M) | Valid spectral type |
|  | `rotation_period` | Float64 (Hours) | $\neq 0.0$ (Allows retrograde if negative) |
|  | `axial_tilt` | Float32 (Degrees) | $[0.0, 180.0]$ |
| **Outputs** | `gravity` | Float64 ($m/s^2$) | Computed via $G \cdot \frac{M}{R^2}$ |
|  | `density` | Float64 ($g/cm^3$) | Derived from mass/volume |
|  | `escape_velocity` | Float64 ($m/s$) | Computed surface escape threshold |
|  | `blackbody_temperature` | Float64 (Kelvin) | Calculated via stellar irradiance & albedo |
|  | `atmospheric_pressure` | Float64 (kPa) | Surface level hydrostatic equilibrium |
|  | `orbital_period` | Float64 (Days) | Keplerian orbital mechanics derivation |

> ⚠️ **Architectural Guardrail:** Any import of graphics contexts, vector drawing libraries, UI frameworks, or deep learning model runtimes (e.g., ONNX, PyTorch, TensorRT) into this module will trigger a compilation failure via automated architectural linting rules.

### 3.3 Visualization Engine (VE)

A pure consumer of the immutable physics state frames. It operates entirely as a decoupled downstream presentation layer.

* **Data Ingestion:** Reads the physics state frames via a lock-free ring buffer or a high-throughput memory-mapped channel.
* **Decoupled Refresh Rates:** If the Physics Engine ticks at 20 Hz for analytical accuracy, the Visualization Engine interpolates between frames to render fluid visuals at 144 Hz or higher without forcing the physics core to scale its tick rate.
* **Pipeline Architecture:** Consists of individual rendering subsystems:
* *Procedural Planet Mesh Gen Generator* (Geometry based on `radius` and `density`).
* *Atmospheric Ray-Marcher* (Calculates Rayleigh and Mie scattering based on `atmosphere_composition` and `pressure`).
* *Volumetric Cloud and Sky Compositor* (Driven by thermal profiles and rotation vector dynamics).



### 3.4 Habitability Engine (HE)

Evaluates biological and architectural survival viability based purely on the physical environment outputs.

* **Heuristic Scoring Matrix:** Implements analytical mathematical formulas to weigh conditions against specialized survival models (e.g., Human Baseline, Extremophile Carbon-Based, Silicon-Based Speculative).
* **Vectorized Score Generation:**
* `survivability_score`: Scaled index $[0, 100]$ evaluating radiation protection, pressure compatibility, and thermal stability.
* `agricultural_score`: Evaluates photosynthetic potential based on stellar spectrum flux, atmospheric $CO_2/H_2O$ markers, and soil/crust density.
* `colonization_score`: Structural engineering index determining resource extraction ease and structural integrity risks based on local surface gravity and atmospheric erosion variables.



### 3.5 AI Scientist System

An intelligent analytical layer designed to parse complex simulation states and translate them into natural language scientific observations.

* **Architecture (Model Context Protocol & RAG):** Implements an isolated, asynchronous execution loop utilizing the **Model Context Protocol (MCP)** to securely fetch read-only state slices. It relies on a local vector database containing terrestrial and astronomical reference profiles to execute Retrieval-Augmented Generation (RAG).
* **State Sanity Isolation:** The AI Scientist reads from an isolated context buffer. It has **zero write-access** to the simulation state. It cannot tweak variables to "fix" a dying planet; its role is strictly observational and explanatory.
* **Deliverables:**
* Context-rich explanations of complex environmental interactions (e.g., *"Extreme axial tilt coupled with a short orbital period will result in hyper-violent seasonal flash-freezing across the northern hemisphere."*).
* Dynamic scientific classification taxonomies (e.g., designating a planet as a Sub-Earth tidally locked Carbon Desert).



### 3.6 Report Generation Engine (RGE)

Compiles scientific findings into immutable, human-readable records.

* **Idempotency Guarantee:** Given the exact same simulation snapshot state, the Report Engine must output a byte-for-byte identical PDF or markdown report document.
* **Output Elements:**
* Executive planetary profiling dashboards.
* High-fidelity embedded SVG charts tracking atmospheric pressure gradients against altitude.
* Cryptographic signing: Appends a SHA-256 fingerprint generated from the input `ConfigurationManifest` combined with the final simulation state token to verify report authenticity.



---

## 4. Cross-Cutting Engineering Concerns

### 4.1 Memory Allocation Strategy

To ensure predictable execution timelines and prevent garbage collection overhead during deep simulation runs, the system uses a **Zero-Allocation Execution Loop**.

* All state pools, vertex arrays, and report structures are pre-allocated inside continuous blocks of memory during the initialization sequence managed by the `Planet Configuration System`.
* Data transfer across subsystem boundaries uses zero-copy slicing patterns.

### 4.2 Error Handling Policy

The core pipeline uses a strict **No-Panic / No-Exception** strategy. Subsystems return explicit, strongly typed outcome structures. If a calculation enters an undefined state (e.g., an unexpected division by zero during planet collapse simulation):

1. The engine catches the operational error before it corrupts memory.
2. It flags the simulation frame as corrupted via an error bitmask.
3. The pipeline halts gracefully or falls back to a deterministic safe state, dumping a clean diagnostic state frame.

---

## 5. Future Expansion & Plugin Architecture

The system uses a **Plugin-Based Micro-Kernel Design** to allow future systems to integrate seamlessly without breaking existing engine logic.

```
┌────────────────────────────────────────────────────────┐
│               Exogenesis Core Micro-Kernel             │
├───────────────────┬────────────────┬───────────────────┤
│ Extensibility VTable (Interface Contract Definition)  │
└─────────┬─────────┴────────┬───────┴─────────┬─────────┘
          │                  │                 │
          ▼                  ▼                 ▼
┌──────────────────┐ ┌───────────────┐ ┌─────────────────┐
│ Evolution Plugin │ │ Civ Engine    │ │ Terraforming    │
└──────────────────┘ └───────────────┘ └─────────────────┘

```

* **Integration Interface:** Future modules register with the system kernel using an explicit, version-checked VTable interface contract.
* **Downstream Orchestration Hook Points:**
* `evolution-engine`: hooks into the output of the `Habitability Engine`, utilizing chemical profiles to seed primitive procedural lifecycles.
* `civilization-engine`: registers directly after the evolution layer, transforming atmospheric resource profiles into structural development rates.
* `terraforming-engine`: operates as an authorized **interceptor middleware** that sits between the `Planet Configuration System` and the `Physics Engine`. It modifies the input configuration state over time based on simulated technology vectors, keeping the core physics engine isolated and focused solely on deterministic calculations.