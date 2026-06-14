# Retro — enable vision (image input) for Fable 5 / Mythos 5

- **Status:** ✅ Shipped (2026-06-10).
- **Commit:** `feat(models): detect Anthropic fable/mythos models as vision and web search capable`
  (one commit covers both this and the [`anthropic-fable5-websearch`](../anthropic-fable5-websearch/)
  patch). Find the current hash with `git log --grep="fable/mythos"`.
- **Re-apply on a new release:** cherry-pick it. Lives in renderer
  `src/renderer/src/config/models/vision.ts`, reworked in v2 — if it conflicts, re-add a
  `claude-(?:fable|mythos)-\d+` entry to whatever the v2 equivalent of `visionAllowedModels` is.

## What shipped

Added one entry to `visionAllowedModels` next to the existing `claude-*` lines:

```text
'claude-(?:fable|mythos)-\\d+(?:-[\\w-]+)?',
```

Matches `claude-fable-5`, `claude-mythos-5`, and future numbered checkpoints
(`claude-fable-5-20260609`). That feeds `VISION_REGEX`, so `isVisionModel()` now returns `true` and
image attachments are accepted.

## Files touched

- `src/renderer/src/config/models/vision.ts` — added the fable/mythos entry to `visionAllowedModels`.
- `src/renderer/src/config/models/__tests__/vision.test.ts` — parametrized case asserting
  `claude-fable-5`, `claude-mythos-5`, `claude-fable-5-20260609` are vision models.

## Tests

`pnpm test:renderer` — 163 files / 2941 tests pass, including the new Mythos-class vision case.

## Note

Same class of bug as [`anthropic-fable5-websearch`](../anthropic-fable5-websearch/) — hardcoded
model-name allow-lists that only knew about 3.x/4.x families. If more Fable-5 capability gaps turn up
(e.g. function-calling / reasoning lists), check the other `visionAllowedModels`-style arrays in
`src/renderer/src/config/models/` for the same missing `fable`/`mythos` branch.
