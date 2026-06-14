<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# CHANGELOG

## [Unreleased]
### Added
- **Sidebar section persistence**: per-section fold state in **`builder3d-sidebar-sections`** (`data-section-id` on `.section-toggle`); restored in **`initSidebarChrome()`**.
- **Panel themes**: **Light panel** / **Dark panel** header toggle; **`body.theme-light`** whitish sidebar + dark text; persisted **`builder3d-theme`**.
- **Design layout**: **Design** header toggle; **`body.sidebar-design-pop`** card-style section bodies; persisted **`builder3d-panel-design`** (`classic` | `pop`).
- **Takeoff UI**: collapsible groups (pieces / materials / levels) with **Expand all** / **Collapse all** toolbar inside the Takeoff section.
- **Site & grid controls**: side-by-side **1 m grid (G)** and **5 m guides** buttons; 1 m uses existing **`gridHelper`** + **`G`**; 5 m uses dedicated **`LineSegments`** (fully hidden when off).
- **Sky clouds**: **Sky clouds** checkbox under Lighting; procedural streaks on gradient sky canvas; persisted **`builder3d-sky-clouds`**.
- **Draft restore modal**: **`#draft-restore-backdrop`** replaces blocking **`window.confirm`** on startup so the scene and sidebar keep animating behind the prompt.
- **Sidebar enter animation**: staggered `.tool-section` fade/slide on load (`#sidebar.is-entering` → **`is-ready`**); respects **`prefers-reduced-motion`**.
### Changed
- **Section title contrast**: all `.section-toggle` labels use **`--sidebar-fg`** (no dim secondary color on non-primary sections).
- **Lighting layout**: sun slider in **`.field-stack--sun`**; sticky section headers only on **primary** sections (fixes slider clipped by next header).
- **5 m guides**: tooltip and button copy clarify difference from 1 m placement grid.

## [1.1.0] - 2026-05-21
### Added
- **Premium builder tools**: real-time shadows, sun position slider, paintbrush material edits, eyedropper (`I` / middle-click), placement dust VFX, roof wedge, and stair geometry.
- **Atmosphere depth pass**: gradient sky, distant terrain silhouettes, horizon haze, hemisphere fill light, warmer daylight, and softer fog so the scene no longer reads like a black lunar void.
- **Clone hovered part**: press **`C`** while hovering a placed piece to duplicate it one grid step outward; clone operations use normal undo/redo, takeoff, draft save, and placement VFX.
- **Tools panel (`#sidebar`)**: full-height left dock (top–bottom), larger 4-column material/item tiles, renamed sections (**Materials & site**, **Pieces to place**), `#viewport-chrome` for bottom shortcut hints.
- **Collapsible / resizable panel**: **`B`** or **‹** hides panel; **› Tools** tab reopens; drag right edge to resize (260–480px, persisted); double-click resizer resets width; state in **`builder3d-sidebar-collapsed`** / **`builder3d-sidebar-width`**.
- **Panel QoL**: fast tooltips (`initFastTooltips`, ~200ms); **Expand all** / **Collapse all** footer; scroll-to-active tile on pick; auto-expand folded section when selecting material/item; `:focus-visible` on controls.
### Changed
- Placement clicks ignore **`#sidebar`** (was `#toolbar` only); walk crosshair and stats overlay track **`--sidebar-slot-width`** when panel hidden or resized.

## [1.0.3] - 2026-05-21
### Documentation
- **`AGENTS.md`** (repo root) and **`DOCS/RULES_AGENTS.md`** — agent onboarding, hard rules, release/blueprint checklists; expanded **`.cursor/rules/builder-3d-project.mdc`**.

### Added
- **Grassy yard preset**: Toolbar + **`U`** — grass on outer and inner ground, selects grass material, switches lighting to dusk.
- **Fence kit**: `fence_post`, `fence_rail`, `fence_panel` items (wood by default); snap rails/panels to posts; chain posts on side click (+2 m); **`N`** places next post along the row.
- **Ground QoL**: **Paint Both** button + **`H`**; blueprint **v3** stores `site.outerMaterial` / `site.innerMaterial` (draft, save, load, cloud).
### Changed
- **`0`** selects item 10 (spray); fence pieces in Items toolbar.
- **`Q`** counter-rotates ghost; **`]`** cycles fence piece types.

## [1.0.1] - 2026-04-27
### Added
- **Update modal**: “What’s new” dialog on new versions (`APP_RELEASE` in `main.js`); dismiss persists **`builder3d-seen-release`** in `localStorage`. Toolbar **What’s new** reopens notes; **Esc** / **Got it** / backdrop close dismiss and record seen version.
- **Version pill** in the header (`v#.#.#`) from **`APP_RELEASE`**.
- **Documentation**: `DOCS/RULES_RELEASES.md` (release checklist); **`.cursor/rules/builder-3d-project.mdc`** (agent rules for version sync).

## [1.0.0] - 2026-04-27
### Added
- **Plan view wired**: Toolbar **Plan View** and **`V`** toggle orthographic top-down (`OrthographicCamera` + `OrbitControls`); persp/ortho resize via unified **`onResize()`**; restores saved orbit state when exiting plan.
- **Compass HUD**: Rotates with camera yaw (orbit azimuth / first-person `fp.yaw`).
- **Camera QoL**: **`Home`** resets perspective orbit to default; **`F`** frames all placed meshes (and plan extents in ortho).
- **Blueprint**: **Copy JSON to clipboard** button (same payload as Save JSON).
- **Browser draft autosave**: Debounced **`localStorage`** snapshot after structural edits; startup **confirm** to restore unfinished builds.
- **Keyboard QoL**: **`Esc`** exits walk mode, closes help, or turns off measure (in order); **`Delete`** / **`Backspace`** removes part under cursor; **`` ` ``** toggles FPS + part-count overlay.
- **Alt fine snap**: Hold **Alt** for **¼ m** grid placement (`updateGhost`) with readout hints.
### Changed
- **Materials UI**: Removed duplicate **PEX (Red)** preview tile (`index.html`).
### Accessibility / performance
- **`prefers-reduced-motion`**: Spray particle emission disabled when the OS requests reduced motion.

## [0.9.0] - 2026-04-23
### Added
- **Water Material**: A semi-transparent blue material with high gloss for creating pools or water-filled structures.
- **Pipe Leak (Spray) Item**: A specialized item that emits a real-time water particle stream.
- **Particle System**: Integrated a high-performance particle engine with gravity physics and object pooling for water effects.
- **Smart Alignment**: Spray jets automatically align to the surface normal, making water shoot out realistically from pipes or walls.
- **Overlap Fix**: Reduced collision sensitivity by adding a small margin (0.005m) to intersection checks, allowing blocks to be placed perfectly adjacent without false overlap errors.
- **Pipe Snap Lock**: Implemented vertical stacking logic for pipes and columns. Aiming at a pipe while placing another now "snap locks" it to the top center of the existing one.
- **Spray Exemption**: Exempted the 'spray' (leak) item from overlap checks, allowing it to be pinned directly to the surface of pipes, pex, and blocks.

## [0.8.0] - 2026-04-23
### Added
- **PEX Tubing**: Added a new "PEX Tubing" item type, which is a thin flexible-style pipe.
- **PEX Materials**: Added "PEX (Red)" and "PEX (Blue)" materials for distinct hot/cold water line routing.
- **Intuitive Snapping**: PEX tubing features a specialized snapping algorithm. Instead of snapping to full grid cells, it snaps to 0.25m increments and automatically offsets itself by its exact radius off the surface normal. This makes running lines along walls, floors, or ceilings extremely smooth and intuitive.
- **Shortcuts**: Hotkeys `1-9` now map to items (PEX is `9`).

### Documentation
- [AMENDED 2026-04-23]: `DOCS/ARCHITECTURE.md` — new subsection: first-person ground ray (inner → outer → objects), jump/snap, `clampFpToSitePad` walkable bounds, AABB vs rotated-mesh caveat. `DOCS/SUMMARY.md` — v0.8.0 + FP line. `DOCS/SCRATCHPAD` / `DOCS/SBOM` — housekeeping.

## [0.7.0] - 2026-04-23
### Added
- **Plan View**: Toggle between Perspective and Orthographic (top-down) views via the "Plan View" button or <kbd>V</kbd>.
- **Jump Physics**: Added vertical movement and jump (<kbd>Space</kbd>) to First-Person Walk mode.
- **Help Update**: Shortcuts for Plan View and Jump are now documented in the help overlay and controls hint.
### Fixed
- [AMENDED 2026-04-23]: First-person: ground ray tests inner + outer planes (correct floor height on nested sites); `trySlipTo` no longer y-snaps past ~1.2m up (stops “invisible wall” from wrong ground or tall plane jumps); `syncFirstPersonCamera` every frame in walk; slightly tighter `PLAYER_HW`.
- [AMENDED 2026-04-23]: First-person: “invisible” stick/snap on jumps — `isFpOnGround` was ~20 cm lenient; now feet must be within 6 cm of ground Y and not rising, plus skip surface snap while moving up. Ground ray list **inner** then **outer**; small **step down** for inner/outer seam; XZ **clamped** to the 100 m floor pad.

## [0.6.2] - 2026-04-23
### Changed
- **Sidebar Redesign**: The toolbar is now wrapped in a scrollable, compact container.
- **Collapsible Sections**: Tool sections can now be collapsed/expanded by clicking their headers to save vertical space.
- UI elements (buttons, grids, typography) have been tightened up for a cleaner, premium glassmorphism feel.

## [0.6.1] - 2026-04-23
### Fixed
- First-person: `isPlayerAabbBlocked` used `_pMin` / `_pMax` without constructing them (runtime error on walk mode).
- Favicon: inline SVG `data:` favicon in `index.html` to avoid `/favicon.ico` 404 on `serve`.

## [0.6.0] - 2026-04-23
### Added (Update 1 roadmap — layout, deeper)
- **Measure**: two-click distance in world units; line in scene; toolbar + **T** toggle; clear control; supports inner/outer planes.
- **Site readout** (cursor X/Y/Z) + optional **5 m major grid** on the 20 m floor.
- **Lighting presets** (work / dusk / night) via select + **L**; ambient, sun, accent, background, fog adjusted.
- **Placement feedback**: brief **emissive flash** on new parts.
- **Help overlay** (**?**, Help button, Esc to close) with shortcuts including **P** repeat and **T** measure.
- **Overlap**: ghost turns **red** when AABB would intersect placed parts; placement blocked if overlapping.
- **Repeat last** (**P**): same part as last placement at **ghost** position with last **saved rotation**; collision check.
- **Build level** (0–4) on new parts; takeoff **by level**; **Show only this level** visibility filter; blueprint `level` field (format v2).
- **Compass HUD** (+X / +Z / N toward −Z).

## [0.5.0] - 2026-04-23
### Added
- **Zoned Ground Planes**: The environment is now split into an "Outer Ground" and an "Inner Build Zone" (20x20 matching the grid).
- **Surface Painting**: You can independently paint the outer ground and inner zone using the currently selected material via new UI buttons under the materials panel.

## [0.4.1] - 2026-04-23
### Added
- **First-person walk** mode: toolbar toggles "Walk (first person)"; **WASD** moves on the ground, **mouse** (pointer lock) looks, crosshair when locked. Spawn at the **site center** (0, 0) with a safe **feet** height: raycast to ground/parts, then AABB eject/offset if the body would start inside a part. **AABB** player versus placed meshes blocks walking through parts.
### Notes
- Orbit + placement are disabled while walking; return via the same button.

## [0.4.0] - 2026-04-23
### Added
- **3-Axis Rotation System**: Full control over object orientation using R (Rotate) and X/Y/Z (Axis select) keys.
- Persistence support for rotated objects in blueprints.
- Updated UI hints for advanced controls.

## [0.3.0] - 2026-04-23
### Added
- Outdoor Materials: Grass, Asphalt, Glass (Simulated with Three.js Standard Materials).
- Performance optimizations for material loading.
- Improved UI with solid color previews for non-textured materials.

## [0.2.0] - 2026-04-23
### Added
- New Materials: Black Iron, Sheetrock, Terracotta.
- New Items: Iron Pipe, Wall Plate, Steel Hook, 2x4 Lumber, Planter Pot.
- Dynamic height snapping logic in 3D scene.
- Updated UI icons and material previews.

## [0.1.0] - 2026-04-23
### Added
- Core 3D Builder scene with Three.js.
- Grid-based placement system.
- Construction material textures (Wood, Concrete, Brick, Steel).
- Item types: Block, Beam, Slab, Column.
- Premium Glassmorphism UI.
- Undo and Clear functionality.
