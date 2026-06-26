# Builder-3D — Roadmap

[AMENDED 2026-05-27]: **AI agents:** read **`AGENTS.md`** (repo root) first; release detail in **`DOCS/RULES_RELEASES.md`**.
[AMENDED 2026-04-27]: Release checklist for agents and humans: **`DOCS/RULES_RELEASES.md`** (sync **`APP_RELEASE`**, **`package.json`**, **`CHANGELOG`**).

## Phase 0 — Baseline

- [x] Align `DOCS/ARCHITECTURE.md` with current code (or split into real modules)
- [x] Texture loading: error handling, fallback material, optional loading UI

## Update 1 — Site-ready QoL

**Core**

- [x] Full undo / redo stack
- [x] Save / load build (JSON blueprint)
- [x] Live takeoff: counts by material and piece type
- [x] Keyboard shortcuts (pieces, material cycle, grid toggle)
- [x] Clear confirmation + toasts for destructive actions

**Layout & feel**

- [x] Measure tool (two points → distance in world units)
- [x] Grid + cursor readout; optional major/minor grid
- [x] Day / site lighting preset
- [x] Subtle placement feedback (e.g. flash or optional click sound)
- [x] Shortcuts / help overlay

**Deeper (still simple)**

- [x] **Overlap check** — ghost tints *blocked* when a placement would intersect existing pieces (lightweight AABB / bounds test).
- [x] **Repeat last** — one action to place the same type + material again (optionally step one cell on X/Z) for fast runs of identical parts.
- [x] **Build level tag** — integer “floor / lift” on each new piece; takeoff and optional show/hide by level (shallow Y-bands, no full BIM).
- [x] **Export takeoff** — copy live counts to clipboard as TSV/CSV (extends live takeoff).
- [x] **Compass + axes HUD** — small on-screen north / XZ so the slab reads like a site plan.

## Later

- [x] [AMENDED 2026-04-27]: Plan / orthographic view mode (**wired in `main.js`** — toolbar + `V`; was UI-only stub)
- [x] First-person jump physics
- [ ] Touch / a11y (focus, reduced motion)
- [ ] Instancing for many repeated parts
- [ ] Import simple `.glb` assets (equipment, props)
- [ ] [AMENDED 2026-06-26]: OBB or tighter collision for first-person vs rotated parts (AABB caveat in **`ARCHITECTURE.md`**)
