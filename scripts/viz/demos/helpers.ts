import type { Fate, Range, Step } from "../gif.js"

/** Blank time before the first chunk. */
export const LEAD_MS = 600

/** A character's fate at one moment. Characters with the same fate and key form one run. */
export interface CharFate {
  fate: Fate
  key: string
  id?: string
}

/**
 * Runs a real pipeline, feeding it one chunk at a time, and reports which chunk released each value.
 * For pipelines without timers, this is exact and independent of machine speed.
 */
export async function yieldsByChunk<T>(
  texts: string[],
  build: (source: AsyncIterable<string>) => AsyncIterable<T>,
): Promise<T[][]> {
  const waiting: Array<(value: IteratorResult<string>) => void> = []
  const ready: IteratorResult<string>[] = []
  const send = (result: IteratorResult<string>) => (waiting.length ? waiting.shift()!(result) : ready.push(result))
  const source: AsyncIterable<string> = {
    [Symbol.asyncIterator]: () => ({
      next: () => (ready.length ? Promise.resolve(ready.shift()!) : new Promise((resolve) => waiting.push(resolve))),
    }),
  }
  const byChunk: T[][] = texts.map(() => [])
  let current = 0
  const consumer = (async () => {
    for await (const value of build(source)) byChunk[current].push(value)
  })()
  for (const [index, text] of texts.entries()) {
    current = index
    send({ value: text, done: false })
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setImmediate(resolve))
  }
  send({ value: undefined, done: true })
  await consumer
  return byChunk
}

/**
 * Builds the steps of a demo. `moments` lists each time something changes, with the source text
 * that has arrived by then; `fateAt` gives every arrived character's fate at that moment.
 */
export function toSteps(
  moments: Array<{ at: number; arrived: string }>,
  fateAt: (moment: { at: number; arrived: string }) => CharFate[],
): Step[] {
  const arrivedAt: number[] = []
  const bornAt: number[] = []
  const previous: string[] = []
  return moments.map((moment) => {
    const fates = fateAt(moment)
    const runs: Array<Range & { key: string }> = []
    fates.forEach((f, i) => {
      arrivedAt[i] ??= moment.at
      const signature = `${f.fate}:${f.key}`
      if (previous[i] !== signature) bornAt[i] = moment.at
      previous[i] = signature
      const last = runs.at(-1)
      const sameRun = last && last.key === signature && last.bornAt === bornAt[i]
      // An object is one run however its source text arrived; other text also splits by arrival, to fade in.
      if (sameRun && (f.fate === "obj" || last.arrivedAt === arrivedAt[i])) last.text += moment.arrived[i]
      else {
        runs.push({
          key: signature,
          text: moment.arrived[i],
          fate: f.fate,
          arrivedAt: arrivedAt[i],
          bornAt: bornAt[i],
          id: f.id,
        })
      }
    })
    return { at: moment.at, ranges: runs.map(({ key: _key, ...range }) => range) }
  })
}
