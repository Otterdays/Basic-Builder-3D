<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SCRATCHPAD

## Active Tasks
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
1. Architected and built a complete Local Backend System (`server/index.js`, `server/db.js`, `server/routes`).
2. Implemented a zero-dependency JSON storage engine to avoid native compilation issues on Windows.
3. Added full `projects` and `blueprints` REST APIs with auto-versioning history and gallery thumbnails.
4. Integrated a thin frontend `api.js` client and wired up a premium UI for Cloud Save and Gallery browsing.
5. Replaced the generic `serve` command in `launch.bat` with the new custom Express server.
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
