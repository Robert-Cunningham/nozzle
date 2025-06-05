/**
 * Yields only the first value from the input stream.
 *
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
export const first = async function* (iterator: AsyncIterable<string>) {
  for await (const text of iterator) {
    yield text
    return
  }
}