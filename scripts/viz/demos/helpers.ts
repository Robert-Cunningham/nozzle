import type { Token } from "../gif.js"

export interface Chunk {
  value: string
  time: number
}

/** Yields each chunk at its scheduled time. */
export async function* timedSource(chunks: Chunk[]): AsyncGenerator<string> {
  const start = Date.now()
  for (const chunk of chunks) {
    await new Promise((resolve) => setTimeout(resolve, chunk.time - (Date.now() - start)))
    yield chunk.value
  }
}

export function sourceTokens(chunks: Chunk[]): Token[] {
  return chunks.map(({ value, time }) => ({ text: value, ts: time }))
}

/**
 * Runs `stream` and timestamps each yielded value. Values that land just after a source
 * chunk (the same tick, give or take scheduling jitter) snap to that chunk's time.
 */
export async function recordTokens<T>(
  stream: AsyncIterable<T>,
  chunks: Chunk[],
  format: (value: T) => Token = (value) => ({ text: String(value), ts: 0 }),
): Promise<Token[]> {
  const start = Date.now()
  const tokens: Token[] = []
  for await (const value of stream) {
    const elapsed = Date.now() - start
    const snapped = chunks.map((c) => c.time).find((time) => elapsed >= time && elapsed - time < 40)
    tokens.push({ ...format(value), ts: snapped ?? Math.round(elapsed / 10) * 10 })
  }
  return tokens
}

/** Concatenated source text that has arrived by time `t`. */
export function arrivedBy(chunks: Chunk[], t: number): string {
  return chunks
    .filter((c) => c.time <= t)
    .map((c) => c.value)
    .join("")
}

/**
 * Pending text for a stage whose outputs consume source text in order:
 * everything that has arrived minus everything accounted for by yielded tokens.
 */
export function pendingByConsumption(chunks: Chunk[], output: Token[], consumed: (token: Token) => number) {
  return (t: number) => {
    const used = output.filter((token) => token.ts <= t).reduce((sum, token) => sum + consumed(token), 0)
    return arrivedBy(chunks, t).slice(used)
  }
}
