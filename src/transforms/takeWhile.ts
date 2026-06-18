/**
 * Yields values while the predicate matches, excluding the first non-matching value.
 *
 * @group Filtering
 * @param source - An asynchronous iterable of values.
 * @param predicate - A function that returns true for values to keep.
 * @returns An asynchronous generator that yields values until the predicate fails.
 *
 * @example
 * ```ts
 * nz([1, 2, 3, 1]).takeWhile(n => n < 3) // => 1, 2
 * ```
 */
export async function* takeWhile<T, R = any>(
  source: AsyncIterable<T, R>,
  predicate: (value: T) => boolean,
): AsyncGenerator<T, R, undefined> {
  const iter = source[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const result = await iter.next()

      if (result.done) {
        completed = true
        return result.value as R
      }

      if (!predicate(result.value)) {
        completed = true
        const returned = await iter.return?.()
        return returned?.value as R
      }

      yield result.value
    }
  } finally {
    if (!completed) {
      await iter.return?.()
    }
  }
}
