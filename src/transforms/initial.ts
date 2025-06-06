import { slice } from './slice'

/**
 * Yields all values except the last from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields all values except the last.
 *
 * @example
 * ```ts
 * const stream = initial(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["Hello", "World"]
 * ```
 */
export const initial = <T>(iterator: AsyncIterable<T>) => slice(iterator, 0, -1)