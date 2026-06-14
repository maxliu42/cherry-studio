# Cherry Studio — personal dev notes

Working notes for the personal `my/stable` build of Cherry Studio: a stable upstream release plus a
handful of patches I carry on top. These are *my* notes, not upstream docs.

> **Public fork — keep it clean.** This repo (`maxliu42/cherry-studio`) is public, so nothing
> private, secret, or account/machine-specific belongs in `notes/`. Put that in `notes/local/`
> (gitignored). Git history is permanent, so be careful *before* committing, not after.

## How this is organized

- **`guide/`** — durable how-to docs (toolchain, workflow, build/run, upstreaming). Rarely change.
- **`patches/<slug>/`** — one folder per patch carried on `my/stable`. Each is a point-in-time
  record, written once and not meant to be kept up to date:
  - `report.md` — the problem, root cause, and plan.
  - `retro.md` — what shipped: files touched, tests, how to re-apply on a new release.

Patches are identified by their **commit subject**, not hash — hashes are rewritten every time the
branch is rebased onto a new tag, so docs reference the stable subject line instead.

## Current state — the one place to update over time

> Verified **2026-06-14**. Everything time-sensitive lives here so the rest of the notes don't go
> stale; refresh this block when you move releases.

- **Base:** `my/stable` = upstream tag **`v1.9.9`** (2026-06-02) + the patches below.
- **Latest upstream stable:** **`v1.9.11`** (2026-06-07) — the prior published release was our base
  `v1.9.9`; there is **no `v1.9.10`** (skipped — no tag, no release). We have **not** moved up yet, and
  none of our patches have been superseded upstream.
- **Upstream `main` = `2.0.0-dev`** (the v2 line; default branch). `v2.0.0` is in preview
  (`preview/v2.0.0-preview.*` branches exist) but **no public v2 release has shipped** — the
  `v1.9.x` tags are still the only stable line. Most code our patches touch is restructured in v2,
  so these patches are **throwaway**: expect to re-derive, not cherry-pick, once v2 goes stable.
- **Remotes:** `origin` = fork `maxliu42/cherry-studio` (backup, pushed); `upstream` =
  `CherryHQ/cherry-studio`. `git pull` on another machine to sync.

## Patches carried on `my/stable`

Listed newest-first. Get current hashes any time with `git log --oneline v1.9.9..HEAD`.

| Patch (commit subject) | Status | Folder |
|---|---|---|
| `feat(models): detect Anthropic fable/mythos models as vision and web search capable` | Done | [`anthropic-fable5-vision/`](patches/anthropic-fable5-vision/), [`anthropic-fable5-websearch/`](patches/anthropic-fable5-websearch/) |
| `fix(mcp-filesystem): resolve claude-agent-sdk ripgrep path…` | Done | [`mcp-filesystem-ripgrep/`](patches/mcp-filesystem-ripgrep/) |
| `feat(topics): sort sidebar topics by manual/created/recent` | Done | [`topic-sort-by-last-message/`](patches/topic-sort-by-last-message/) |
| `fix: render Anthropic web search inline citations as pills` | Done | [`websearch-inline-citations/`](patches/websearch-inline-citations/) |
| `fix: pin Anthropic web search to web_search_20250305` | Done | [`anthropic-websearch-json/`](patches/anthropic-websearch-json/) |
| `fix: only collapse contiguous execution blocks in message renderer` | Done | [`message-collapse-prose/`](patches/message-collapse-prose/) |

The two `anthropic-fable5-*` folders ship under one commit (`feat(models): …`).

## Moving to a newer upstream release

Full procedure in [`guide/release-strategy.md`](guide/release-strategy.md). Short version:

1. `git fetch upstream --tags`, then `git rebase --onto <new-tag> v1.9.9 my/stable`.
2. Resolve conflicts only in files a patch touched. If the area was restructured (likely for the
   renderer/`aiCore` patches in v2), re-derive from that patch's `report.md`.
3. Rebuild via [`guide/build-and-run.md`](guide/build-and-run.md).
4. If upstream shipped one of these fixes, drop that commit during the rebase and mark its row
   above. Then update the **Current state** block with the new base tag and date.

## Guides

| File | Covers |
|---|---|
| [`guide/dev-onboarding.md`](guide/dev-onboarding.md) | Toolchain, setup, agent tooling, sanity checks |
| [`guide/release-strategy.md`](guide/release-strategy.md) | The "track stable + carry patches" workflow + git commands |
| [`guide/build-and-run.md`](guide/build-and-run.md) | Rebuild/install/daily-drive playbook (macOS) |
| [`guide/build-and-run-windows.md`](guide/build-and-run-windows.md) | Rebuild/install/daily-drive playbook (Windows) |
| [`guide/contributing.md`](guide/contributing.md) | How upstream PRs work, and why these patches aren't upstreamed |
