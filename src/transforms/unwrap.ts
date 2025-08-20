/**
 * Unwraps results from wrap() back into a normal iterator that throws/returns/yields.
 * The opposite of wrap() - takes {value, return, error} objects and converts them back
 * to normal iterator behavior.
 *
 * @group Error Handling
 * @param iterator - An asynchronous iterable of wrapped result objects.
 * @returns An asynchronous generator that yields values and throws errors normally.
 *
 * @example
 * ```ts
 * const wrappedStream = wrap(streamOf(["hello", "world"]))
 * const unwrapped = unwrap(wrappedStream)
 * for await (const value of unwrapped) {
 *   console.log("Got:", value) // "hello", "world"
 * }
 * ```
 */
export const unwrap = async function* <T>(
  iterator: AsyncIterable<{ value?: T; return?: any; error?: unknown }>,
): AsyncGenerator<T, any, any> {
  for await (const result of iterator) {
    if (result.error !== undefined) {
      throw result.error
    } else if (result.return !== undefined) {
      return result.return
    } else if (result.value !== undefined) {
      yield result.value
    }
  }
}
