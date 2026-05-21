<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

# RULES_AGENTS — AI agent workflow

[AMENDED 2026-05-21]: Canonical onboarding moved to repo root **`AGENTS.md`**. This file expands doc-preservation and task workflows for agents that only read `DOCS/`.

## Before you write code

1. `DOCS/SUMMARY.md` — what version is shipped and what the app does.
2. `DOCS/SCRATCHPAD.md` — what humans/agents were doing last; do not contradict without annotating.
3. `DOCS/STYLE_GUIDE.md` — naming, `[TRACE: …]`, release bumps.
4. Grep/read the files you will edit (`main.js` is large; search first).

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
| Added shortcuts or items | `index.html` help + `AGENTS.md` feature list if workflow changed |
| Changed sidebar / panel layout | `ARCHITECTURE.md` (sidebar section) + `CHANGELOG` under current semver |

## Out of scope

- Do not refactor unrelated files “while you are here.”
- Do not create commits/PRs unless the user asked.
- Flag unrelated issues in `SCRATCHPAD` under **Out-of-Scope Observations** instead of fixing silently.

## Pointer

Full agent playbook: **`/AGENTS.md`** (repository root).
