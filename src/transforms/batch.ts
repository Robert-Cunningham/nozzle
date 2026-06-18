/**
 * Groups input values into arrays of the specified size.
 *
 * @group Buffering
 * @param source - The async iterable source of values.
 * @param size - The number of input values to include in each batch.
 * @returns An async iterable that yields arrays of up to size values.
 *
 * @example
 * ```ts
 * nz([1, 2, 3, 4, 5]).batch(2) // => [1, 2], [3, 4], [5]
 * nz(["a", "b", "c"]).batch(2).map(xs => xs.join("")) // => "ab", "c"
 * ```
 */
export async function* batch<T, R = any>(source: AsyncIterable<T, R>, size: number): AsyncGenerator<T[], R, undefined> {
  if (size <= 0 || !Number.isInteger(size)) {
    throw new Error(`batch size must be a positive integer, got ${size}`)
  }

  const iter = source[Symbol.asyncIterator]()
  let sourceDone = false
  let values: T[] = []

  try {
    while (true) {
      const result = await iter.next()

      if (result.done) {
        sourceDone = true

        if (values.length > 0) {
          yield values
        }

        return result.value as R
      }

      values.push(result.value)

      if (values.length >= size) {
        yield values
        values = []
      }
    }
  } finally {
    if (!sourceDone) {
      await iter.return?.()
    }
  }
}
