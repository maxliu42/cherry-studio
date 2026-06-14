# Retro — sort topics by last message, not creation time

- **Status:** ✅ Shipped (2026-06-06)
- **Commit:** `feat(topics): sort sidebar topics by manual/created/recent` (also fixes the "Show topic
  time" display, below). Find the current hash with `git log --grep="sort sidebar topics"`.
- **Re-apply on a new release:** cherry-pick it. This is legacy renderer code (settings slice +
  `pages/home/Tabs/components/Topics.tsx`, all replaced/restructured in v2); if those modules are gone
  upstream, re-derive from `report.md` rather than cherry-picking.

## What shipped

A three-mode topic sort, defaulting to **Recent** (the thing I actually wanted):

- `src/renderer/src/store/settings.ts` — new exported type
  `TopicSortType = 'manual' | 'createdAt' | 'updatedAt'`, a `topicSortType` field on the settings
  slice (initial state `'updatedAt'`), a `setTopicSortType` reducer, and the action export.
- `src/renderer/src/hooks/useSettings.ts` — `setTopicSortType` setter (mirrors `setPinTopicsToTop`).
- `src/renderer/src/pages/home/Tabs/components/sortTopics.ts` *(new)* — pure `sortTopicList(topics,
  sortType, pinTopicsToTop)` helper. `createdAt`/`updatedAt` sort newest-first via `toSorted` (no
  mutation); pinned-first is applied as a second stable sort so the chosen order is preserved within
  the pinned/unpinned groups. `manual` returns the stored array order untouched.
- `Topics.tsx` — `sortedTopics` now calls the helper; drag-reorder is disabled unless the mode is
  `manual` (`disabled={isManageMode || topicSortType !== 'manual'}`). The "Show topic time" row also
  shows `topic.updatedAt` when the mode is `updatedAt` (so the displayed time matches the sort key),
  and `topic.createdAt` otherwise.
- `pages/settings/DisplaySettings/DisplaySettings.tsx` — a `Segmented` (Manual / Created / Recent)
  in the Topic settings group, under "Pin Topics to Top".
- i18n: English keys under `settings.topic.sort.*` in `en-us.json`; `zh-cn.json` / `zh-tw.json` got
  `[to be translated]` placeholders (required for `i18n:check` to pass — it only validates the three
  `locales/`, not the machine-translated `translate/` dir).

## Key decisions

- **How "manual" works:** there is no separate order field — the order of `assistant.topics` *is* the
  manual order, persisted via the `updateTopics` reducer on drag (redux-persist). So `manual` mode =
  the legacy behavior. `Recent` gives the "new message floats to top" behavior for free via
  `topic.updatedAt` (bumped by `updateTopicUpdatedAt`).
- **No persist migration.** The report planned a `redux-persist` version bump, but `migrate.ts` has a
  latent unrun migration `208` (index.ts is pinned at `version: 207`); bumping would also fire 208
  (`enableDataCollection = true`) as a side effect, and `migrate.ts` is a v2-blocked file. Instead the
  default is supplied via destructuring defaults at the two read sites (`topicSortType = 'updatedAt'`).
  Existing persisted state lacking the key reads as `'updatedAt'`; fresh installs get it from
  `initialState`. Same result, zero side effects, one fewer blocked file touched.
- **i18n kept minimal.** `pnpm i18n:sync` wanted to also sync pre-existing unrelated privacy-policy
  drift into `translate/`; verified `i18n:check` passes without it, so only the 3 real `locales/` were
  committed.

## Tests

- `src/renderer/src/pages/home/Tabs/components/__tests__/sortTopics.test.ts` — 6 cases: manual
  preserves order, no input mutation, createdAt/updatedAt newest-first, pinned floats to top while
  keeping the chosen order, manual order preserved within pinned/unpinned groups.

## Watch out (future)

- Touches the v2-blocked settings slice / `useSettings` / `Topics.tsx` — fine for this personal
  throwaway branch, do **not** upstream.
- `Recent`/`Created` override manual drag order, so drag is disabled in those modes (by design).
  Switching back to `Manual` restores the last stored array order.
- `HomePage`/`useActiveTopic` treat `topics[0]` as default on assistant switch; with `Recent` active
  the "first" topic is now the most-recently-active one (intended, but a behavior change to eyeball).
