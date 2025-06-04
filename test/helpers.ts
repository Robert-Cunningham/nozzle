/** Turn an array into an AsyncIterable (simulates a “stream”). */
export function streamOf<T>(items: readonly T[]): AsyncIterable<T> {
  return (async function* () {
    for (const item of items) yield item
  })()
}

/** Collect *any* (a)sync iterable into an array so you can assert on it. */
export async function collect<T>(
  src: Iterable<T> | AsyncIterable<T>,
): Promise<T[]> {
  const out: T[] = []
  for await (const chunk of src as AsyncIterable<T>) out.push(chunk)
  return out
}

/** Handy shorthand: expect the collected stream to equal an array. */
export async function expectStream<T>(
  received: Iterable<T> | AsyncIterable<T>,
  expected: readonly T[],
  assert: (cond: boolean, msg?: string) => void,
) {
  const got = await collect(received)
  assert(
    JSON.stringify(got) === JSON.stringify(expected),
    `Stream mismatch → expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`,
  )
}
