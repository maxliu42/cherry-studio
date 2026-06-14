# Retro — Claude web-search results arrive as a JSON string

- **Status:** ✅ Shipped (2026-06-04)
- **Commit:** `fix: pin Anthropic web search to web_search_20250305`. Find the current hash with
  `git log --grep="web_search_20250305"`.
- **Re-apply on a new release:** cherry-pick it. Lives in `packages/aiCore` (the v2 pipeline), so it
  should survive into v2-based releases — but re-confirm the tool version constant hasn't been
  renamed upstream.

## Root cause (verified live, not what the original report guessed)

It was **Anthropic's `web_search_20260209`** (agentic web search with *dynamic filtering*), **not**
Cherry stringifying anything. On Opus 4.6+/Sonnet 4.6 that tool auto-enables a server-side
**code-execution sandbox** and uses programmatic tool calling (the model writes Python like
`r = await web_search({...})`). **Inside that sandbox Anthropic hands the result to Python as a JSON
`str`** (raw snake_case API shape), so the model does `json.loads(r)` / hits `'str' object has no
attribute 'get'` — exactly the gripe. Cherry receives a *structured* array at the SDK boundary; the
string only ever exists inside Anthropic's sandbox, two layers upstream. Tool-use mode
(prompt vs function) made no difference.

(The original report's "Path A re-serialization" / "Path B `toModelOutput`" hypotheses were both
**wrong** — see [`report.md`](report.md), kept for history.)

## What shipped

Pinned the native Anthropic provider's web-search tool to the classic **`web_search_20250305`**
instead of `web_search_20260209`, in the `AnthropicExtension` `webSearch` toolFactory in
`packages/aiCore/src/core/providers/core/initialization.ts`. One-line change; config + output schema
are identical between versions. `web_search_20250305` is the pre-agentic tool that returns
`web_search_tool_result` content blocks **directly** — no sandbox, no JSON string, no
`code_execution`.

Verified after the swap: `requestBody.tools` = `web_search_20250305`, zero `code_execution`, clean
"1 tool call · 1 thought" answers, and the sandbox-timeout failures are gone.

## Trade-off

We lose dynamic filtering's token savings (raw search content now enters context instead of being
pre-filtered by Claude's code). Acceptable for this personal build; the reliability win is large.

## Follow-on

This unblocked, then exposed, the inline-citation rendering bug — see the
`websearch-inline-citations` patch.
