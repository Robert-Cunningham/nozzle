/**
 * Finds the first value from the input stream that matches the predicate.
 *
 * @group Elements
 * @param iterator - An asynchronous iterable of values.
 * @param predicate - A function that returns true for the item to find.
 * @returns A promise that resolves to the first matching value, or undefined if no match is found.
 *
 * @example
 * ```ts
 * await nz(["apple", "banana", "cherry"]).find(chunk => chunk.startsWith("b")) // => "banana"
 * ```
 */
export const find = async <T>(iterator: AsyncIterable<T>, predicate: (chunk: T) => boolean): Promise<T | undefined> => {
  for await (const value of iterator) {
    if (predicate(value)) {
      return value
    }
  }
  return undefined
}
