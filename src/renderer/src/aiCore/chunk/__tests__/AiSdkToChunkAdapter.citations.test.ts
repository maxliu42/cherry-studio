import type { Chunk } from '@renderer/types/chunk'
import { ChunkType } from '@renderer/types/chunk'
import { describe, expect, it } from 'vitest'

import { AiSdkToChunkAdapter } from '../AiSdkToChunkAdapter'

/**
 * Anthropic native web search emits two kinds of url `source` parts: a bibliography (one per search
 * result, providerMetadata.anthropic = { pageAge }) streamed up front, and inline citations
 * (providerMetadata.anthropic.citedText) interleaved with the answer. Only the latter should produce
 * an inline [N] marker, and it should land at the end of the cited text block.
 */
const makeStream = (parts: any[]) =>
  new ReadableStream<any>({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(part)
      }
      controller.close()
    }
  })

const runAdapter = async (parts: any[]) => {
  const chunks: Chunk[] = []
  const adapter = new AiSdkToChunkAdapter(
    (chunk) => chunks.push(chunk),
    [],
    /* accumulate */ true,
    /* enableWebSearch */ true,
    undefined,
    undefined,
    'anthropic'
  )
  await adapter.processStream({ fullStream: makeStream(parts), text: Promise.resolve('') })
  return chunks
}

describe('AiSdkToChunkAdapter — Anthropic web search citations', () => {
  it('injects inline [N] only for real citations, deferred to the end of the cited block', async () => {
    const urlA = 'https://a.example.com'
    const urlB = 'https://b.example.com'

    const parts = [
      // Bibliography: streamed up front from the web_search tool result (pageAge, no citedText).
      {
        type: 'source',
        sourceType: 'url',
        id: 's1',
        url: urlA,
        title: 'A',
        providerMetadata: { anthropic: { pageAge: null } }
      },
      {
        type: 'source',
        sourceType: 'url',
        id: 's2',
        url: urlB,
        title: 'B',
        providerMetadata: { anthropic: { pageAge: null } }
      },
      // First cited claim — citation arrives at the *start* of the block, before its text.
      { type: 'text-start', id: '0' },
      {
        type: 'source',
        sourceType: 'url',
        id: 's3',
        url: urlA,
        title: 'A',
        providerMetadata: { anthropic: { citedText: 'cited A' } }
      },
      { type: 'text-delta', id: '0', text: 'Claim one.' },
      { type: 'text-end', id: '0' },
      // Second cited claim — citation arrives at the end of the block.
      { type: 'text-start', id: '1' },
      { type: 'text-delta', id: '1', text: 'Claim two.' },
      {
        type: 'source',
        sourceType: 'url',
        id: 's4',
        url: urlB,
        title: 'B',
        providerMetadata: { anthropic: { citedText: 'cited B' } }
      },
      { type: 'text-end', id: '1' }
    ]

    const chunks = await runAdapter(parts)
    const completes = chunks.filter((c) => c.type === ChunkType.TEXT_COMPLETE)

    // Bibliography produced no leading marker; each block ends with its matching pill, numbered by
    // first-seen result order (A=1, B=2).
    expect(completes.map((c: any) => c.text)).toEqual(['Claim one.[1]', 'Claim two.[2]'])
  })

  it('reuses a URL number when the same source is cited more than once', async () => {
    const url = 'https://repeat.example.com'
    const parts = [
      {
        type: 'source',
        sourceType: 'url',
        id: 's1',
        url,
        title: 'R',
        providerMetadata: { anthropic: { pageAge: null } }
      },
      { type: 'text-start', id: '0' },
      { type: 'text-delta', id: '0', text: 'First.' },
      {
        type: 'source',
        sourceType: 'url',
        id: 's2',
        url,
        title: 'R',
        providerMetadata: { anthropic: { citedText: 'x' } }
      },
      { type: 'text-end', id: '0' },
      { type: 'text-start', id: '1' },
      { type: 'text-delta', id: '1', text: 'Second.' },
      {
        type: 'source',
        sourceType: 'url',
        id: 's3',
        url,
        title: 'R',
        providerMetadata: { anthropic: { citedText: 'y' } }
      },
      { type: 'text-end', id: '1' }
    ]

    const chunks = await runAdapter(parts)
    const completes = chunks.filter((c) => c.type === ChunkType.TEXT_COMPLETE)
    expect(completes.map((c: any) => c.text)).toEqual(['First.[1]', 'Second.[1]'])
  })
})
