/**
 * Buffers tokens from an async iterable source and yields a single merged token
 * for every `size` tokens received, joined by the specified `separator`.
 *
 * @param source The async iterable source of strings (tokens).
 * @param size The number of tokens to accumulate before yielding a merged token.
 * @param separator The string to use when joining tokens.
 * @returns An async iterable that yields merged tokens.
 */
export async function* chunk(
  source: AsyncIterable<string>,
  size: number,
  separator: string,
): AsyncIterable<string> {
  let buffer: string[] = []
  for await (const token of source) {
    buffer.push(token)
    if (buffer.length >= size) {
      yield buffer.join(separator)
      buffer = []
    }
  }
  // Yield any remaining tokens in the buffer
  if (buffer.length > 0) {
    yield buffer.join(separator)
  }
}
