/**
 * Consumes an async iterator completely and returns its return value.
 * All yielded values are consumed and discarded, only the return value is captured.
 *
 * @group Conversion
 * @param iterator - An asynchronous iterable.
 * @returns A promise that resolves to the return value of the iterator.
 *
 * @example
 * ```ts
 * const source = async function* () {
 *   yield "item1"
 *   yield "item2"
 *   return "final value"
 * }
 *
 * const result = await asReturn(source())
 * console.log(result) // => "final value"
 * ```
 */
export const asReturn = async <T, R>(iterator: AsyncIterable<T, R>): Promise<R | undefined> => {
  const iter = iterator[Symbol.asyncIterator]()

  while (true) {
    const result = await iter.next()

    if (result.done) {
      return result.value as R
    }
    // Consume but don't store the value
  }
}
