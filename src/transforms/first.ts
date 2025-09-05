/**
 * Returns the first value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns A promise that resolves to the first value, or undefined if the stream is empty.
 *
 * @example
 * ```ts
 * const value = await first(streamOf(["Hello", "World", "!"]))
 * console.log(value) // => "Hello"
 * ```
 */
export const first = async <T>(iterator: AsyncIterable<T>): Promise<T | undefined> => {
  for await (const value of iterator) {
    return value
  }
  return undefined
}
