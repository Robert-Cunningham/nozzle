/**
 * Filters the input stream based on a predicate function.
 *
 * @param iterator - An asynchronous iterable of strings.
 * @param predicate - A function that returns true for items to keep.
 * @returns An asynchronous generator that yields filtered strings.
 *
 * @example
 * ```ts
 * const stream = filter(streamOf(["Hello", "Hi", "World"]), (chunk: string) => chunk.length > 5)
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["Hello", "World"]
 * ```
 */
export const filter = async function* (iterator: AsyncIterable<string>, predicate: (chunk: string) => boolean) {
  for await (const text of iterator) {
    if (predicate(text)) {
      yield text
    }
  }
}