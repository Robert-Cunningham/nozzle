/**
 * Maps the return type of an iterator while preserving all yielded values unchanged.
 *
 * @group Return Values
 * @param iterator - An asynchronous iterable.
 * @param fn - A function that transforms the return value.
 * @returns An asynchronous generator that yields the same values but with mapped return value.
 *
 * @example
 * ```ts
 * nz(["a", "b"]).mapReturn(returnValue => returnValue?.toString() ?? "default") // => "a", "b" (with mapped return value)
 * ```
 */
export const mapReturn = async function* <T, R, U>(
  iterator: AsyncIterable<T, R>,
  fn: (value: R) => U,
): AsyncGenerator<T, U, undefined> {
  const iter = iterator[Symbol.asyncIterator]()

  try {
    while (true) {
      const result = await iter.next()

      if (result.done) {
        return fn(result.value) as U
      } else {
        yield result.value
      }
    }
  } catch (error) {
    throw error
  }
}
