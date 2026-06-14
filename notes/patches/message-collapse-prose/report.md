# Report — mid-message tool call collapses the prose above it

- **Status:** ✅ Fixed — see [`retro.md`](retro.md)
- **Area:** renderer (`src/renderer/src/pages/home/Messages/Blocks/`)

**Symptom:** A turn yaps → makes a tool call mid-way → yaps more. After the turn *finishes*, the
renderer reorders/collapses it: the tool call jumps to the top inside a `N tool calls · M
thoughts · K messages` pill, and the prose written **before** the tool call gets swallowed into
that collapsible group, so you can't read the first half without expanding.

## Root cause (confirmed in v1.9.9)

File: `src/renderer/src/pages/home/Messages/Blocks/index.tsx`

1. **When does it trigger?** Only after streaming ends:
   ```ts
   const allowCollapseExecutionDetails = !(message.role === 'assistant' && isProcessing)
   ```
   While streaming, blocks render in order; the instant the turn completes, collapsing kicks in —
   exactly the "it happens after the message completes" behavior.

2. **The collapse predicate** — `shouldCollapseExecutionDetails`: collapse if there are
   thinking/tool blocks **and** all tool blocks are completed **and** there is main-text output
   **after the last** execution block.

3. **The actual bug** — `groupCompletedExecutionBlocks` (original code):
   ```ts
   const firstExecutionIndex = blocks.findIndex(isExecutionDetailBlock)   // first THINKING/TOOL
   const lastExecutionIndex  = blocks.findLastIndex(isExecutionDetailBlock) // last THINKING/TOOL
   return [
     ...blocks.slice(0, firstExecutionIndex),
     blocks.slice(firstExecutionIndex, lastExecutionIndex + 1),  // <-- everything in between, folded
     ...blocks.slice(lastExecutionIndex + 1)
   ]
   ```
   It folds the **entire span from the first to the last execution block into one group** — and
   that span includes any `MAIN_TEXT` (prose) blocks that sit *between* execution blocks. So prose
   written before a mid-turn tool call is captured in the collapsed group.

4. **The pill text** — `ToolBlockGroup.tsx` → `GroupHeaderContent`: counts `MAIN_TEXT` blocks
   inside the group as `messageBlockCount` → the "K messages" part. So the "messages" count is
   literally your folded prose. Group collapses by default once completed.

Only the **trailing** main-text (after the last execution block) stays visible — which is why the
"second half" shows and the "first half" disappears.

## Fix levers considered (cheapest → most thorough)

1. **Group only *contiguous* execution blocks.** A `MAIN_TEXT` block breaks the run, instead of
   spanning first→last. Prose between tool calls renders inline; only adjacent thinking/tool runs
   collapse. Most faithful to the complaint, local to `index.tsx`. ← **chosen**
2. Only collapse the *trailing* execution run, leaving everything before the final prose inline.
3. Exclude `MAIN_TEXT` from the folded group (splice prose back out so it renders in order).
4. Default the group to expanded (weakest — stops hiding, not the reorder).
5. Make it a setting (heaviest; `CLAUDE.md` blocks new slices/state-shape until v2.0.0).

## Test plan

Renderer test (jsdom) feeding `[main_text, thinking, tool(done), main_text, tool(done), main_text]`
into the grouping helper, asserting leading/in-between `MAIN_TEXT` blocks are **not** inside a
collapsed group. The grouping helpers are pure functions in `index.tsx` — export for direct testing.
