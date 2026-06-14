# Report — Fable 5 has no "Model Built-In" web search toggle in Cherry

- **Status:** ✅ Fixed — see [`retro.md`](retro.md).
- **Area:** `src/renderer/src/config/models/websearch.ts` (renderer model-capability allow-list).

**Setup:** Anthropic API, added `claude-fable-5` as a model. It chats fine, but there is **no
"Model Built-In" web search option** for it (the toggle the native Anthropic web search lives
behind).

## What Fable 5 actually is (2026-06-09)

`claude-fable-5` is Anthropic's new **Mythos-class** model (a tier above Opus), released June 9,
2026. 1M context, 128k output, adaptive-thinking always-on, $10/$50 per MTok. Its safeguards route
a small % of sessions (cyber / bio-chem / distillation) to **Opus 4.8**, but that's unrelated to
search.

Its web search is **the same server-side Anthropic web search tool as Opus 4.8** — nothing new.
Two tool versions exist and both list Fable as supported on the Claude API:
- `web_search_20250305` — classic, GA, returns `web_search_tool_result` blocks directly.
- `web_search_20260209` — agentic, dynamic filtering via the code-execution sandbox.

So this is **not** an API limitation. Fable supports built-in web search; the client just has to
send the tool.

## Root cause — stale model allow-list in Cherry

`isWebSearchModel()` gates first-party Anthropic models behind a hardcoded regex,
`CLAUDE_SUPPORTED_WEBSEARCH_REGEX`. It matched only Claude 3.5/3.7 and the Claude **4** series
(`claude-(haiku|sonnet|opus)-4...`, which is why `claude-opus-4-8` passes). It had **no branch for
the new "5"-gen Mythos-class names** (`claude-fable-5`, `claude-mythos-5`), so `isWebSearchModel()`
returned `false` → Cherry never offered the toggle.

## Why the fix is a one-liner

Our existing [`anthropic-websearch-json`](../anthropic-websearch-json/) patch already pins **all**
native Anthropic built-in web search to the classic `web_search_20250305` tool. So the moment Fable passes
`isWebSearchModel()`, it flows through the exact same working path Opus 4.8 uses — no new
sandbox/JSON-string issue. The only gap was the allow-list regex.
