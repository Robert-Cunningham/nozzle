/**
 * Yields a cumulative prefix of the input stream.
 *
 * @group Accumulation
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields the progressively accumulated string.
 *
 * @example
 * ```ts
 * const stream = accumulate(streamOf(["This ", "is ", "a ", "test!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["This ", "This is ", "This is a ", "This is a test!"]
 * ```
 */
// accumulate and yield partials: diffsToPrefixes
export const accumulate = async function* (iterator: AsyncIterable<string>): AsyncGenerator<string> {
  let soFar = ""
  for await (const text of iterator) {
    soFar += text
    yield soFar
  }
}
