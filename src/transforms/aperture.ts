import { Cursor } from "../primitives"
import { Iterable } from "../types"

/**
 * Creates a sliding window of size n over the input stream, yielding arrays of consecutive elements.
 *
 * @group Functions
 * @param source - An iterable to create windows over.
 * @param n - The size of each window.
 * @returns An asynchronous generator that yields arrays of consecutive elements.
 *
 * @example
 * ```ts
 * nz([1, 2, 3, 4, 5]).aperture(3) // => [1, 2, 3], [2, 3, 4], [3, 4, 5]
 * ```
 */
export async function* aperture<T, R = any>(source: Iterable<T, R>, n: number): AsyncGenerator<T[], R | undefined> {
  if (n <= 0 || !Number.isInteger(n)) {
    return undefined
  }

  const cursor = new Cursor(source, { maxPast: 0 })
  try {
    if (!(await cursor.init())) return cursor.returnValue

    while (cursor.hasCurrent) {
      const upcoming = await cursor.peek(n - 1)

      if (upcoming.length < n - 1) {
        return cursor.returnValue
      }

      yield [cursor.current, ...upcoming]

      const hasCurrent = await cursor.advance(1)
      if (!hasCurrent) return cursor.returnValue
    }

    return cursor.returnValue
  } finally {
    await cursor.cancel()
  }
}
