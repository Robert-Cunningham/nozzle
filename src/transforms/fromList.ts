/**
 * Converts an array to an async iterator.
 *
 * @group Conversion
 * @param list - An array of values.
 * @returns An asynchronous generator that yields each value.
 *
 * @example
 * ```ts
 * nz(["Hello", "World", "!"]) // => "Hello", "World", "!"
 * ```
 */
export const fromList = async function* <T>(list: T[]): AsyncGenerator<T> {
  for (const item of list) {
    yield item
  }
}
