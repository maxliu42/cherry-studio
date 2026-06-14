# Report — sort topics by last message, not creation time

- **Status:** ✅ Fixed — see [`retro.md`](retro.md).
- **Area:** renderer (`pages/home/Tabs/components/Topics.tsx` + settings slice)

**Symptom:** The Topics list in the sidebar is ordered by **creation time** (the stored order of
`assistant.topics`). Sending a message in an old chat does **not** bump it up. I want an option so
the most-recently-active topic floats to the top — like every other chat app.

## Is there already a setting? — No

Checked `useSettings()` / the settings slice. Relevant existing topic settings are only
`topicPosition` (left/right), `showTopicTime`, and `pinTopicsToTop`. There is **no** "sort by last
message / recent activity" option. So this needs a small patch.

## Good news: the data already exists

`Topic` has an `updatedAt: string` field (`src/renderer/src/types/index.ts`), and it **is** bumped on
message activity via the `updateTopicUpdatedAt` reducer (`src/renderer/src/store/assistants.ts`),
dispatched from `store/thunk/messageThunk.ts` and `services/db/DexieMessageDataSource.ts` on
message/block changes. So `topic.updatedAt` is a reliable "last activity" timestamp — no new
bookkeeping needed.

Precedent for the sort UI: `pages/history/components/TopicsHistory.tsx` already has a
`SortType = 'createdAt' | 'updatedAt'` and does `orderBy(topics, sortType, 'desc')`.

## Where the order is decided

`src/renderer/src/pages/home/Tabs/components/Topics.tsx`, the `sortedTopics` useMemo (~line 527):

```ts
const sortedTopics = useMemo(() => {
  if (pinTopicsToTop) {
    return [...assistant.topics].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })
  }
  return assistant.topics            // <-- otherwise: raw creation order
}, [assistant.topics, pinTopicsToTop])
```

## Plan (smallest viable patch)

1. **Setting.** Add a topic-sort preference to the existing `settings` slice — e.g.
   `topicSortType: 'createdAt' | 'updatedAt'` (default `'createdAt'` to preserve current behavior),
   with a `useSettings()` accessor + setter, mirroring `pinTopicsToTop`.
   - ⚠️ `CLAUDE.md` says don't add new Redux slices / change state shape until v2.0.0. This adds a
     *field* to the existing settings slice (not a new slice). For a **throwaway personal branch**
     that's acceptable; add a `redux-persist` migration bump so existing persisted state gets the
     default. Don't upstream.
2. **Sort.** In `sortedTopics`, when `topicSortType === 'updatedAt'`, sort by
   `dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()` (desc), still honoring
   `pinTopicsToTop` as the primary key (pinned first, then recency). Use a copy / `toSorted` — don't
   mutate `assistant.topics`.
3. **UI toggle.** Add a control in Display/Topic settings
   (`pages/settings/DisplaySettings/DisplaySettings.tsx`) or the topics list header — a segmented
   "Sort: Created / Recent" or a simple switch.
4. **Test.** Renderer Vitest on the sort helper: given topics with mixed `createdAt`/`updatedAt`,
   assert recency ordering and that pinned still wins.

## Gotchas

- **Manual drag-reorder conflict.** Topics support drag reordering (`moveTopic`,
  `DraggableVirtualList`). Sorting by `updatedAt` overrides manual order, so when "Recent" is active,
  either disable drag or accept that a new message re-sorts past any manual placement. Decide UX in
  the focused chat.
- **Active/default topic.** `HomePage`/`useActiveTopic` treat `topics[0]` as the default; changing
  order changes which topic is "first" on assistant switch. Minor, but eyeball it.
- Legacy renderer code (restructured in v2) — personal patch only.
