# Retro — resolve claude-agent-sdk ripgrep path in the packaged app

- **Status:** ✅ Shipped (2026-06-07)
- **Commit:** `fix(mcp-filesystem): resolve claude-agent-sdk ripgrep path without exports-restricted
  subpath`. Find the current hash with `git log --grep="ripgrep path"`.
- **Re-apply on a new release:** cherry-pick it. Unlike the renderer patches, this lives in
  `src/main` (not the v2-restructured renderer/`aiCore`), so it should survive upgrades better —
  but re-confirm `getRipgrepAddonPath()` and `toAsarUnpackedPath` still exist and the SDK still
  vendors `ripgrep.node` under `vendor/ripgrep/<arch>-<platform>/`.

## What shipped

In `getRipgrepAddonPath()` (`src/main/mcpServers/filesystem/types.ts`):

- Resolve the SDK by its **main entry** instead of the exports-restricted `package.json` subpath:
  `path.dirname(require.resolve('@anthropic-ai/claude-agent-sdk'))` (matches `claudecode/index.ts`).
- Wrap the final addon path in `toAsarUnpackedPath(...)` so the vendored `ripgrep.node` loads from
  `app.asar.unpacked` in the `ELECTRON_RUN_AS_NODE` child.

Three-line change; no API/behavior change in dev.

## Files touched

- `src/main/mcpServers/filesystem/types.ts` — `getRipgrepAddonPath()` resolution + asar-unpack
  mapping (plus the `toAsarUnpackedPath` import from `@main/utils`).

## Note

Only observable in a **packaged** build, so it's easy to miss in dev — verify by running ripgrep
search through the filesystem MCP server in the installed `.app`, not just `pnpm dev`.
