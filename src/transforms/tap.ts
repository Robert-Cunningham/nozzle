/**
 * Executes a side effect for each value without modifying the stream.
 *
 * @param fn - A function to execute for each value.
 * @returns A transform function that passes through all values unchanged.
 *
 * @example
 * ```ts
 * const stream = tap(console.log)(streamOf(["Hello", "World", "!"]))
 * for await (const chunk of stream) {
 *   // console.log will have printed each chunk
 *   console.log("Processed:", chunk)
 * }
 * // => logs: "Hello", "World", "!", then "Processed: Hello", "Processed: World", "Processed: !"
 * ```
 */
export const tap = (fn: (value: string) => void) => 
  async function* (iterator: AsyncIterable<string>) {
    for await (const text of iterator) {
      fn(text)
      yield text
    }
  }