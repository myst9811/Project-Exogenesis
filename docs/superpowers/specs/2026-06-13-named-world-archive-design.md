# Design Spec — Named World Archive & Enhanced Sharing

**Date:** 2026-06-13  
**Status:** Approved for planning  
**Scope:** `src/store/`, `src/ui/`, `src/types/`, and a thin persistence adapter. No physics, renderer, translation, or AI prompt changes in Phase 1 (AI name suggestions are Phase 2).  
**Companion ADR (to write at implementation):** `docs/adr/008-cosmetic-world-metadata.md`

---

## 1. Motivation

Project Exogenesis already lets users **create** worlds from physical parameters and **share** them via deterministic URL tokens (ADR-007, Phase 8). What it does not yet offer is **ownership** and **recognition**:

| Gap today | User feeling |
|---|---|
| Every world is identified only as `EXO-{hash prefix}` | "I found something remarkable but I can't call it anything." |
| Sharing copies a long opaque URL with no human context | "My friend won't know what they're opening." |
| No way to return to a past creation without bookmarking URLs | "I lost that world I spent twenty minutes tuning." |
| VISION.md lists *"Worlds created and shared — growing week-over-week"* as a success metric | Sharing exists; **saving and naming** are the missing retention loop |

The signature moment in VISION.md is adjusting a slider and watching science respond. The **second** signature moment this feature targets:

> The user finishes tuning a world, gives it a name, registers it in their exploration log, and shares a link where the recipient sees both the name and the planet — then loads it and feels the same wonder.

This must feel like a planetary scientist **cataloging a discovery**, not like saving a game file.

---

## 2. Goals

### Must have (Phase 1 — "Personal Archive")

1. **Name any successfully computed world** with a user-chosen common name (cosmetic only; never enters physics).
2. **Save named worlds to a personal Exploration Archive** persisted across browser sessions (local-first, no account required).
3. **Browse, load, rename, and delete** saved entries from a dedicated archive UI.
4. **Enhanced share flow** that copies a link *and* optional display metadata so recipients see the giver's name for the world.
5. **HUD and header integration** — when a world has a saved name, show it prominently alongside the honest `EXO-` designation.
6. **Full architectural compliance** — names/metadata never touch `PlanetConfiguration`, `PlanetaryState`, or the physics engine.

### Should have (Phase 2 — "Discovery Assist")

7. **AI-suggested provisional names** (optional, clearly labeled as cosmetic suggestions; user always confirms).
8. **Rich share payload** — clipboard text formatted for social paste (name + designation + one-line science hook from translations).
9. **Import from shared link** — opening a link with an embedded display name offers "Add to Archive" pre-filled.

### Could have (Phase 3 — "Public Deep Field Catalog")

10. **Opt-in public gallery** of community worlds (requires backend; see §12).
11. **Educator collections** — curated sets of named worlds for classroom scenarios.

### Non-goals

- User accounts, authentication, or cloud sync in Phase 1.
- Names influencing simulation parameters (forbidden by CLAUDE.md §7).
- Fabricated catalog IDs (Kepler, TESS, KOI numbers) — the `EXO-{hash}` designation remains the honest identity.
- Thumbnail screenshots of the 3D viewport in Phase 1 (WebGL readback is fragile in tests; defer).
- Multiplayer, comments, likes, or gamified leaderboards.
- Replacing ADR-007 input encoding — the physics token format is unchanged.

---

## 3. Vision & charter alignment

| Principle | How this feature serves it |
|---|---|
| **Ownership** (VISION §3) | Naming + archive makes "this is my world" tangible without faking science. |
| **Discovery** (VISION §3) | Archive is a personal log of worlds *found*, not worlds *authored*. |
| **Scientific credibility** (Pillar I) | `EXO-{hash}` designation always visible; name is explicitly labeled "Common name". |
| **Physics hierarchy** (CLAUDE §2) | Metadata is a fourth parallel layer: Physics → Visuals → AI → **Archive (UI-only)**. |
| **Deep Field Protocol** (Design Brief) | Archive UI uses existing tactical tokens: corner brackets, Space Mono designations, amber primary actions. |

---

## 4. Current state (baseline)

Understanding what exists avoids reinventing or violating boundaries.

### 4.1 Sharing (complete)

```
User edits inputs → simulation recomputes → App syncs #w=<token> to URL
ShareLink → copies window.location.href
Token = base64url({ v: schemaVersion, c: PlanetConfiguration })
```

Relevant modules:

- `src/physics/configuration/url.ts` — encode/decode (pure, DOM-free)
- `src/ui/worldUrl.ts` — `#w=` fragment read/write via `replaceState`
- `src/store/app.ts` — `loadConfigurationToken`, `encodeConfigurationToken`
- `src/ui/ShareLink.tsx` — clipboard copy button

### 4.2 Identity (complete)

- `configurationHash` — SHA-256 of schema version + canonical configuration (`manifest.ts`)
- HUD designation — `EXO-{hash[0:6].toUpperCase()}` (`ViewportHud.tsx`)
- Procedural terrain seed — derived from full hash (`shaderUniforms.ts`)

### 4.3 State stores (complete)

| Store | Holds | Influences physics? |
|---|---|---|
| `simulation` | `PlanetConfiguration`, `PlanetaryState`, diagnostics | Yes (inputs only) |
| `history` | Undo/redo stack of configurations | Indirectly (re-applies inputs) |
| `ui` | Temperature unit, active panel, speculation toggle | No |

**There is no persistence layer today.** Archive is net-new.

### 4.4 Constraints to preserve

- SPA, no backend (ADR-007 rationale).
- `ui/` must not import physics calculation modules.
- Decode is a trust boundary — malformed tokens return diagnostics, never throw.
- Design Brief: no fabricated science; identifiers from real content hash.

---

## 5. Concept — "Exploration Archive"

The feature is branded in-product as the **Exploration Archive** (eyebrow: `SUBSYSTEM 09 · EXPLORATION LOG`). It is the scientist's personal catalog of worlds they have designated and chosen to remember.

### 5.1 Two-name model

Every world has **two names**, always distinct in the UI:

| Layer | Source | Example | Role |
|---|---|---|---|
| **System designation** | `configurationHash` (computed) | `EXO-A3F2B1` | Immutable, honest, unique per physical world |
| **Common name** | User (or optional AI suggestion) | `Aurelia` | Memorable, shareable, cosmetic |

Display rule when a common name exists:

```
AURELIA                    ← Rajdhani, --cyan-bright, uppercase
EXO-A3F2B1 · Common name   ← Space Mono micro, --text-secondary
```

When no common name is saved, behavior is unchanged (designation only).

### 5.2 Archive entry vs. world identity

An archive entry is keyed by `configurationHash`. The same physical world always maps to one canonical hash; a user may have **at most one archive record per hash** (rename updates in place). Loading a shared URL for a hash that already exists in the archive restores the saved common name.

---

## 6. Architecture

### 6.1 Layer placement

```
PlanetConfiguration  ──►  Physics Engine  ──►  PlanetaryState
       ▲                                              │
       │                                              ▼
  URL token (#w=)                              Renderer / AI / Translation
       
WorldArchiveEntry  ──►  Archive Store  ──►  Archive UI
  (cosmetic only)         ▲
                          │
                   localStorage adapter
```

**Hard rule:** `WorldArchiveEntry` never flows into `commitConfiguration` or `applyConfiguration`. Loading an archive entry extracts its `shareToken` (or re-encodes from stored configuration snapshot) and calls the existing `loadConfigurationToken` path.

### 6.2 New modules

| Path | Responsibility |
|---|---|
| `src/types/archive.ts` | `WorldArchiveEntry`, `ArchiveState`, validation types |
| `src/store/archive.ts` | Pub/sub store, CRUD actions, in-memory source of truth |
| `src/store/archivePersistence.ts` | `localStorage` read/write, schema version, migration |
| `src/ui/ArchivePanel.tsx` | Browse/search saved worlds |
| `src/ui/DesignateWorldModal.tsx` | Name + save flow |
| `src/ui/WorldArchiveCard.tsx` | Single entry card (presentational) |
| `src/ui/ShareLink.tsx` | Extended: share with name metadata |
| `src/ui/ViewportHud.tsx` | Show common name when known |
| `src/ui/worldUrl.ts` | Optional `#n=` display-name param |

### 6.3 Store composition

Extend `AppStores`:

```ts
interface AppStores {
  simulation: SimulationStore;
  ui: UIStore;
  history: HistoryStore<PlanetConfiguration>;
  archive: ArchiveStore;   // new
}
```

`createAppStores()` hydrates the archive from `localStorage` on creation. Persistence writes are debounced (≤300 ms) after any archive mutation.

### 6.4 Resolving the active display name

A pure selector (lives in `store/archive.ts`, tested):

```ts
function resolveDisplayName(
  archive: ArchiveState,
  configurationHash: string | null,
): { commonName: string | null; designation: string | null }
```

- `designation` = `EXO-${hash.slice(0,6).toUpperCase()}` when hash present.
- `commonName` = `archive.entries[hash]?.commonName ?? null`.
- UI components receive resolved strings as props — no archive imports inside presentational children (Design Brief compliance).

---

## 7. Data model

### 7.1 `WorldArchiveEntry`

```ts
/** Schema version of the archive persistence format (independent of physics schema). */
export const ARCHIVE_SCHEMA_VERSION = '1.0.0';

interface WorldArchiveEntry {
  /** Matches PlanetaryState.configurationHash — primary key. */
  configurationHash: string;

  /** User-chosen common name. Never sent to physics. */
  commonName: string;

  /** ADR-007 share token at time of save (allows load without re-encoding). */
  shareToken: string;

  /** ISO-8601 UTC timestamp of when the user designated this world. */
  designatedAt: string;

  /** ISO-8601 UTC timestamp of last rename or re-save. */
  updatedAt: string;

  /**
   * Optional snapshot of key readouts for card display without recomputation.
   * Derived from PlanetaryState at save time; stale if physics models change.
   * Marked `estimated` — cards show "as cataloged" not live values.
   */
  catalogSnapshot?: {
    spectralClass: SpectralClass;
    semiMajorAxisAu: number;
    surfaceTemperatureKelvin: number;
    surfaceGravityEarthG: number;
    survivabilityScore: number;
    habitableZonePosition: HabitableZonePosition | 'unknown';
    limitingFactor: SurvivalFactorId | 'unknown';
  };
}
```

### 7.2 `ArchiveState`

```ts
interface ArchiveState {
  schemaVersion: string;
  entries: Readonly<Record<string, WorldArchiveEntry>>; // keyed by configurationHash
  /** Most recently loaded or designated hash — UI highlight only. */
  activeHash: string | null;
}
```

### 7.3 Persistence envelope (`localStorage`)

Key: `exogenesis.archive.v1`

```json
{
  "v": "1.0.0",
  "entries": [ /* WorldArchiveEntry[] as array for stable JSON */ ]
}
```

On load: migrate envelope `v` forward if needed (same pattern as configuration migrations). Corrupt storage → empty archive + single `info` diagnostic surfaced once in the archive panel ("Archive could not be read — starting fresh.").

### 7.4 Name validation

Pure function `validateCommonName(name: string): ValidationResult`

| Rule | Rationale |
|---|---|
| Trim leading/trailing whitespace | UX |
| Length 1–40 characters after trim | Fits HUD; prevents abuse |
| Allowed: letters (any script), numbers, spaces, hyphen, apostrophe | International names; "Ross 128 b" style |
| Reject: control chars, `<`, `>`, `"`, `&`, URLs, leading `#` | XSS / HTML injection when rendered as text |
| Reject: names that match `/^EXO-[0-9A-F]{6}$/i` | Avoid impersonating system designations |
| Empty after trim → invalid | Must be intentional |

Invalid names return a `SimulationDiagnostic`-shaped message for consistent UI error display.

**Names are never HTML — always `textContent` rendering.**

---

## 8. URL format extension

ADR-007's `{v,c}` physics envelope is **unchanged**. Display metadata travels in separate fragment parameters parsed only by `worldUrl.ts`.

### 8.1 Fragment shape

```
#w=<token>&n=<displayName>
```

| Param | Required | Consumed by | Notes |
|---|---|---|---|
| `w` | Yes (for shared worlds) | `decodeConfiguration` | Existing ADR-007 token |
| `n` | No | Archive UI + HUD only | URL-encoded UTF-8 common name |

`encodeURIComponent` / `decodeURIComponent` for `n`. Max length enforced on read (40 chars); truncate with diagnostic if longer.

### 8.2 Load behavior when `n` is present

1. `loadConfigurationToken(stores, w)` — unchanged physics path.
2. If decode succeeds and `n` validates:
   - If no archive entry for this hash → show non-blocking prompt: **"Register '{n}' in your Exploration Archive?"** (amber confirm / dim dismiss).
   - If entry exists with different name → show: **"This link calls this world '{n}'. Update your archive?"**
3. `n` never auto-overwrites without explicit user confirmation.

### 8.3 Share behavior

`ShareLink` extended flow:

1. If current world has a saved common name → copy URL with `w` + `n`.
2. If not saved but user clicks share → copy `w` only (current behavior).
3. New **"Designate & Share"** path (amber): opens `DesignateWorldModal`, on save copies full URL with `n`.

Clipboard API unchanged; graceful fallback message on permission denial.

---

## 9. UX flows

### 9.1 Flow A — Designate current world (primary)

**Trigger:** `Designate World` tactical button in header (right cluster, beside Share).

**Preconditions:** `simulation.status === 'ready'` and `planetaryState !== null`.

**Steps:**

1. Modal opens — eyebrow `SUBSYSTEM 09`, title `DESIGNATE WORLD`.
2. Shows read-only designation `EXO-XXXXXX` and three readout chips (surface temp, gravity, HZ position) so the user confirms *which* world they are naming.
3. Text input: `Common name` with placeholder `e.g. Aurelia`.
4. Optional Phase 2: `Suggest names` button → AI returns 3 labeled suggestions; picking one fills input (user may edit).
5. **Confirm** → `archive.save(entry)` → debounced persist → modal closes.
6. HUD updates immediately with common name.
7. Brief status line in header: `WORLD REGISTERED IN ARCHIVE` (2 s, reuse `share-confirm` pattern).

**If hash already in archive:** modal opens in **rename** mode with current name pre-filled.

### 9.2 Flow B — Browse archive

**Trigger:** `Exploration Archive` button (header left of history, or tab in parameter console).

**Panel layout:**

- Search/filter field (filters on common name + designation substring).
- Sort: `Recent` (default) | `Name A–Z` | `Survivability`.
- Scrollable list of `WorldArchiveCard` components.

**Card contents:**

- Common name (large) + designation (micro)
- Three snapshot readouts from `catalogSnapshot`
- Habitability arc or score chip (color from status tone)
- Actions: `Load` (primary), `Rename`, `Delete` (with confirm), `Copy link`

**Load:**

1. `loadConfigurationToken(stores, entry.shareToken)`
2. Set `archive.activeHash`
3. Reuse existing `scanning` console pulse (App.tsx) — "REACQUIRING SIGNAL"

### 9.3 Flow C — Share with context

**Trigger:** Enhanced `ShareLink` dropdown or split button:

| Action | Behavior |
|---|---|
| `Copy link` | Current URL (includes `n` if designated) |
| `Copy mission brief` | Plain text: name, designation, URL, one translation line |

Mission brief example:

```
AURELIA (EXO-A3F2B1)
A super-Earth orbiting a K-type star at 0.42 AU — surface gravity 1.6g.
https://exogenesis.example/#w=...&n=Aurelia
```

### 9.4 Flow D — First visit from shared link

1. App loads `#w=...&n=Zephyr`.
2. World renders (existing).
3. Toast/banner: **"Signal tagged: ZEPHYR — Add to your archive?"**
4. Accept → save with provided name. Decline → show name in HUD for session only (`ui` ephemeral `sessionDisplayName`) until navigation away.

Session-only display prevents forcing archive writes while still honoring the sharer's intent.

---

## 10. UI components (summary)

All new components follow `docs/CLAUDE_DESIGN_BRIEF.md`: prop-driven, plain CSS, sharp corners, semantic HTML, `aria-label` on icon buttons.

| Component | Key props |
|---|---|
| `DesignateWorldModal` | `designation`, `readouts`, `initialName`, `onConfirm`, `onCancel`, `busy` |
| `WorldArchiveCard` | `entry`, `isActive`, `onLoad`, `onRename`, `onDelete`, `onCopyLink` |
| `ArchivePanel` | `entries`, `activeHash`, `filter`, callbacks — or wired via store hooks |
| `WorldIdentity` | `commonName`, `designation`, `size: 'hud' \| 'header' \| 'card'` |

### 10.1 HUD changes (`ViewportHud.tsx`)

When `commonName` resolved:

```
┌─────────────────────────┐
│ COMMON NAME             │
│ AURELIA                 │  ← new, larger
│ DESIGNATION · EXO-A3F2B1│  ← existing key relabeled
└─────────────────────────┘
```

`aria-hidden="true"` remains on the HUD (decorative); a visually hidden live region announces designation changes for screen readers.

### 10.2 Header changes (`SystemHeader.tsx`)

Add archive toggle and `Designate World` button. Keep density balanced — on narrow viewports, archive moves behind a `◫ LOG` icon button.

---

## 11. Store API

```ts
interface ArchiveStore extends Store<ArchiveState> {
  /** Upsert by configurationHash. Validates name. Returns diagnostics. */
  designate: (input: {
    configurationHash: string;
    commonName: string;
    shareToken: string;
    catalogSnapshot: WorldArchiveEntry['catalogSnapshot'];
  }) => readonly SimulationDiagnostic[];

  rename: (configurationHash: string, commonName: string) => readonly SimulationDiagnostic[];
  remove: (configurationHash: string) => void;
  setActive: (configurationHash: string | null) => void;

  /** Sorted entries for display. Pure sort keys passed in. */
  list: (sort: ArchiveSortKey, filter?: string) => readonly WorldArchiveEntry[];

  /** Hydration status for first-load UI. */
  hydrated: boolean;
}
```

Coordinated action in `store/app.ts`:

```ts
async function designateCurrentWorld(
  stores: AppStores,
  commonName: string,
): Promise<readonly SimulationDiagnostic[]>
```

Reads live `planetaryState` + `encodeConfigurationToken(configuration)` — never accepts configuration from UI directly without going through simulation state.

---

## 12. Phase 3 — Public catalog (outline only)

Deferred until Phase 1 proves retention value. Direction for the record:

- **Opt-in publish** from archive card → POST metadata + token to API.
- Server stores: `configurationHash`, `commonName`, `shareToken`, `publishedAt`, optional `authorDisplayName`, `reportCount`.
- **No physics on server** — token is opaque; clients recompute.
- Moderation: profanity filter on names, report button, rate limits.
- Browse UI: `PUBLIC DEEP FIELD` read-only grid; filters by spectral class, HZ position.
- Requires ADR-009 and backend choice (conflicts with current no-backend MVP — acceptable as explicit phase break).

---

## 13. AI name suggestions (Phase 2)

Aligns with CLAUDE.md §7 ("Generate flavor text for UI: Names, discovery narratives").

- New prompt: `src/ai/prompts/planetName.v1.ts`
- Returns `AIContent` with `kind: 'suggestion'` and exactly three `{ name, rationale }` pairs.
- Rationale is one sentence tying the name to a **computed** property (temperature, composition, HZ).
- UI labels section **"Provisional designations (suggested)"** — not catalog names.
- User selection fills the input; nothing saved until Confirm.
- Disabled when narration client unavailable (same pattern as `NarrationPanel`).

---

## 14. Testing strategy

| Module | Coverage target | Key cases |
|---|---|---|
| `validateCommonName` | 100% | valid names, unicode, length bounds, XSS chars, EXO- impersonation |
| `archive` store | 80% | designate, rename, remove, list sort/filter, duplicate hash upsert |
| `archivePersistence` | 80% | round-trip, corrupt JSON, schema migration, quota exceeded |
| `worldUrl` | 80% | `n` param round-trip, missing `w`, oversized `n` |
| `resolveDisplayName` | 100% | with/without entry, null hash |
| `DesignateWorldModal` | interaction | confirm disabled when invalid, rename prefill |
| `ArchivePanel` | interaction | load dispatches token, delete confirms |
| `ShareLink` | interaction | copies `n` when designated |

**Do not test:** `localStorage` in component tests — inject mock persistence adapter.

**Regression:** existing ADR-007 round-trip tests must remain green; `n` param must not affect decode.

---

## 15. Implementation phases

### Phase 1a — Data layer (ship independently)

- Types, validation, archive store, localStorage persistence, tests.
- No UI beyond a dev-only smoke hook if needed.

### Phase 1b — Designate + HUD

- `DesignateWorldModal`, header button, HUD identity display, `resolveDisplayName`.

### Phase 1c — Archive panel

- `ArchivePanel`, `WorldArchiveCard`, load/rename/delete.

### Phase 1d — Enhanced sharing

- `worldUrl` `n` param, extended `ShareLink`, import-from-link prompt, mission brief copy.

### Phase 2 — AI suggestions + polish

- Name prompt, suggestion UI, animation polish, empty-archive onboarding copy.

### Phase 3 — Public catalog

- Backend ADR, API, browse UI (separate spec).

Each sub-phase: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build` green.

---

## 16. Performance & storage budgets

| Concern | Budget |
|---|---|
| Archive size | Soft-warn at 180 entries; **hard cap at 200 — require the user to delete an entry before designating a new one (never silently evict a named world)** |
| Entry JSON size | ~500 bytes without snapshot; ~800 with snapshot |
| `localStorage` total | < 200 KB typical; handle `QuotaExceededError` with user-visible diagnostic |
| Persist debounce | 300 ms |
| List render | Virtualize if > 50 entries (unlikely in Phase 1) |

---

## 17. Accessibility

- Modal: focus trap, `Escape` closes, initial focus on name input.
- Archive list: `role="list"` / `role="listitem"`, keyboard navigation between cards.
- Delete: confirmation dialog with focus on Cancel by default (destructive guard).
- All icons have `aria-label`; status messages use `role="status"`.

---

## 18. Open questions — RESOLVED (2026-06-14)

| # | Question | Resolution |
|---|---|---|
| Q1 | Max archive entries? | **Soft-warn at 180; hard cap at 200 requiring manual delete. No silent LRU eviction** — a named world is never removed without explicit user action. |
| Q2 | Show sharer's `n` in HUD for non-archive session-only viewers? | **Yes** — `sessionDisplayName` in the `ui` store; shown for the session, never auto-written to the archive. |
| Q3 | Include `catalogSnapshot` in v1 or compute on card render? | **Snapshot at save** — cards render instantly from the snapshot, labeled "as cataloged". |
| Q4 | Split button vs. separate Designate / Share buttons? | **Separate buttons** — clearer intent, easier to test. |

**Scope decision (2026-06-14):** the first implementation plan covers **all of Phase 1 (1a–1d)** — data layer, Designate + HUD, Archive panel, and enhanced sharing — staged as internal sub-phases with verification checkpoints. Phase 2 (AI suggestions) and Phase 3 (public catalog) remain separate, later specs/plans.

---

## 19. Out of scope (this spec)

- Cloud sync, accounts, OAuth.
- Viewport thumbnail generation.
- Editing physics parameters from archive (load → edit uses existing input panels).
- Embedding names inside the `{v,c}` physics envelope.
- Changes to `PlanetConfiguration` or `PlanetaryState` schemas.

---

## 20. Success criteria

**Quantitative (Phase 1)**

- User can designate, close browser, reopen, and find the world in archive.
- Shared URL with `n=` shows the name to recipient without altering recomputed physics.
- 100% of physics/url round-trip tests still pass.

**Qualitative ("feeling test")**

Show the feature to a user for 5 minutes after they have tuned a world. Ask:

> "What did you just catalog?"

Pass: they answer with their **common name** and can describe the world scientifically.  
Fail: they describe it as "a save file" or don't understand designation vs. name.

---

## 21. Related documents

- `docs/VISION.md` — Ownership, sharing metrics
- `docs/adr/007-shareable-world-url-format.md` — Physics token format (unchanged)
- `docs/CLAUDE_DESIGN_BRIEF.md` — Visual system for new components
- `.claude/CLAUDE.md` §7 — AI may suggest cosmetic names
- `ROADMAP.md` Post-MVP: "Educational exploration mode", "Comparison to known exoplanet catalog"

---

*This spec describes what to build and why. Implementation plans belong in `docs/superpowers/plans/`.*

---

## Status: Phase 1 implemented (2026-06-14)

Phases 1a–1d shipped and visually verified by the project owner:

- **1a — data layer:** archive types, `validateCommonName` + `resolveDisplayName` (100%-tested pure helpers), `localStorage` persistence adapter (corrupt-data + quota safe), the archive store (CRUD, sort/filter, capacity guard), and integration into `AppStores` with hydration and the `designateCurrentWorld` action.
- **1b — designate + HUD:** `WorldIdentity`, common-name display in the HUD, `DesignateWorldModal`, and the header `Designate World` button.
- **1c — archive panel:** `WorldArchiveCard`, the `ArchivePanel` (search/sort/load/rename/delete), and the header `Exploration Archive` toggle.
- **1d — enhanced sharing:** the `n` display-name URL param, `sessionDisplayName` for borrowed names, the extended `ShareLink` (copy link + mission brief), and inbound-name handling.

Capacity follows the resolved decision: soft-warn at 180, hard cap at 200, no silent eviction. Cosmetic metadata only — no physics/renderer/translation/AI-prompt changes. Recorded as ADR-008. Phase 2 (AI name suggestions) and Phase 3 (public catalog) remain separate, later specs.
