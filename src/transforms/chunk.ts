/**
 * Groups input tokens into chunks of the specified size and yields the joined result.
 * Takes N input items and yields N/size output items, where each output is the concatenation of size input items.
 *
 * @group Splitting
 * @param source The async iterable source of strings (tokens).
 * @param size The number of input tokens to group together in each output chunk.
 * @returns An async iterable that yields concatenated chunks.
 *
 * @example
 * ```ts
 * nz(["a", "b", "c", "d", "e", "f"]).chunk(3) // => "abc", "def"
 * ```
 */
export async function* chunk(source: AsyncIterable<string>, size: number): AsyncGenerator<string> {
  let buffer: string[] = []

  for await (const token of source) {
    buffer.push(token)

    if (buffer.length >= size) {
      yield buffer.join("")
      buffer = []
    }
  }

  // Yield any remaining tokens in the buffer
  if (buffer.length > 0) {
    yield buffer.join("")
  }
}
