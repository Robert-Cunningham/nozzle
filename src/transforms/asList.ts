/**
 * Consumes an async iterator and returns all values as an array.
 *
 * @group Conversion
 * @param iterator - An asynchronous iterable of strings.
 * @returns A promise that resolves to an array of all values.
 *
 * @example
 * ```ts
 * const result = await asList(streamOf(["Hello", "World", "!"]))
 * console.log(result) // => ["Hello", "World", "!"]
 * ```
 */
export const asList = async <T>(iterator: AsyncIterable<T>): Promise<T[]> => {
  const result: T[] = []
  for await (const text of iterator) {
    result.push(text)
  }
  return result
}
