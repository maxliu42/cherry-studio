# Report — can't paste images into Fable 5 ("model does not support this file type")

- **Status:** ✅ Fixed — see [`retro.md`](retro.md).
- **Area:** `src/renderer/src/config/models/vision.ts` (renderer model-capability allow-list).

**Setup:** Anthropic API, `claude-fable-5`. Pasting/attaching an image is rejected with **"model
does not support this file type"**.

## Root cause — same stale allow-list class as the web-search gap

Ironically Fable 5 is Anthropic's new **state-of-the-art vision model** (rebuilds web-app source from
screenshots, reads scientific figures, etc.), so this is purely a client-side recognition gap, not
an API limitation.

`isVisionModel()` matches against `VISION_REGEX`, built from the `visionAllowedModels` list. The
Anthropic entries were `claude-3`, `claude-haiku-4`, `claude-sonnet-4`, `claude-opus-4` — **no
branch for the "5"-gen Mythos-class names**. So `claude-fable-5` failed the regex → Cherry treated it
as text-only → image attachments rejected.

This is the same root cause as the `anthropic-fable5-websearch` patch (model-name allow-lists that
hardcode 3.x/4.x families and miss `fable`/`mythos`), just in the vision list instead of the
web-search regex.
