/**
 * Filters the input stream based on a predicate function.
 *
 * @param predicate - A function that returns true for items to keep.
 * @returns A function that takes an async iterable and returns a filtered async generator.
 *
 * @example
 * ```ts
 * const stream = filter((chunk: string) => chunk.length > 5)(streamOf(["Hello", "Hi", "World"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["Hello", "World"]
 * ```
 */
export const filter = (predicate: (chunk: string) => boolean) => {
  return async function* (iterator: AsyncIterable<string>) {
    for await (const text of iterator) {
      if (predicate(text)) {
        yield text
      }
    }
  }
}