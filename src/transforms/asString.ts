/**
 * Consumes an async iterator and returns the final accumulated string.
 * Equivalent to calling accumulate().last() but more efficient.
 *
 * @param iterator - An asynchronous iterable of strings.
 * @returns A promise that resolves to the final accumulated string.
 *
 * @example
 * ```ts
 * const result = await asString(streamOf(["Hello", " ", "World"]))
 * console.log(result) // => "Hello World"
 * ```
 */
export const asString = async (iterator: AsyncIterable<string>): Promise<string> => {
  let result = ""
  for await (const text of iterator) {
    result += text
  }
  return result
}