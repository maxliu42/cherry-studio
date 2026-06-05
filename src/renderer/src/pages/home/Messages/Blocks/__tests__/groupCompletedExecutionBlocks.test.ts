import type {
  MainTextMessageBlock,
  MessageBlock,
  ThinkingMessageBlock,
  ToolMessageBlock
} from '@renderer/types/newMessage'
import { MessageBlockStatus, MessageBlockType } from '@renderer/types/newMessage'
import { describe, expect, it } from 'vitest'

import { groupCompletedExecutionBlocks } from '../index'

let blockSeq = 0

const baseBlock = (type: MessageBlockType, status: MessageBlockStatus) => ({
  id: `block-${blockSeq++}`,
  messageId: 'msg-1',
  type,
  status,
  createdAt: new Date(0).toISOString()
})

const mainText = (content = 'prose'): MainTextMessageBlock => ({
  ...baseBlock(MessageBlockType.MAIN_TEXT, MessageBlockStatus.SUCCESS),
  type: MessageBlockType.MAIN_TEXT,
  content
})

const thinking = (content = 'reasoning'): ThinkingMessageBlock => ({
  ...baseBlock(MessageBlockType.THINKING, MessageBlockStatus.SUCCESS),
  type: MessageBlockType.THINKING,
  content,
  thinking_millsec: 0
})

const toolDone = (): ToolMessageBlock => ({
  ...baseBlock(MessageBlockType.TOOL, MessageBlockStatus.SUCCESS),
  type: MessageBlockType.TOOL,
  toolId: `tool-${blockSeq}`
})

const isMainText = (block: MessageBlock) => block.type === MessageBlockType.MAIN_TEXT
const isExecution = (block: MessageBlock) =>
  block.type === MessageBlockType.THINKING || block.type === MessageBlockType.TOOL

describe('groupCompletedExecutionBlocks', () => {
  it('never folds leading or in-between MAIN_TEXT blocks into a collapsed group', () => {
    const leading = mainText('first half')
    const between = mainText('middle prose')
    const trailing = mainText('second half')
    const blocks: MessageBlock[] = [leading, thinking(), toolDone(), between, toolDone(), trailing]

    const grouped = groupCompletedExecutionBlocks(blocks, true)

    // Every standalone (non-array) entry that is MAIN_TEXT must be the original prose, in order.
    const standaloneBlocks = grouped.filter((entry): entry is MessageBlock => !Array.isArray(entry))
    expect(standaloneBlocks).toContain(leading)
    expect(standaloneBlocks).toContain(between)
    expect(standaloneBlocks).toContain(trailing)

    // No grouped (collapsed) array may contain a MAIN_TEXT block.
    const groups = grouped.filter((entry): entry is MessageBlock[] => Array.isArray(entry))
    for (const group of groups) {
      expect(group.some(isMainText)).toBe(false)
      expect(group.every(isExecution)).toBe(true)
    }

    // The leading prose must not live inside any group.
    expect(groups.some((group) => group.includes(leading))).toBe(false)
    expect(groups.some((group) => group.includes(between))).toBe(false)
  })

  it('folds only contiguous THINKING/TOOL runs', () => {
    const blocks: MessageBlock[] = [mainText(), thinking(), toolDone(), mainText(), toolDone(), mainText()]

    const grouped = groupCompletedExecutionBlocks(blocks, true)

    expect(grouped).toHaveLength(5)
    expect(Array.isArray(grouped[0])).toBe(false)
    expect(Array.isArray(grouped[1])).toBe(true)
    expect((grouped[1] as MessageBlock[]).map((b) => b.type)).toEqual([
      MessageBlockType.THINKING,
      MessageBlockType.TOOL
    ])
    expect(Array.isArray(grouped[2])).toBe(false)
    expect(Array.isArray(grouped[3])).toBe(true)
    expect((grouped[3] as MessageBlock[]).map((b) => b.type)).toEqual([MessageBlockType.TOOL])
    expect(Array.isArray(grouped[4])).toBe(false)
  })

  it('returns blocks untouched while collapsing is not allowed (e.g. still streaming)', () => {
    const blocks: MessageBlock[] = [mainText(), thinking(), toolDone(), mainText()]

    const grouped = groupCompletedExecutionBlocks(blocks, false)

    expect(grouped).toBe(blocks)
  })
})
