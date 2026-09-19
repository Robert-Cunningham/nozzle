/**
 * Yields progressive accumulated values using a reducer function.
 *
 * @group Accumulation
 * @param source - An asynchronous iterable of values.
 * @param reducer - A function that combines the accumulator with each value.
 * @param initial - The initial accumulator value.
 * @returns An asynchronous generator that yields the accumulated value after each reduction.
 *
 * @example
 * ```ts
 * nz([1, 2, 3, 4]).reduce((acc, n) => acc + n, 0) // => 1, 3, 6, 10
 * ```
 */
export async function* reduce<T, A, R = any>(
  source: AsyncIterable<T, R>,
  reducer: (accumulator: A, current: T, index: number) => A,
  initial: A,
): AsyncGenerator<A, R, undefined> {
  const iter = source[Symbol.asyncIterator]()
  let accumulator = initial
  let index = 0
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        return next.value as R
      }

      accumulator = reducer(accumulator, next.value, index++)
      yield accumulator
    }
  } finally {
    if (!completed) {
      await iter.return?.()
    }
  }
}
