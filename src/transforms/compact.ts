/**
 * Filters out empty strings from the input stream.
 *
 * @group Filtering
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields only non-empty strings.
 *
 * @example
 * ```ts
 * const stream = compact(streamOf(["Hello", "", "World", ""]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["Hello", "World"]
 * ```
 */
export const compact = async function* (iterator: AsyncIterable<string>): AsyncGenerator<string> {
  for await (const text of iterator) {
    if (text !== "") {
      yield text
    }
  }
}