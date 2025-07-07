/**
 * Yields the difference between the current and previous string in the input stream.
 *
 * @group Accumulation
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields the difference between the current and previous string.
 * @example
 * ```ts
 * const stream = diff(streamOf(["This ", "This is ", "This is a ", "This is a test!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["This ", "is ", "a ", "test!"]
 * ```
 */
export const diff = async function* (iterator: AsyncIterable<string>): AsyncGenerator<string> {
  let last = ""
  for await (const text of iterator) {
    yield text.replace(last, "")
    last = text
  }
}
