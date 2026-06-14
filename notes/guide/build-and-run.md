# Build & run (macOS) — rebuild / install playbook

How to build and daily-drive the personal `my/stable` app (base tag in
[`../README.md` → Current state](../README.md)). It's a throwaway local build — no Apple signing, no
notarization, don't gold-plate. On Windows, use [`build-and-run-windows.md`](build-and-run-windows.md).

## 1) Build

```bash
cd <your-cherry-studio-checkout>
git switch my/stable
pnpm install            # ensure deps are present
pnpm build:unpack       # = build + electron-builder --dir (fast; no dmg/notarize)
```

- Output: `dist/mac-arm64/Cherry Studio.app` (unpacked).
- `scripts/notarize.js` no-ops without `APPLE_ID`, so it won't try to notarize; signing is ad-hoc.
- Want a draggable installer instead? `pnpm build:mac:arm64` (produces `.dmg`/`.zip`, slightly
  slower, same no-notarize behavior).

## 2) Install + get past Gatekeeper

The bundle id is **`com.kangfenmao.CherryStudio`**, productName **"Cherry Studio"** — identical to
the official app, so macOS treats it as the same app and it uses the same prod data dir
`~/Library/Application Support/CherryStudio` (dev runs use `CherryStudioDev`, separate).

```bash
cp -R "dist/mac-arm64/Cherry Studio.app" /Applications/
xattr -dr com.apple.quarantine "/Applications/Cherry Studio.app"   # clear quarantine on the ad-hoc app
open "/Applications/Cherry Studio.app"
```

(Still blocked? Right-click the app → Open → Open.) Because the bundle id collides with the official
app, remove an existing official install first (`rm -rf "/Applications/Cherry Studio.app"`); your
build then picks up the existing data dir (or `rm -rf "$HOME/Library/Application Support/CherryStudio"`
for a clean slate).

## 3) Disable auto-update (important)

The app ships `electron-updater` pointed at the official feed, so it can prompt to "update" and
**silently replace your patched build with an official one**. Either turn off auto-update /
"check for updates" in **Settings**, or just remember: if it ever updates, re-run `build:unpack`
from `my/stable`.

## 4) Smoke-test the patches

Spot-check whatever you most recently changed (see [`../patches/`](../patches/)), e.g.:

- **Collapse:** model yaps → tool call mid-message → yaps more; the earlier prose should stay
  readable inline, not folded into the pill.
- **Web search:** run an Anthropic built-in web search; results should render with citation pills,
  no "ack, json!" stumble.

## Reminder

These patches live only on `my/stable`. When v2 ships a stable release, this build and its patches
are obsolete — re-evaluate then (see [`release-strategy.md`](release-strategy.md)), don't port them.
