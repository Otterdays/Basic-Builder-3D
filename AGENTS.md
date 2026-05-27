# AGENTS.md — Builder-3D

**Read this first.** This repo is a vanilla JS + Three.js 3D builder. Most logic lives in one file (`main.js`). Follow these rules so you do not break releases, docs, or blueprints.

**New agents:** Start here — not `DOCS/SUMMARY.md`, not `SCRATCHPAD`, not a subfolder rule file alone. Other rule docs are summaries or extensions of this file.

---

## For AI agents (entry point)

| Layer | File | Role |
|-------|------|------|
| **Canonical** | **`AGENTS.md`** (this file) | Full playbook — read every session |
| Always-on (Cursor) | `.cursor/rules/builder-3d-project.mdc` | Short summary; defers here |
| Doc workflow | `DOCS/RULES_AGENTS.md` | Preservation + post-task doc updates |
| Releases | `DOCS/RULES_RELEASES.md` | Ship checklist detail |

**Keep in sync:** If you change agent onboarding, hard rules, shortcuts, or release workflow in any rule file above, **update this `AGENTS.md` in the same task** so the next agent still lands here first.

---

## Quick start (every task)

1. **Read this file** (`AGENTS.md`) — at least **Hard rules**, **Release & version**, **Blueprint format**, and **Code map** (skip only if you already read them this session and nothing changed).
2. **Read status docs** (in order): `DOCS/SUMMARY.md` → `DOCS/SCRATCHPAD.md` → `DOCS/SBOM.md` (if touching deps) → `DOCS/STYLE_GUIDE.md`.
3. **Read code you will change** — never assume APIs exist; grep `main.js` first.
4. **Match existing patterns** in `main.js`, `index.html`, `style.css`.
5. **Update docs when you ship** — see [Documentation](#documentation-mandatory-rules) below.
6. **Do not commit or push** unless the user explicitly asks.

---

## Hard rules (never break these)

| Rule | Why |
|------|-----|
| **Never delete or replace** content in `DOCS/*` | Preservation headers require **append / annotate / `[AMENDED date]`** only |
| **Never bump version** without syncing all release artifacts | Users see wrong modal / pill / changelog |
| **Never add npm deps** without updating `DOCS/SBOM.md` + user justification | Security / supply chain |
| **Never change `BLUEPRINT_VERSION`** casually | Breaks saved blueprints; only bump with migration plan |
| **Never run destructive git** (`push --force`, `reset --hard`) unless user asks | Data loss |
| **Never commit secrets** (`.env`, keys) | Security |
| **Never skip reading a file before editing it** | This codebase is not split into many modules |

---

## Release & version (user-facing ship)

**Canonical source:** `APP_RELEASE` in `main.js` (`version`, `dateLabel`, `highlights[]`).

When shipping a release, update **all** of these the same day:

1. `main.js` — `APP_RELEASE` (and `highlights` = short user-facing bullets for the modal)
2. `package.json` — `"version"` **must match** `APP_RELEASE.version`
3. `DOCS/CHANGELOG.md` — new `## [x.y.z] - date` section at **top**
4. `DOCS/SUMMARY.md` — one `[AMENDED date]:` line for current version
5. `DOCS/SCRATCHPAD.md` — note under Active Tasks or Last 5 Actions

**Optional:** `DOCS/ARCHITECTURE.md` if behavior/architecture changed; `DOCS/SBOM.md` if dependencies changed.

**Full checklist:** `DOCS/RULES_RELEASES.md`

**Verify:** Header `#app-version-pill` shows `v` + version; “What’s new” modal lists highlights; blueprint save still loads.

---

## Blueprint format (persistence)

- **`BLUEPRINT_VERSION`** in `main.js` — integer schema version (currently **3**), **not** the app semver.
- **v3 payload:** `{ v, site: { outerMaterial, innerMaterial }, parts: [...] }`
- **Import** must stay backward compatible: older saves without `site` still load (`applySiteFromBlueprint` no-ops).
- **Use `buildBlueprintPayload()`** for export, clipboard, draft, and cloud save — do not hand-build partial JSON.

---

## Documentation (mandatory rules)

Every file under `DOCS/` starts with:

```html
<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
```

- **Append** new sections at the **top** (fresh info first) or add `[AMENDED YYYY-MM-DD]:` lines.
- **Do not** rewrite history, delete changelog entries, or “clean up” old notes.
- **Status docs** to touch during work: `SCRATCHPAD`, `CHANGELOG`, `SUMMARY`; `SBOM` when deps change.
- **Do not** edit `README` / `ARCHITECTURE` / `STYLE_GUIDE` content unless the task requires it or user asks.

---

## Code map (where things live)

| Area | Files |
|------|--------|
| App logic | `main.js` — `BuilderApp` class (scene, placement, undo, blueprints, FP, cloud) |
| UI | `index.html`, `style.css` |
| API client | `api.js` |
| Backend | `server/index.js`, `server/db.js`, `server/routes/*` |
| Textures | `assets/textures/*.png` (+ procedural fallback in `main.js`) |
| Launch | `launch.bat` — `npm install` + `npm run dev` (port 3000) |

**Constants to respect:**

- `ITEM_TYPES` — toolbar items + keyboard `1`–`9`, `0` = index 9
- `MATERIAL_KEYS` — material picker + `M` cycle
- `FENCE_ITEMS` / `FENCE_POST` — fence snap and chain logic
- `APP_RELEASE` — in-app version / modal only
- `BLUEPRINT_VERSION` — save file schema
- **Sidebar**: `#sidebar`, `--sidebar-width` / `--sidebar-slot-width`; `initSidebarChrome()`, `initFastTooltips()`; localStorage `builder3d-sidebar-collapsed`, `builder3d-sidebar-width`, `builder3d-panel-design` (`classic` | `pop` → `body.sidebar-design-pop`), `builder3d-theme`; header **Design** / **Light panel** toggles

---

## Adding features (checklist)

1. **Geometry** — `getItemGeometry()` switch; add to `ITEM_TYPES` if it is a placeable piece.
2. **Placement** — `updateGhost()` / `trySnapFenceGhost()` patterns; overlap via `ghostOverlapsPlaced`.
3. **UI** — `index.html` `data-item` / `data-material` buttons; icons in `style.css` (`.icon-*`).
4. **Shortcuts** — `bindEvents()` keydown block; update help (`#help-backdrop`) and `#controls-hint`.
5. **Persistence** — `meshToSnapshot` / `createMeshFromSnapshot`; takeoff uses `ITEM_TYPES`.
6. **Docs** — `CHANGELOG` + `SCRATCHPAD`; `ARCHITECTURE` if non-trivial.

**Outdoor / site features:** ground uses `plane` (outer 100×100) + `innerPlane` (20×20); `siteGround` + `applyGroundMaterials()`. Grassy preset: `applyGrassyYardPreset()` (`U`).

**Fence kit:** `fence_post`, `fence_rail`, `fence_panel`; wood auto-select in `setActiveItem`; `N` = `placeNextFencePost()`.

**Sidebar UI:** Full-height `#sidebar` in `index.html` + `style.css` grid. Collapse **`B`**; resize via `#sidebar-resizer`; do not use native `title` alone for sidebar hints — use `initFastTooltips()` or `data-tip` pattern. Clicks on sidebar must not place parts (`closest('#sidebar')` in mousedown).

**Shortcut traps:** `B` = panel toggle (not build level). `Y` = rotation axis. `U` = grassy yard. `G` = grid. `C` = clone hovered part. `I` = eyedropper (if present in build).

---

## Cursor / IDE rules

- **Always applied:** `.cursor/rules/builder-3d-project.mdc` — must point agents to **`AGENTS.md`** first; never replace this file.
- **`DOCS/RULES_AGENTS.md`** — doc preservation and tables; defers to this file for hard rules and releases.
- This file (`AGENTS.md`) is the **human + agent onboarding** doc; update it whenever workflow or agent rules change anywhere in the repo.

---

## Git

- **Commits:** only when the user asks. Message style: `feat(scope): …` / `fix` / `docs` / `chore` per user rules.
- **No** `git config` changes, **no** `--no-verify`, **no** force-push to `main` without explicit request.

---

## Common mistakes (avoid)

- Editing only `package.json` version without `APP_RELEASE`.
- Saving blueprints without `buildBlueprintPayload()` (loses `site` in v3).
- Using `Y` for a new shortcut — **`Y` is rotation axis**; yard preset is **`U`**.
- Using `G` for grass — **`G` toggles grid**.
- Breaking sidebar layout without updating `--sidebar-slot-width` consumers (crosshair, stats, grid).
- Adding a second `main.js` or new framework without user approval.
- Deleting SCRATCHPAD history to “clean up”.

---

## Doc index

| Doc | Purpose |
|-----|---------|
| **`AGENTS.md`** (root) | **Agent entry point** — read before coding |
| `DOCS/RULES_AGENTS.md` | Doc preservation + post-task updates (extends this file) |
| `.cursor/rules/builder-3d-project.mdc` | Cursor always-on summary (extends this file) |
| `DOCS/SUMMARY.md` | Project status + quick links |
| `DOCS/SCRATCHPAD.md` | Active work, last actions, blockers |
| `DOCS/CHANGELOG.md` | Version history |
| `DOCS/ARCHITECTURE.md` | System design + amended behavior notes |
| `DOCS/STYLE_GUIDE.md` | Naming, trace tags, release note |
| `DOCS/RULES_RELEASES.md` | Release checklist (detailed) |
| `DOCS/SBOM.md` | Dependencies / CDN pins |
| `roadmap.md` | Backlog (root) |

**Current shipped version:** see `APP_RELEASE.version` in `main.js` (also `package.json`).
