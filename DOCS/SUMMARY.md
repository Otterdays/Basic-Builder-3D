# SUMMARY
Project: Builder-3D
[AMENDED 2026-06-17]: **v1.2.0** — Shipped sidebar QoL + post-processing release sync: themes, Design layout, grid/sky controls, draft modal, takeoff groups; `APP_RELEASE` / `package.json` at **1.2.0**.
[AMENDED 2026-06-17]: **v1.1.1** — Shipped post-processing release sync: `APP_RELEASE` / `package.json` / CHANGELOG aligned; update modal highlights AO + bloom + tone mapping.
[AMENDED 2026-05-21]: **v1.1.0** — Post-processing pipeline (`main.js`): GTAOPass contact-shadow AO + UnrealBloomPass emissive/highlight glow + OutputPass ACESFilmic+sRGB via EffectComposer; HalfFloat MSAA render target; camera-synced ortho/persp; graceful GPU fallback.
[AMENDED 2026-05-27]: **Sidebar QoL (shipped v1.2.0)** — section fold + theme + Design layout persistence; takeoff groups; 1 m / 5 m grid buttons; sky-clouds toggle; non-blocking draft-restore modal; sidebar enter animation. See **`CHANGELOG`** `[1.2.0]` and **`ARCHITECTURE.md`** (2026-05-27 amendment).
[AMENDED 2026-05-27]: **AI agents:** entry point is repo root **`AGENTS.md`** (read first every session); then this file and **`SCRATCHPAD.md`**. Rule chain: `.cursor/rules/builder-3d-project.mdc` → **`AGENTS.md`** → **`DOCS/RULES_AGENTS.md`**.
[AMENDED 2026-05-21]: **v1.1.0** — atmosphere depth pass added: gradient sky, distant terrain silhouettes, horizon haze, warmer daylight, and softer fog.
[AMENDED 2026-05-21]: **v1.1.0** — premium tools (shadows, sun slider, paintbrush, eyedropper, VFX, wedge/stairs, **`C`** clone) + full-height **collapsible/resizable** tools panel (**`B`**, drag edge, fast tooltips, expand/collapse all).
[AMENDED 2026-05-21]: **Status:** v1.1.0 — see **`AGENTS.md`** for agent rules; UI layout in **`ARCHITECTURE.md`** (sidebar section).
[AMENDED 2026-05-21]: **v1.0.3** — **Grassy yard** preset (`U`), **fence** post/rail/panel with snap + `N` chain, **Paint Both** (`H`), blueprint v3 site ground materials.
[AMENDED 2026-04-27]: **v1.0.2** — **Local Backend System**: Replaced static serve with a lightweight Node.js Express server. Pure JS local JSON database (`data/db.json`) for zero-configuration, robust persistence. Added **Projects**, **Cloud Save**, **Gallery**, and **Auto-Versioning History**.
[AMENDED 2026-04-27]: **v1.0.1** — **Update 3 (Expansion)**: Premium **Procedural Texture Generator** (Marble, Cobblestone, Shingles, upgraded Grass/Asphalt); expanded material palette; image fallback system; performance-optimized 512px canvas generation.
[AMENDED 2026-04-27]: **v1.0.1** — **Update modal** + header version pill (`APP_RELEASE`); **What’s new** toolbar + `localStorage` dismiss key; release rules: `DOCS/RULES_RELEASES.md`, `.cursor/rules/builder-3d-project.mdc`.
[AMENDED 2026-04-27]: **v1.0.0** — **Update 2 (QoL)**: orthographic **Plan View** / **`V`** + resize wiring; live **compass** rotation; **Home** / **F** camera framing; blueprint **copy to clipboard**; **local draft** autosave + restore prompt; **Esc** (walk/help/measure); **Del** delete; backtick (**`**) stats FPS; hold **Alt** for **¼ m** snap; **reduced-motion** disables spray particles. See `CHANGELOG` / `ARCHITECTURE` (Update 2).
[AMENDED 2026-04-23]: **v0.8.0** — **PEX** tubing + materials, intuitive PEX grid snapping; first-person: **WASD** / **Space** / pointer lock, 100 m walk pad, ground ray (inner then outer) + AABB vs parts. See `DOCS/ARCHITECTURE.md` (first-person section).
Status: v0.7.0 — **Plan View** (Ortho/V) + **Jump** physics (Space). <!-- historical -->
[AMENDED 2026-04-23]: v0.6.0 — **Update 1** roadmap items complete (measure, grid/readout, lighting, flash, help, overlap, repeat, levels, compass); see `roadmap.md` (Later backlog only).
[AMENDED 2026-04-23]: v0.4.1 — First-person walk mode (WASD + pointer lock, AABB vs parts, safe spawn at center).
[AMENDED 2026-04-23]: v0.4.0 — Update 1 core QoL (undo/redo, blueprint, takeoff, shortcuts, texture fallbacks).
[AMENDED 2026-04-23]: Prior v0.3.0 line — Expanded materials and items, including simulated outdoor materials.
Goal: A premium 3D construction builder scene using vanilla JS and Three.js.

## Quick Links
- [AGENTS.md](../AGENTS.md) — **AI agents: read first** (rules, releases, blueprints, file map)
- [RULES_AGENTS.md](RULES_AGENTS.md) — doc preservation + agent task workflow
- [RULES_RELEASES.md](RULES_RELEASES.md) — version / update modal checklist
- [roadmap.md](../roadmap.md)
- [SCRATCHPAD.md](SCRATCHPAD.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [STYLE_GUIDE.md](STYLE_GUIDE.md)
