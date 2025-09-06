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
export const compact = async function* (iterator: AsyncIterable<string>): AsyncGenerator<string> {
  return yield* filter(iterator, (text) => text !== "")
}
