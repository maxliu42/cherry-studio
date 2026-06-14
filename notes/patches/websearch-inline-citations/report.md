# Report — web-search inline citations render as plain `[N]`, not pills

- **Status:** ✅ Fixed — see [`retro.md`](retro.md)
- **Area:** renderer streaming pipeline (`aiCore/chunk` + `services/messageStreaming/callbacks`)

Follow-on from the `anthropic-websearch-json` patch. Once Anthropic native web search was pinned to
`web_search_20250305`, the answer came back with real `web_search_result_location` citations — but
they rendered badly: sentences were sheared into separate paragraphs, and the inline `[N]` markers
showed as plain text instead of interactive citation pills (and only in longer answers).

## Root cause (three interacting issues)

1. **Citation-split text blocks.** Anthropic streams the answer as a separate text content block per
   citation span. Each `TEXT_START/TEXT_COMPLETE` pair became its own `MAIN_TEXT` block, so the
   renderer drew a new paragraph at every citation — shearing sentences.
2. **No inline markers.** Nothing injected the `[N]` marker text from Anthropic's citation metadata
   into the prose, so there was nothing for the renderer to turn into a pill.
3. **The real "plain `[18]`" bug — only the first text block was linked.** The web-search tool is
   *provider-executed*, so it emits TOOL blocks (`handleToolCallChunk` →
   `MCP_TOOL_PENDING/COMPLETE`). A search-backed answer is therefore split into multiple `MAIN_TEXT`
   blocks (`text → [search tool] → text → …`). `onLLMWebSearchComplete` only attached the
   `citationBlockId` to `existingMainTextBlocks[0]`, so every *later* block had no citation block to
   resolve against and `MainTextBlock` skipped citation processing → markers rendered as literal
   `[18]`/`[1]`. Short single-block answers worked; multi-block ones didn't.

## How it was diagnosed

Compared a working short answer (single `MAIN_TEXT` block, citation rendered) against a failing long
one (`say hi → search → cite`, citation in a *later* block). Traced
`citationReferences[0]?.citationBlockId` from `Blocks/index.tsx` back through the callbacks; found
`onLLMWebSearchComplete` only linking block `[0]`, plus a wrong `{ blockId }` key (vs the canonical
`citationBlockId`) in the placeholder branch.
