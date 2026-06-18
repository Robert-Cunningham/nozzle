/**
 * Transforms each value from the input stream into zero or more output values.
 *
 * @group Transformation
 * @param source - An asynchronous iterable of values.
 * @param fn - A function that returns sync or async iterable values for each input.
 * @returns An asynchronous generator that yields each mapped value in order.
 *
 * @example
 * ```ts
 * nz(["hi", "ok"]).flatMap(word => word.split("")) // => "h", "i", "o", "k"
 * nz([1, 2, 3]).flatMap(n => Array(n).fill(n)) // => 1, 2, 2, 3, 3, 3
 * ```
 */
export const flatMap = async function* <T, U, R = any>(
  source: AsyncIterable<T, R>,
  fn: (value: T) => Iterable<U> | AsyncIterable<U>,
): AsyncGenerator<U, R, undefined> {
  const iter = source[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const result = await iter.next()

      if (result.done) {
        completed = true
        return result.value as R
      }

      for await (const value of fn(result.value)) {
        yield value
      }
    }
  } finally {
    if (!completed) {
      await iter.return?.()
    }
  }
}
