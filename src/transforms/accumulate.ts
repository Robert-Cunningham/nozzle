import { reduce } from "./reduce"

/**
 * Yields a cumulative prefix of the input stream.
 *
 * @group Accumulation
 * @param iterator - An asynchronous iterable of strings.
 * @returns An asynchronous generator that yields the progressively accumulated string.
 *
 * @example
 * ```ts
 * nz(["This ", "is ", "a ", "test!"]).accumulate() // => "This ", "This is ", "This is a ", "This is a test!"
 * ```
 */
// accumulate and yield partials: diffsToPrefixes
export const accumulate = <R = any>(iterator: AsyncIterable<string, R>): AsyncGenerator<string, R, undefined> =>
  reduce(iterator, (acc, current) => acc + current, "")
