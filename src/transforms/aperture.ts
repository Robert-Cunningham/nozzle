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
export async function* aperture<T>(source: Iterable<T>, n: number): AsyncGenerator<T[]> {
  if (n <= 0) {
    return
  }

  const buffer: T[] = []

  for await (const item of source) {
    buffer.push(item)

    if (buffer.length === n) {
      yield [...buffer]
      buffer.shift()
    }
  }
}
