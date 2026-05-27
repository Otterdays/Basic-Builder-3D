<!-- PRESERVATION RULE: Never delete or replace content. Append or annotate only. -->

# Release & update modal (Builder-3D)

[AMENDED 2026-05-27]: **AI agents** start at repo root **`AGENTS.md`** (hard rules + release overview); use this file for the detailed ship checklist.

When you ship a **user-facing** release, keep these in lockstep so the in-app update modal, header version pill, and docs stay accurate.

## Single source in code

In `main.js`:

- **`APP_RELEASE.version`** — semver string (e.g. `'1.0.1'`). Drives the modal title, header pill (`#app-version-pill`), and `localStorage` key **`builder3d-seen-release`** (user is not re-prompted until this value changes).
- **`APP_RELEASE.dateLabel`** — Human-readable date for the modal (e.g. `'2026-04-27'`).
- **`APP_RELEASE.highlights`** — Short bullet strings (plain text). Shown in **`#update-list`**. Keep these user-facing; move long technical detail to `CHANGELOG` / `ARCHITECTURE`.

## Documentation to update the same day

1. **`DOCS/CHANGELOG.md`** — New `## [version] - date` section (append at top; preservation rule applies).
2. **`DOCS/SUMMARY.md`** — One amended line for the current shipped version.
3. **`package.json`** — `"version"` matches **`APP_RELEASE.version`** (helps workspace tooling and confusion checks).
4. **`DOCS/SCRATCHPAD.md`** — Brief note under Active Tasks or Last actions when you cut a release.

## Optional

- **`DOCS/SBOM.md`** — Amend only if CDN `three` version or dependencies change.
- **`DOCS/ARCHITECTURE.md`** — If the release changes behavior worth an architecture note.

## Verify

- Open the app: header shows **`v` + version**.
- After clearing `localStorage` key `builder3d-seen-release` (or bumping **`APP_RELEASE.version`**), the modal should appear after startup (after draft-restore prompt runs, if any).
- **What’s new** in the toolbar opens the same modal without requiring a version bump.

See also:

- **`AGENTS.md`** (repository root) — agent onboarding and hard rules.
- **`DOCS/RULES_AGENTS.md`** — doc preservation and post-task updates.
- **`.cursor/rules/builder-3d-project.mdc`** — Cursor always-on rule summary.
