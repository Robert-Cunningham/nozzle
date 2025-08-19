import { slice } from "./slice"

/**
 * Yields all values except the first from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of values.
 * @returns An asynchronous generator that yields all values except the first.
 *
 * @example
 * ```ts
 * const stream = tail(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["World", "!"]
 * ```
 */
export const tail = <T>(iterator: AsyncIterable<T>) => slice(iterator, 1)
