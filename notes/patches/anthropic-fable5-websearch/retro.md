# Retro — enable built-in web search for Fable 5 / Mythos 5

- **Status:** ✅ Shipped (2026-06-09).
- **Commit:** `feat(models): detect Anthropic fable/mythos models as vision and web search capable`
  (one commit covers both this and the [`anthropic-fable5-vision`](../anthropic-fable5-vision/)
  patch). Find the current hash with `git log --grep="fable/mythos"`.
- **Re-apply on a new release:** cherry-pick it. Lives in renderer
  `src/renderer/src/config/models/websearch.ts`, heavily reworked in v2 — if it conflicts, re-add a
  `claude-(?:fable|mythos)-\d+` branch to whatever the v2 equivalent of
  `CLAUDE_SUPPORTED_WEBSEARCH_REGEX` / `isWebSearchModel()` is.

## What shipped

Extended `CLAUDE_SUPPORTED_WEBSEARCH_REGEX` with one more alternative so the new "5"-gen
Mythos-class names are recognized as web-search-capable:

```text
...|claude-(haiku|sonnet|opus)-4(?:-[\w-]+)?|claude-(?:fable|mythos)-\d+(?:-[\w-]+)?)\b
```

`claude-(?:fable|mythos)-\d+(?:-[\w-]+)?` matches `claude-fable-5`, `claude-mythos-5`, and any future
numbered Fable/Mythos checkpoints (e.g. `claude-fable-5-20260609`).

## Files touched

- `src/renderer/src/config/models/websearch.ts` — added the fable/mythos branch to the regex.
- `src/renderer/src/config/models/__tests__/websearch.test.ts` — added a parametrized case asserting
  `claude-fable-5` and `claude-mythos-5` are web-search models on the first-party Anthropic provider.

## Tests

`pnpm test:renderer` — 163 files / 2938 tests pass, including the new Mythos-class case.

## Scope / caveats

- **First-party Anthropic provider only.** The Vertex branch in `isWebSearchModel()` still gates on
  `isClaude4SeriesModel`, so Fable on **Vertex** won't get the toggle until that helper is widened
  too. Not needed for the API setup; revisit if we ever run Fable through Vertex.
- **Classic tool, by design.** Because of the `anthropic-websearch-json` patch, Fable uses
  `web_search_20250305`, so we don't get Fable's dynamic-filtering token savings — same trade-off we
  already accepted for Opus 4.8, and it's the version that actually works in this build.
