# Workflow: track stable, carry a few patches

Goal: stay on the latest **stable** Cherry Studio release and move forward release-to-release, while
carrying a small set of personal patches (new-model params, a couple of UI fixes) ahead of when
upstream ships them. This is a classic **vendor-branch / patch-on-top-of-tag** workflow — keep the
patches few, small, and rebasable.

> Current base tag, latest upstream stable, and branch reality live in
> [`../README.md` → Current state](../README.md). This file is the *procedure*, not the status.

## Repo layout

- Branch **`my/stable`** = a stable tag + the patches in [`../patches/`](../patches/).
- `origin` = your fork (`maxliu42/cherry-studio`), pushed and tracking → backup + cross-machine sync.
- `upstream` = `CherryHQ/cherry-studio`.

One-time setup, for reference when cloning onto a new machine:

```bash
gh repo fork CherryHQ/cherry-studio --remote=false   # creates maxliu42/cherry-studio
git remote rename origin upstream
git remote add origin git@github.com:maxliu42/cherry-studio.git
git fetch --all --tags
git switch -c my/stable <stable-tag>
git push -u origin my/stable
```

## Carrying patches

One focused, signed-off commit per fix — small independent commits rebase cleanly onto the next tag.

```bash
git switch my/stable
# ...edit...
git commit -s -m "fix(ui): don't fold mid-message prose into the tool-call group"
git push
```

Tips that make upgrades painless:

- Touch as few files as possible; prefer additive changes over rewrites.
- For third-party deps, use `pnpm patch <pkg>` (writes to `patches/`) — survives upgrades far better
  than editing `node_modules`.
- Put the "why" in the commit body; the per-patch `report.md`/`retro.md` hold the detail.

## Moving to the next stable release

```bash
git fetch upstream --tags
git switch my/stable
git rebase --onto <new-tag> <old-base-tag> my/stable
# resolve conflicts (only in files your patches touched), then:
git push --force-with-lease
```

`--onto NEW OLD` replays the commits after `OLD` on top of `NEW`. Before doing it, sanity-check the
overlap so you know what to expect:

```bash
# Files your patches touch vs. files the new release changed — empty intersection = clean rebase:
comm -12 <(git diff --name-only <old-base-tag>..my/stable | sort) \
         <(git diff --name-only <old-base-tag>..<new-tag> | sort)
```

- **If a patch became unnecessary** (upstream shipped the same fix), drop its commit during the
  rebase (`git rebase -i`, delete the line). That's the payoff of one-commit-per-fix.
- **If a rebase gets messy**, fall back to `git merge <new-tag>` (keeps patches, adds a merge
  commit). Rebase is cleaner for a small set; merge is safer if conflicts are scary.
- **After upgrading**, update the **Current state** block in [`../README.md`](../README.md).

## Build & run after an upgrade

```bash
pnpm install            # deps move between releases
pnpm build:check        # lint + openapi:check + test — catch rebase breakage
pnpm build:unpack       # local .app under dist/ (see build-and-run.md)
```

Auto-update caveat (a self-built app can be silently replaced by an official release) is covered in
[`build-and-run.md`](build-and-run.md).

## Two lanes — don't mix

1. **Personal** (`my/stable`): patches you carry, based on stable tags. Force-push is fine here.
2. **Upstream contribution**: clean branches off `main`, only the change you intend to submit. See
   [`contributing.md`](contributing.md). Cherry-pick from `my/stable` into a fresh branch to upstream.
