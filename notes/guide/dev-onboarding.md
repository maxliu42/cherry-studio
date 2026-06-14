# Dev onboarding (macOS / Apple Silicon)

What you need to build and run this repo, and the one gotcha that bites.

## Required toolchain

| Tool | Version | Why |
|---|---|---|
| Node.js | **24.11.1** (from `.node-version`; `package.json` `engines` says `>=24.11.1`) | Build + scripts. Install via `fnm`/`nvm`. |
| pnpm | **10.27.0** (from `packageManager`) | Must be exact so `pnpm.overrides` + `patchedDependencies` apply. Run via **Corepack**. |
| Corepack | bundled with Node | Pins the exact pnpm — **critical**, see below. |
| Xcode CLT | any recent | Native modules (`sharp`, `libsql`, `selection-hook`, electron). |

> CLAUDE.md says "Node ≥22" — that's stale; the repo needs 24.11.1.

### The Corepack gotcha

A **globally-installed** pnpm prints:

```
[WARN] The "pnpm" field in package.json is no longer read by pnpm.
The following keys were ignored: "pnpm.overrides", "pnpm.patchedDependencies", ...
```

That means the `patches/` overrides are **silently skipped** → a subtly broken build. Always run
pnpm through Corepack (`corepack enable && corepack prepare pnpm@10.27.0 --activate`), which still
reads the `pnpm` field. If `pnpm install` ever shows that warning, stop and fix the pnpm source.

## Setup on a fresh machine

```bash
fnm install 24.11.1 && fnm default 24.11.1   # or nvm
# shell integration so terminals auto-switch on cd:
#   eval "$(fnm env --use-on-cd)"   # in ~/.zshrc
corepack enable && corepack prepare pnpm@10.27.0 --activate
pnpm install                                  # native builds + Electron + prek git hooks
cp .env.example .env                          # dev/lint scripts read it
```

Handy extras (most already present on a dev box): `gh` (authed, `repo` scope), `jq`, `ast-grep`,
`ripgrep`. A system Python is **not** needed — the in-app runtime is Pyodide (WASM); repo scripts run
via `tsx`.

## Agent / LLM tooling that helps on this repo

- **`gh` CLI (authenticated).** Repo skills shell out to it (`gh-create-pr`, `gh-create-issue`,
  `gh-pr-review`, `prepare-release`, `cherry-pr-test`), and CLAUDE.md mandates the PR/issue skills.
  Refresh scopes if needed: `gh auth refresh -s repo,read:org`.
- **`ast-grep`** for structural queries across the large `src/renderer` tree (CLAUDE.md prefers it
  over `rg`); **`jq`** for the `gh api` calls the CI/review skills make.
- **CDP debugging** (`pnpm debug`, remote port 9222) is how `cherry-pr-test` drives the running app
  for UI verification.
- Repo skills live in `.claude/skills/` and `.agents/skills/`.

## Running it

```bash
pnpm dev        # Electron + hot reload (runs generate:openapi first, needs .env)
pnpm debug      # dev + --inspect + remote-debugging-port=9222 (chrome://inspect)
pnpm test       # all Vitest projects   (pnpm test:renderer for just renderer/jsdom)
pnpm lint       # oxlint + eslint --fix + tsgo typecheck + i18n check + biome format
pnpm format     # biome write
pnpm build:check  # lint + openapi:check + test — the gate before committing
```

Pre-commit hooks run via **prek**. Dev userData lives under
`~/Library/Application Support/CherryStudioDev/`, separate from a released install — dev work won't
touch real data.

## First-run sanity check

1. `node -v` → `v24.11.1`, `pnpm -v` → `10.27.0` (inside the repo).
2. `pnpm install` clean, **no** "pnpm field ignored" warning.
3. `pnpm dev` launches the desktop app.
