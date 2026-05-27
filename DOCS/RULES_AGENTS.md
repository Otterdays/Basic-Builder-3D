<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

# RULES_AGENTS — AI agent workflow

[AMENDED 2026-05-21]: Canonical onboarding moved to repo root **`AGENTS.md`**. This file expands doc-preservation and task workflows for agents that only read `DOCS/`.
[AMENDED 2026-05-27]: **All agents read `AGENTS.md` first** every session; this file does not replace it. Changing rules here or in `.cursor/rules/` requires updating **`AGENTS.md`** the same task.

## Before you write code

1. **`AGENTS.md`** (repository root) — hard rules, releases, blueprints, code map. **Required every session**; do not substitute `SUMMARY` or this file alone.
2. `DOCS/SUMMARY.md` — what version is shipped and what the app does.
3. `DOCS/SCRATCHPAD.md` — what humans/agents were doing last; do not contradict without annotating.
4. `DOCS/STYLE_GUIDE.md` — naming, `[TRACE: …]`, release bumps.
5. Grep/read the files you will edit (`main.js` is large; search first).

## Doc preservation (non-negotiable)

- **Never delete** paragraphs, changelog sections, or scratchpad history.
- **Never replace** an entire section with a shorter summary.
- **Do** add `[AMENDED YYYY-MM-DD]:` at the start of new or corrected lines.
- **Do** add new `##` sections at the **top** of changelogs and architecture when documenting new releases.

## After a user-facing change

| If you… | Then update… |
|---------|----------------|
| Shipped a version | `APP_RELEASE`, `package.json`, `CHANGELOG`, `SUMMARY`, `SCRATCHPAD`; see `RULES_RELEASES.md` |
| Changed placement / save format | `ARCHITECTURE.md` + bump `BLUEPRINT_VERSION` only with migration notes |
| Added npm package | `SBOM.md` + justify in SCRATCHPAD |
| Added shortcuts or items | `index.html` help + **`AGENTS.md`** (feature list / shortcuts) if workflow changed |
| Changed agent workflow or Cursor rules | **`AGENTS.md`** + `.cursor/rules/builder-3d-project.mdc` + this file (same task) |
| Changed sidebar / panel layout | `ARCHITECTURE.md` (sidebar section) + `CHANGELOG` under current semver |

## Out of scope

- Do not refactor unrelated files “while you are here.”
- Do not create commits/PRs unless the user asked.
- Flag unrelated issues in `SCRATCHPAD` under **Out-of-Scope Observations** instead of fixing silently.

## Pointer

Full agent playbook: **`/AGENTS.md`** (repository root).
