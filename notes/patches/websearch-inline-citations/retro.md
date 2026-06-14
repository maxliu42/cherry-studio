# Retro — web-search inline citations render as pills

- **Status:** ✅ Shipped (2026-06-05)
- **Commit:** `fix: render Anthropic web search inline citations as pills`. Find the current hash with
  `git log --grep="inline citations as pills"`.
- **Re-apply on a new release:** cherry-pick it. This is legacy renderer/`aiCore` code (replaced in
  v2); if those modules are gone upstream, re-derive from `report.md` rather than cherry-picking.

## What shipped

- `src/renderer/src/aiCore/chunk/AiSdkToChunkAdapter.ts` — inject inline `[N]` markers from Anthropic
  citation metadata (deferred to the end of the cited span; bibliography sources don't produce inline
  markers; stable per-URL numbering).
- `src/renderer/src/services/messageStreaming/callbacks/textCallbacks.ts` — coalesce *contiguous*
  citation-split text segments into one `MAIN_TEXT` block (a non-text block still breaks the run, so
  this composes with the `message-collapse-prose` grouping fix).
- `src/renderer/src/services/messageStreaming/callbacks/citationCallbacks.ts` — link the citation
  block to **all** main-text blocks (deduped), with the canonical `citationBlockId` key (the
  placeholder branch had been writing a wrong `{ blockId }` key).

## Tests

- `src/renderer/src/store/thunk/__tests__/streamCallback.integration.test.ts` — coalescing +
  multi-block linking (`text → web_search tool → text[2] → web-search-complete`, asserts all blocks
  linked).
- `src/renderer/src/aiCore/chunk/__tests__/AiSdkToChunkAdapter.citations.test.ts` — inline marker
  injection / numbering.

## Watch out (future)

Numbering assumes the search runs in a single AI-SDK step (one `finish-step`), which holds for
provider-executed web search. If a provider ever splits searches across multiple steps, revisit the
per-`finish-step` reset of `citationNumberByUrl` and the replace-vs-accumulate behavior of the
citation block in `onLLMWebSearchComplete`.
