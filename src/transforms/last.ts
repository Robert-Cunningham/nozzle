/**
 * Yields only the last value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields only the last string.
 *
 * @example
 * ```ts
 * const stream = last(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["!"]
 * ```
 */
export const last = async function* (iterator: AsyncIterable<string>) {
  let lastValue: string | undefined
  for await (const text of iterator) {
    lastValue = text
  }
  if (lastValue !== undefined) {
    yield lastValue
  }
}