/**
 * Wraps an iterator to catch any errors and return them in a result object format.
 * Instead of throwing, errors are yielded as `{error}` and successful values as `{value}`.
 *
 * @group Error Handling
 * @param iterator - An asynchronous iterable.
 * @returns An asynchronous generator that yields result objects with value, return, or error.
 *
 * @example
 * ```ts
 * const stream = wrap(streamOf(["hello", "world"]))
 * for await (const result of stream) {
 *   if (result.value !== undefined) {
 *     console.log("Got:", result.value)
 *   } else if (result.return !== undefined) {
 *     console.log("Return:", result.return)
 *   } else {
 *     console.log("Error:", result.error)
 *   }
 * }
 * ```
 */
export const wrap = async function* <T>(
  iterator: AsyncIterable<T>,
): AsyncGenerator<{ value?: T; return?: any; error?: unknown }> {
  try {
    const iter = iterator[Symbol.asyncIterator]()

    while (true) {
      const result = await iter.next()

      if (result.done) {
        if (result.value !== undefined) {
          yield { return: result.value }
        }
        break
      } else {
        yield { value: result.value }
      }
    }
  } catch (error) {
    yield { error }
  }
}
