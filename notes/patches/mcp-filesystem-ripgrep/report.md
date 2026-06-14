# Report — filesystem MCP ripgrep fails to load in the packaged app

- **Status:** ✅ Fixed — see [`retro.md`](retro.md).
- **Area:** `src/main/mcpServers/filesystem/types.ts` (main process, `getRipgrepAddonPath()`).

**Symptom:** ripgrep-backed search in the built `my/stable` `.app` fails. Two things break, both only
in the **packaged** app (dev works because nothing is inside an asar):

1. `require.resolve('@anthropic-ai/claude-agent-sdk/package.json')` throws
   **"Package subpath './package.json' is not defined by exports"** — the SDK's `exports` map doesn't
   expose `package.json`, so resolving that subpath is forbidden under Node's exports enforcement.
2. Even once the package root is found, the vendored `ripgrep.node` native addon sits inside
   `app.asar` at runtime, but native modules can't be loaded from within an asar — it has to be read
   from `app.asar.unpacked` (in the `ELECTRON_RUN_AS_NODE` child that actually runs ripgrep).

## Root cause

`getRipgrepAddonPath()` located the SDK by resolving its `package.json` subpath and never mapped the
resulting addon path out of the asar. Both assumptions hold in dev and fail in a packaged build.

## Fix direction

Mirror how `claudecode/index.ts` already resolves the SDK: resolve the package's **main entry**
(allowed by the exports map) instead of `package.json`, and run the final addon path through
`toAsarUnpackedPath` so it resolves under `app.asar.unpacked`.
