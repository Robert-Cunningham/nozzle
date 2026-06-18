/**
 * Yields values until the predicate matches, excluding the matching value.
 *
 * @group Filtering
 * @param source - An asynchronous iterable of values.
 * @param predicate - A function that returns true for the value that should stop the stream.
 * @returns An asynchronous generator that yields values before the first matching value.
 *
 * @example
 * ```ts
 * nz([1, 2, 3, 4]).takeUntil(n => n === 3) // => 1, 2
 * ```
 */
export async function* takeUntil<T, R = any>(
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

      if (predicate(result.value)) {
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
