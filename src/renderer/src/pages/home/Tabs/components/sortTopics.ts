import type { TopicSortType } from '@renderer/store/settings'
import type { Topic } from '@renderer/types'

const pinnedFirst = (a: Topic, b: Topic): number => {
  if (a.pinned && !b.pinned) return -1
  if (!a.pinned && b.pinned) return 1
  return 0
}

/**
 * Order the sidebar Topics list.
 *
 * - `manual`: preserve the stored array order (drag-reorderable legacy behavior).
 * - `createdAt` / `updatedAt`: sort by that timestamp, newest first.
 *
 * When `pinTopicsToTop` is set, pinned topics always float to the top while the
 * chosen ordering is preserved within the pinned and unpinned groups (the sort is
 * stable). The input array is never mutated.
 */
export function sortTopicList(topics: Topic[], sortType: TopicSortType, pinTopicsToTop: boolean): Topic[] {
  let result = topics

  if (sortType === 'createdAt' || sortType === 'updatedAt') {
    result = topics.toSorted((a, b) => new Date(b[sortType]).valueOf() - new Date(a[sortType]).valueOf())
  }

  if (pinTopicsToTop) {
    result = result.toSorted(pinnedFirst)
  }

  return result
}
