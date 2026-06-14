# Contributing upstream

> Live branch/release state is in [`../README.md` → Current state](../README.md). This file is the
> *process*. (Re-verify the headline facts with `gh` if it's been a while.)

## Where work goes today

Upstream's default branch is **`main`**, which is the **v2 line** (`package.json` = `2.0.0-dev`);
the old standalone `v2` branch was merged into it. So:

- Anything you'd upstream **today** branches off **`main`** with normal `feature/*` / `fix/*` naming
  and PRs back to `main`.
- The released **`v1.9.x`** line is maintenance-only; a genuine v1.x fix is a separate `hotfix/*`
  conversation — ask in an issue first.

> The `CONTRIBUTING.md` / `CLAUDE.md` in this `v1.9.9` checkout still describe the older
> "main is frozen, features go to the v2 branch" state, and the `@deprecated … v2.0.0` file headers
> are v1.x artifacts. They're stale — trust the live `gh` picture instead.

**Why these patches aren't upstreamed:** they live in legacy `src/renderer/src/aiCore` and the v1.9.9
message renderer, both replaced on `main` by `packages/aiCore` and the v2 UI. A v1.9.9 fix doesn't
apply to `main` as-is, and v1.x is maintenance-only — so they stay throwaway personal patches. If you
ever change your mind, re-derive against `main`, don't port from here.

## PR workflow (what CLAUDE.md enforces)

1. **Use the repo skill** `gh-create-pr` (and `gh-create-issue` for issues). It reads
   `.github/pull_request_template.md` and fills *every* section (missing data → `N/A`).
2. **Sign off** every commit (DCO): `git commit -s`.
3. **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, …
4. **Draft PRs** for WIP (skip CI, no auto-reviewers).
5. **First-time contributors** get `needs-ok-to-test`; a maintainer must comment `/ok-to-test`
   before CI runs — don't be surprised when checks don't auto-start.
6. **Local gate before pushing**: `pnpm build:check` (`lint` + `openapi:check` + `test`). i18n sort
   fails → `pnpm i18n:sync`; format fails → `pnpm format`.
7. **Reviewing** a PR: don't run lint/test locally — use `gh pr checks <N>`, `gh pr view <N>`,
   `gh run view <RUN_ID> --log-failed`.

## Tests are mandatory

Both `CONTRIBUTING.md` and `CLAUDE.md`: "features without tests don't exist." Add Vitest coverage
with the change — renderer logic → `*.test.ts(x)` (jsdom); run just yours with
`pnpm test:renderer <path>`.

## Branch naming

- `hotfix/<issue#>-<desc>` — critical fixes
- `feature/<issue#>-<desc>`, `fix/<issue#>-<desc>` — features/fixes to `main`
- `docs/<desc>`

## Good first targets

```bash
gh issue list --repo CherryHQ/cherry-studio --label "good first issue"
```
