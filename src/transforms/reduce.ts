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
export async function* reduce<T, A>(
  source: AsyncIterable<T>,
  reducer: (accumulator: A, current: T, index: number) => A,
  initial: A,
): AsyncGenerator<A> {
  let accumulator = initial
  let index = 0
  for await (const value of source) {
    accumulator = reducer(accumulator, value, index++)
    yield accumulator
  }
}
