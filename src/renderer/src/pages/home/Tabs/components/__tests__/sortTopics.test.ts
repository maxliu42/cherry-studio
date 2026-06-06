import type { Topic } from '@renderer/types'
import { describe, expect, it } from 'vitest'

import { sortTopicList } from '../sortTopics'

const topic = (id: string, createdAt: string, updatedAt: string, pinned = false): Topic =>
  ({
    id,
    assistantId: 'a1',
    name: id,
    createdAt,
    updatedAt,
    pinned,
    messages: []
  }) as Topic

// Created oldest -> newest: a, b, c. Activity (updatedAt) reverses it: c, b, a.
const topics: Topic[] = [
  topic('a', '2024-01-01T00:00:00.000Z', '2024-03-01T00:00:00.000Z'),
  topic('b', '2024-02-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z'),
  topic('c', '2024-03-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
]

const ids = (list: Topic[]) => list.map((t) => t.id)

describe('sortTopicList', () => {
  it('preserves stored order in manual mode', () => {
    expect(ids(sortTopicList(topics, 'manual', false))).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the input array', () => {
    const input = [...topics]
    sortTopicList(input, 'updatedAt', true)
    expect(ids(input)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by createdAt newest first', () => {
    expect(ids(sortTopicList(topics, 'createdAt', false))).toEqual(['c', 'b', 'a'])
  })

  it('sorts by updatedAt (recent activity) newest first', () => {
    expect(ids(sortTopicList(topics, 'updatedAt', false))).toEqual(['a', 'b', 'c'])
  })

  it('floats pinned topics to the top while keeping the chosen order', () => {
    const withPinned: Topic[] = [
      topic('a', '2024-01-01T00:00:00.000Z', '2024-03-01T00:00:00.000Z'),
      topic('b', '2024-02-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z'),
      topic('c', '2024-03-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', true)
    ]
    // updatedAt order would be a, b, c — but pinned c wins, rest keep recency order.
    expect(ids(sortTopicList(withPinned, 'updatedAt', true))).toEqual(['c', 'a', 'b'])
  })

  it('keeps manual order within pinned/unpinned groups when pinning', () => {
    const withPinned: Topic[] = [
      topic('a', '2024-01-01T00:00:00.000Z', '2024-03-01T00:00:00.000Z'),
      topic('b', '2024-02-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z', true),
      topic('c', '2024-03-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')
    ]
    expect(ids(sortTopicList(withPinned, 'manual', true))).toEqual(['b', 'a', 'c'])
  })
})
