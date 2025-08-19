/**
 * Yields only the first value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields only the first string.
 *
 * @example
 * ```ts
 * const stream = first(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["Hello"]
 * ```
 */
export const first = async function* <T>(iterator: AsyncIterable<T>): AsyncGenerator<T> {
  for await (const text of iterator) {
    yield text
    return
  }
}
