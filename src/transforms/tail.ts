import { slice } from './slice'

/**
 * Yields all values except the first from the input stream.
 *
 * @group Indexing
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields all strings except the first.
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
export const tail = (iterator: AsyncIterable<string>) => slice(iterator, 1)