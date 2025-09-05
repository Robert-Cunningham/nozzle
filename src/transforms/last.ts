/**
 * Returns the last value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns A promise that resolves to the last value, or undefined if the stream is empty.
 *
 * @example
 * ```ts
 * await nz(["Hello", "World", "!"]).last() // => "!"
 * ```
 */
export const last = async <T>(iterator: AsyncIterable<T>): Promise<T | undefined> => {
  let lastValue: T | undefined = undefined
  for await (const value of iterator) {
    lastValue = value
  }
  return lastValue
}
