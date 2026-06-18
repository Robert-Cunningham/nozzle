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
export async function* aperture<T, R = any>(source: Iterable<T, R>, n: number): AsyncGenerator<T[], R> {
  if (n <= 0 || !Number.isInteger(n)) {
    return undefined as R
  }

  const cursor = new Cursor(source)
  if (!(await cursor.init())) return cursor.returnValue as R

  while (cursor.hasCurrent) {
    const upcoming = await cursor.peek(n - 1)

    if (upcoming.length < n - 1) {
      return cursor.returnValue as R
    }

    yield [cursor.current, ...upcoming]

    const hasCurrent = await cursor.advance(1)
    if (!hasCurrent) return cursor.returnValue as R
  }

  return cursor.returnValue as R
}
