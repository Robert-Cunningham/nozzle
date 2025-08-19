import { slice } from "./slice"

/**
 * Yields only the last value from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields only the last value.
 *
 * @example
 * ```ts
 * const stream = last(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["!"]
 * ```
 */
export const last = <T>(iterator: AsyncIterable<T>) => slice(iterator, -1)
