# Report — Claude web-search results arrive as a confusing JSON string

- **Status:** ✅ Fixed — see [`retro.md`](retro.md).
- **Area:** `packages/aiCore` (v2 pipeline) — confirmed after the fact.

**Setup:** Anthropic API, web search = "Model Built-In".
**Symptom:** with Opus 4.8, a web search makes the model react "ack, json!" mid-turn — it gets a
JSON-encoded `str` instead of structured data, stumbles, and often only recovers on a second attempt.
Very consistent.

## Root cause

It's **Anthropic's `web_search_20260209`** tool (agentic web search with dynamic filtering), not
anything Cherry does. On Opus 4.6+/Sonnet 4.6 that tool auto-enables a server-side **code-execution
sandbox** and programmatic tool calling; **inside that sandbox Anthropic hands the result to the
model's Python as a JSON `str`** (raw API shape), so the model hits `json.loads`/`'str' has no
attribute 'get'`-style errors. Cherry receives a *structured* array at the SDK boundary — the string
only ever exists inside Anthropic's sandbox, two layers upstream. The fix is to not use that tool
version (see retro).

## How it was cracked (technique worth reusing)

The model's self-report ("the object is a `str`, repr starts `'[{"type": "web_search_result"…'`")
sounded like a confabulation but was literally true. What actually localized it:

1. A temp `[WS-DEBUG]` log in `handleToolResult` showed Cherry receives a **structured array**, not a
   string → ruled out Cherry re-serializing.
2. Logging the outgoing `request.body.tools` showed exactly one tool, **`web_search_20260209`**, and
   no `code_execution`.
3. Anthropic's docs for `web_search_20260209` confirmed it auto-enables the sandbox and
   JSON-stringifies results to the model's Python. (Caught the literal traceback in sandbox `stderr`
   once.)

> Earlier guesses that Cherry's `AiSdkToChunkAdapter` re-serialized the result, or that the Cherry
> web-search tool's `toModelOutput` JSON-fenced it, were both **wrong** — those paths weren't active
> for the Anthropic-native case. Lesson: log the actual outgoing request and the actual SDK-boundary
> shape before theorizing about internal code paths.

Throwaway personal patch on the stable line, not upstreamed — see
[`../../guide/contributing.md`](../../guide/contributing.md).
