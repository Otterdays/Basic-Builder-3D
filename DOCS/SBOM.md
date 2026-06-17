<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# SBOM

[AMENDED 2026-05-21]: **v1.1.0** — New CDN addon modules from `three@0.160.0/examples/jsm/` (same pinned version, loaded via `three/addons/` importmap): `postprocessing/EffectComposer.js`, `postprocessing/RenderPass.js`, `postprocessing/GTAOPass.js`, `postprocessing/UnrealBloomPass.js`, `postprocessing/OutputPass.js`. No new npm packages.
[AMENDED 2026-04-27]: **v1.0.2** — Added Node.js `express` (^4.19.2) as a local backend server to replace `npx serve`. Built a custom JSON-based storage engine (`server/db.js`) instead of SQLite to ensure zero native-compilation requirements.
[AMENDED 2026-04-27]: v1.0.1 — no dependency changes; **localStorage** also used for **`builder3d-seen-release`** (update modal dismiss version).
[AMENDED 2026-04-27]: v1.0.0 Update 2 — no new npm packages or CDN version changes (`three@0.160.0`); added **Clipboard API** + **`localStorage`** (browser built-ins) for blueprint copy/draft persistence.

## Dependencies
- Three.js (CDN: https://unpkg.com/three@0.160.0/build/three.module.js)
- OrbitControls (CDN: https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js)

## Assets
- `assets/textures/wood.png`: Generated wood texture.
- `assets/textures/concrete.png`: Generated concrete texture.
- `assets/textures/brick.png`: Generated brick texture.
- `assets/textures/steel.png`: Generated steel texture.
- `assets/textures/black_iron.png`: Generated black iron texture.
- `assets/textures/sheetrock.png`: Generated sheetrock texture.

[AMENDED 2026-04-23]: No new npm packages in v0.4.0; runtime remains CDN `three@0.160.0` + import map. Blueprint/takeoff are in-app (JSON/TSV).
[AMENDED 2026-04-23]: Doc pass only: no new dependencies; `three@0.160.0` + `OrbitControls` unchanged.

## Simulated Materials (Procedural Textures)
- **Terracotta**: Procedural earthy clay with noise variation.
- **Grass**: Procedural lush green with multi-tone noise.
- **Asphalt**: Procedural dark charcoal with fine stone speckles.
- **Marble**: Procedural white stone with grey veining.
- **Cobblestone**: Procedural stone path with rounded grout lines.
- **Shingles**: Procedural dark slate with staggered highlights.
- **Glass**: Solid color (#a9d0f5), transparent (0.5), reflective
- **Water**: Solid color (#0096ff), transparent (0.7), liquid shimmer

[AMENDED 2026-04-27]: Added premium procedural texture generator to `main.js` to bypass image quota and provide lightweight, infinite architectural textures.
