/**
 * Executes a side effect for each value without modifying the stream.
 *
 * @group Side Effects
 * @param iterator - An asynchronous iterable of strings.
 * @param fn - A function to execute for each value.
 * @returns An asynchronous generator that passes through all values unchanged.
 *
 * @example
 * ```ts
 * const stream = tap(streamOf(["Hello", "World", "!"]), console.log)
 * for await (const chunk of stream) {
 *   // console.log will have printed each chunk
 *   console.log("Processed:", chunk)
 * }
 * // => logs: "Hello", "World", "!", then "Processed: Hello", "Processed: World", "Processed: !"
 * ```
 */
export const tap = async function* <T, R = any>(
  iterator: AsyncIterable<T, R>,
  fn: (value: T) => void,
): AsyncGenerator<T, R, undefined> {
  const iter = iterator[Symbol.asyncIterator]()
  while (true) {
    const result = await iter.next()
    if (result.done) {
      return result.value as R
    }
    fn(result.value)
    yield result.value
  }
}
