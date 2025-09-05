/**
 * Transforms each value from the input stream using the provided function.
 *
 * @group Elements
 * @param iterator - An asynchronous iterable of strings.
 * @param fn - A function that transforms each string value.
 * @returns An asynchronous generator that yields transformed strings.
 *
 * @example
 * ```ts
 * nz(["hello", "world"]).map(x => x.toUpperCase()) // => "HELLO", "WORLD"
 * ```
 */
export const map = async function* <T, U, R = any>(
  iterator: AsyncIterable<T, R>,
  fn: (value: T) => U,
): AsyncGenerator<U, R, undefined> {
  const iter = iterator[Symbol.asyncIterator]()

  while (true) {
    const result = await iter.next()

    if (result.done) {
      return result.value as R
    }

    yield fn(result.value)
  }
}
