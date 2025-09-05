/**
 * Filters the input stream based on a predicate function.
 *
 * @group Elements
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
export const filter = async function* <T, R = any>(
  iterator: AsyncIterable<T, R>,
  predicate: (chunk: T) => boolean,
): AsyncGenerator<T, R, undefined> {
  const iter = iterator[Symbol.asyncIterator]()

  while (true) {
    const result = await iter.next()

    if (result.done) {
      return result.value as R
    }

    if (predicate(result.value)) {
      yield result.value
    }
  }
}
