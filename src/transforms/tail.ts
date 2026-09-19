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
 * nz(["Hello", "World", "!"]).tail() // => "World", "!"
 * ```
 */
export const tail = <T, R = any>(iterator: AsyncIterable<T, R>): AsyncGenerator<T, R, undefined> => slice(iterator, 1)
