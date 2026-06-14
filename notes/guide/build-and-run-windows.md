# Build & run (Windows) — rebuild / install playbook

Windows counterpart of [`build-and-run.md`](build-and-run.md) (macOS). How to build and daily-drive the
personal `my/stable` app (base tag in [`../README.md` → Current state](../README.md)) on Windows.
It's a throwaway local build — no real code-signing, don't gold-plate.

Toolchain + setup live in [`dev-onboarding.md`](dev-onboarding.md) (written for macOS, but Node
24.11.1 + Corepack pnpm 10.27.0 apply identically). The one Windows-only setup step: native modules
(`sharp`, `libsql`, `selection-hook`, electron) need the **Visual Studio Build Tools** ("Desktop
development with C++") instead of Xcode CLT.

## 1) Build

```powershell
cd <your-cherry-studio-checkout>
git switch my/stable
pnpm install            # ensure deps are present (must be Corepack pnpm; see dev-onboarding)
pnpm build:unpack       # = build + electron-builder --dir (fast; no installer)
```

- Output: `dist\win-unpacked\Cherry Studio.exe` (unpacked).
- `scripts\win-sign.js` no-ops unless `WIN_SIGN` + `CHERRY_CERT_*` env vars are set (same idea as
  `notarize.js` on mac), so the binaries end up **unsigned** — that's fine for local use.
- Want a draggable installer instead? `pnpm build:win:x64` produces, in `dist\`:
  - `Cherry-Studio-1.9.11-x64-setup.exe` — NSIS installer (per-user, lets you pick the install dir).
  - `Cherry-Studio-1.9.11-x64-portable.exe` — single-file portable build.
  - (`pnpm build:win` does both x64 + arm64; on an x64 box just use `build:win:x64`.)

First Windows build also downloads an `rtk.exe` helper into `resources\binaries\win32-x64\`, and
electron-builder logs `dependency not found on disk` for other-platform `sharp`/`libsql`/`canvas`
optional deps. Both are expected — the build still completes.

## 2) Install + get past SmartScreen

The appId is **`com.kangfenmao.CherryStudio`**, productName **"Cherry Studio"** — identical to the
official app. Electron keys userData off the app name, so this build uses the same prod data dir as
the official install: `%APPDATA%\CherryStudio` (i.e. `C:\Users\<you>\AppData\Roaming\CherryStudio`).
Dev runs (`pnpm dev`) use `%APPDATA%\CherryStudioDev`, separate.

Two ways to run it:

```powershell
# A) Just run the unpacked build in place — nothing to install:
& "dist\win-unpacked\Cherry Studio.exe"

# B) Or install via the NSIS installer (after `pnpm build:win:x64`):
& "dist\Cherry-Studio-1.9.11-x64-setup.exe"   # default install dir: %LOCALAPPDATA%\Programs\Cherry Studio
```

Because the binary is unsigned, **Microsoft Defender SmartScreen** will likely warn on first launch
("Windows protected your PC"). Click **More info → Run anyway**. (Defender may also quarantine the
exe; if so, allow it in Virus & threat protection.)

Since the appId collides with the official app, uninstall an existing official install first
(Settings → Apps, or its uninstaller) so they don't fight over shortcuts/registry. Your build then
picks up the existing data dir. For a clean slate, delete the data dir:
`Remove-Item -Recurse -Force "$env:APPDATA\CherryStudio"`.

## 3) Disable auto-update (important)

The app ships `electron-updater` pointed at the official feed, so it can prompt to "update" and
**silently replace your patched build with an official one**. Either turn off auto-update / "check
for updates" in **Settings**, or just remember: if it ever updates, re-run `build:unpack` from
`my/stable`.

## 4) Smoke-test the patches

Spot-check whatever you most recently changed (see [`../patches/`](../patches/)), e.g.:

- **Collapse:** model yaps → tool call mid-message → yaps more; the earlier prose should stay
  readable inline, not folded into the pill.
- **Web search:** run an Anthropic built-in web search; results should render with citation pills,
  no "ack, json!" stumble.

## Reminder

These patches live only on `my/stable`. When v2 ships a stable release, this build and its patches
are obsolete — re-evaluate then (see [`release-strategy.md`](release-strategy.md)), don't port them.
