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
 * const source = async function* () {
 *   yield "item1"
 *   yield "item2"
 *   return 42
 * }
 *
 * const stream = mapReturn(source(), (returnValue) => returnValue.toString())
 * const consumed = await consume(stream)
 * console.log(consumed.list()) // => ["item1", "item2"]
 * console.log(consumed.return()) // => "42"
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
