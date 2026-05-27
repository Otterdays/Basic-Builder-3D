<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->
# STYLE_GUIDE

## Conventions
- [AMENDED 2026-05-21]: **UI layout**: Tools live in **`#sidebar`** (full-height left dock); CSS vars **`--sidebar-width`**, **`--sidebar-slot-width`**; panel chrome in **`initSidebarChrome`** / **`initFastTooltips`** (`main.js`).
- [AMENDED 2026-05-27]: **Agents**: **`AGENTS.md`** (repo root) is the **only** onboarding entry — read it before `SUMMARY` / `SCRATCHPAD`; keep it in sync if you edit `.cursor/rules/` or **`RULES_AGENTS.md`**.
- [AMENDED 2026-05-21]: **Agents**: Read **`AGENTS.md`** (repo root) before coding; follow **`DOCS/RULES_AGENTS.md`** for doc edits; never delete `DOCS/*` content.
- [AMENDED 2026-04-27]: **Releases**: Bump **`APP_RELEASE`** in `main.js` and **`package.json`** version together; keep **`DOCS/CHANGELOG.md`** and (for agents) **`DOCS/RULES_RELEASES.md`** aligned. In-app copy: update modal body = `APP_RELEASE.highlights`.
- **Naming**: camelCase for JS, kebab-case for CSS.
- **Trace Tags**: `// [TRACE: filename.md]`
- **Comments**: WHY only.
- **Colors**: Premium dark mode, HSL tailored.
- **Three.js**: Use modules, clean scene management.
