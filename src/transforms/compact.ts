import { filter } from "./filter"

/**
 * Filters out empty strings from the input stream.
 *
 * @group Filtering
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields only non-empty strings.
 *
 * @example
 * ```ts
 * nz(["Hello", "", "World", ""]).compact() // => "Hello", "World"
 * ```
 */
export const compact = <R = any>(iterator: AsyncIterable<string, R>): AsyncGenerator<string, R, undefined> =>
  filter(iterator, (text) => text !== "")
