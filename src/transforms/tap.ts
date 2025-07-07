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
export const tap = async function* <T>(iterator: AsyncIterable<T>, fn: (value: T) => void): AsyncGenerator<T> {
  for await (const text of iterator) {
    fn(text)
    yield text
  }
}