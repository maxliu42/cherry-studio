# Retro — mid-message tool call collapses the prose above it

- **Status:** ✅ Shipped (2026-06-05)
- **Commit:** `fix: only collapse contiguous execution blocks in message renderer`. Find the current
  hash with `git log --grep="contiguous execution blocks"`.
- **Re-apply on a new release:** cherry-pick it. Touches only the legacy renderer block grouping; if
  `Messages/Blocks/index.tsx` is restructured upstream (v2), re-implement the "contiguous-run" idea
  rather than cherry-picking.

## What shipped

Implemented **fix lever 1** (contiguous grouping). `groupCompletedExecutionBlocks` in
`src/renderer/src/pages/home/Messages/Blocks/index.tsx` now walks the blocks and only folds
*contiguous* runs of execution blocks (THINKING/TOOL). Any non-execution block (e.g. `MAIN_TEXT`
prose) breaks the run, so it keeps rendering inline, in order, and is never swallowed into the
collapsed "N tool calls · M thoughts · K messages" pill.

## Files

- `src/renderer/src/pages/home/Messages/Blocks/index.tsx` — rewrote `groupCompletedExecutionBlocks`.

## Tests

- Renderer Vitest feeding a mixed `[main_text, thinking, tool, main_text, tool, main_text]` sequence
  and asserting the leading/in-between prose blocks are not collapsed.
