/**
 * Converts an array to an async iterator.
 *
 * @param list - An array of strings.
 * @returns An asynchronous generator that yields each string.
 *
 * @example
 * ```ts
 * const stream = fromList(["Hello", "World", "!"])
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => "Hello", "World", "!"
 * ```
 */
export const fromList = async function* (list: string[]): AsyncGenerator<string> {
  for (const item of list) {
    yield item
  }
}