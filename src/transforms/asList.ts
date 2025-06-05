/**
 * Consumes an async iterator and returns all values as an array.
 *
 * @param iterator - An asynchronous iterable of strings.
 * @returns A promise that resolves to an array of all values.
 *
 * @example
 * ```ts
 * const result = await asList(streamOf(["Hello", "World", "!"]))
 * console.log(result) // => ["Hello", "World", "!"]
 * ```
 */
export const asList = async (iterator: AsyncIterable<string>): Promise<string[]> => {
  const result: string[] = []
  for await (const text of iterator) {
    result.push(text)
  }
  return result
}