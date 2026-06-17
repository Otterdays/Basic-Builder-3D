<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## Active Tasks
[AMENDED 2026-06-17]: **v1.2.0** — Release sync + push: promoted sidebar `[Unreleased]` to **1.2.0**; `APP_RELEASE`/`package.json` bumped; pushed to `origin/main`.
[AMENDED 2026-06-17]: **v1.1.1** — Release sync + push: bumped `APP_RELEASE`/`package.json`, formal CHANGELOG `[1.1.1]` section, update modal post-processing highlight; pushed to `origin/main`.
[AMENDED 2026-05-21]: **v1.1.0** — Post-processing pipeline: `EffectComposer` (HalfFloat MSAA target, `samples:4`), `GTAOPass` (contact-shadow AO), `UnrealBloomPass` (strength 0.5 / radius 0.4 / threshold 0.82), `OutputPass` (ACESFilmic+sRGB). `setupComposer()` + `renderFrame()` in `main.js`; `onResize` propagates to composer; camera synced each frame for ortho/persp; fallback to direct render on GPU failure. CHANGELOG/SUMMARY/SBOM/SCRATCHPAD updated.
[AMENDED 2026-06-17]: **Docs** — sidebar/grid/sky/draft modal shipped as **v1.2.0** (`CHANGELOG` `[1.2.0]`, `SUMMARY`, `ARCHITECTURE`).
[AMENDED 2026-05-21]: **v1.1.0** — Atmosphere pass shipped: gradient sky, terrain horizon, haze ring, hemisphere fill, warmer directional light, softer fog.
[AMENDED 2026-05-21]: Docs synced — CHANGELOG/SUMMARY/ARCHITECTURE/AGENTS for sidebar dock, collapse (`B`), resize, fast tooltips, panel QoL.
[AMENDED 2026-05-21]: **v1.1.0** — Premium Enhancements shipped: shadows/sun slider, paintbrush + eyedropper, placement VFX, wedge/stairs, `C` clone, collapsible/resizable tools panel.
[AMENDED 2026-05-21]: **v1.1.0** — Premium Enhancements (shadows, sun angle slider, eyedropper, paintbrush tool, placement particles, wedges, stairs) — planning & awaiting user feedback.
[AMENDED 2026-05-21]: **Agent docs** — root `AGENTS.md`, `DOCS/RULES_AGENTS.md`, expanded `.cursor/rules/builder-3d-project.mdc`, ARCHITECTURE/RULES_RELEASES/SUMMARY links.
[AMENDED 2026-05-21]: **v1.0.3** — Grassy yard (`U`), fence kit + snap/N/], Paint Both (`H`), blueprint v3 site, QoL Q counter-rotate, `0` item key — shipped.
[AMENDED 2026-04-27]: **v1.0.1** — Update modal (`APP_RELEASE` + `builder3d-seen-release`), What’s new button, header version pill, Esc stack, `DOCS/RULES_RELEASES.md`, `.cursor/rules/builder-3d-project.mdc`, STYLE_GUIDE + ARCHITECTURE amended.
[AMENDED 2026-04-27]: Shipped **v1.0.0 Update 2**: plan ortho + V, compass rotate, camera Home/F, copy JSON clipboard, localStorage draft autosave + restore prompt, Esc / Del / backtick FPS stats, Alt ¼ m snap, reduced-motion particles off, dup PEX button fix — docs SCRATCHPAD/SUMMARY/SBOM/CHANGELOG/ARCHITECTURE/roadmap.
- [x] Project initialization <!-- id: 0 -->
- [x] Basic Three.js scene setup <!-- id: 1 -->
- [x] Material/Item picker UI <!-- id: 2 -->
- [x] 3D Object placement logic <!-- id: 3 -->
- [x] Expanded construction materials (Iron, Sheetrock, etc.) <!-- id: 5 -->
- [x] Custom item shapes (Pipes, Plates, Hooks, Pots) <!-- id: 6 -->
- [x] Outdoor simulated materials (Grass, Asphalt, Glass) <!-- id: 7 -->
- [x] Full 3-Axis Rotation System (X/Y/Z controls) <!-- id: 8 -->
- [x] Separate inner/outer ground planes with independent painting <!-- id: 9 -->
- [x] Premium styling & VFX (Sidebar UI, Plan View, Jump, Water Particles) <!-- id: 4 -->
- [x] Water material & Pipe Spray system <!-- id: 11 -->
- [x] Premium Procedural Texture Expansion (Marble, Cobblestone, etc.) <!-- id: 12 -->
- [ ] Mobile/Touch support <!-- id: 10 -->

## Last 5 Actions
1. Docs: `CHANGELOG` [Unreleased], `SUMMARY`, `ARCHITECTURE`, this scratchpad — sidebar QoL batch documented.
1. Sidebar **Design** toggle (`#design-toggle-btn`, `builder3d-panel-design`, `body.sidebar-design-pop`) — pop-open button sections with card drop-down styling.
1. Agent doc chain: `AGENTS.md` first; rule files must read and sync root playbook.
1. Sky clouds toggle (Lighting); draft-restore in-app modal (non-blocking); sidebar stagger enter on load.
1. Site & grid: split 1 m (G) + 5 m guide buttons; lighting sun slider layout fix (sticky/overflow).
1. Sidebar: bright section titles; light/dark panel theme toggle (`builder3d-theme`); takeoff collapsible groups + expand/collapse all.
1. 5 m spacing guides: custom `LineSegments` (full hide when off); button/tooltip copy; Takeoff section + export tooltips.
1. Sidebar section fold state → `localStorage` `builder3d-sidebar-sections` (per `data-section-id`); restore on load; width/collapse keys unchanged.
1. Updated DOCS (CHANGELOG, SUMMARY, ARCHITECTURE, AGENTS) for tools-panel UX.
2. Sidebar collapse (`B`), drag-resize + dbl-click reset, expand tab, expand/collapse all sections, scroll-to-active tile.
2. v1.1.0: added clone-under-cursor shortcut (`C`) on top of premium builder tools; docs and help copy updated.
1. Full-height left `#sidebar` dock (top–bottom), larger tiles/buttons, renamed primary sections, viewport chrome for hints.
2. Fast sidebar tooltips (`initFastTooltips`, 200ms) — replaces native `title` delay on `#sidebar`.
2. Added `AGENTS.md`, `DOCS/RULES_AGENTS.md`; expanded `.cursor/rules/builder-3d-project.mdc` and doc cross-links.
2. Designed and drafted the implementation plan for v1.1.0 Premium Enhancements (shadows, sun angle slider, eyedropper, paintbrush tool, placement particles, wedges, stairs).
3. v1.0.3: grassy yard, fence items/snap, blueprint site v3, UI + shortcuts (U/H/N/]/Q/0).
3. Architected and built a complete Local Backend System (`server/index.js`, `server/db.js`, `server/routes`).
4. Implemented a zero-dependency JSON storage engine to avoid native compilation issues on Windows.
5. Added full `projects` and `blueprints` REST APIs with auto-versioning history and gallery thumbnails.
[AMENDED 2026-04-27]: Git remote origin `https://github.com/Otterdays/Basic-Builder-3D` — pushed branch `main` (repo was empty).
4. Expanded the sidebar UI to include the new architectural materials.
5. Updated project documentation (SUMMARY, SBOM, CHANGELOG) to v1.0.1.
6. v1.0.1: update modal + RULES_RELEASES + cursor rules + version pill.
7. v1.0.0: ortho plan+V, compass HUD, drafts, QoL shortcuts, docs pass.
8. Integrated Water material (transparent blue) for all item types.
9. Implemented Pipe Leak (Spray) item with dedicated particle system.
10. Added surface-normal alignment for Spray jets (water shoots out from holes).
11. Optimized particle system using object pooling.
12. Fixed overlap sensitivity bug (added 0.005m margin).
13. Implemented vertical "Snap Lock" for pipes/columns to allow easy stacking.
14. Exempted 'spray' item from overlap checks to allow pinning to pipes.
15. Logged v0.9.0 release.

[AMENDED 2026-04-27]: Line 20+ remain historical; current release work is line 1 + amended block in Active Tasks.

## Blockers
- None.

## [AMENDED 2026-04-23] Roadmap Update 1 complete (v0.6.0)
- Remaining `roadmap.md` Update 1 items implemented: measure (T), site readout + 5 m major grid, lighting presets (L), place emissive flash, help (?), ghost overlap + block, repeat (P), build level 0–4 + filter + takeoff by level + blueprint `level`, compass HUD. `BLUEPRINT_VERSION` 2.

## [AMENDED 2026-04-23] First-person walk (v0.4.1)
- `main.js` + toolbar + crosshair: toggle walk mode, AABB vs placed meshes, ground ray, safe spawn at center.

## [AMENDED 2026-04-23] Update 1 — shipped (v0.4.0)
- Roadmap (top-to-bottom): Phase 0 (ARCHITECTURE note + texture fallbacks + loading UI), Update 1 Core (undo/redo, blueprint save/load, takeoff, shortcuts, clear confirm + toasts), Deeper: export takeoff TSV.
- `main.js`: `BuilderApp` with history stacks, `meshToSnapshot` / `createMeshFromSnapshot`, clipboard TSV, file import.
- `index.html` / `style.css`: loading overlay, toast host, takeoff + blueprint + redo controls.

## Out-of-Scope Observations
- `assets/textures` may be empty in some worktrees; fallbacks keep the scene usable.
