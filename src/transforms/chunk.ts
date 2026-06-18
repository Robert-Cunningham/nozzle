import { batch } from "./batch"
import { map } from "./map"

async function* invalidChunk<R>(message: string): AsyncGenerator<string, R, undefined> {
  throw new Error(message)
}

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
export function chunk<R = any>(source: AsyncIterable<string, R>, size: number): AsyncGenerator<string, R, undefined> {
  if (size <= 0 || !Number.isInteger(size)) {
    return invalidChunk(`chunk size must be a positive integer, got ${size}`)
  }

  return map(batch(source, size), (tokens) => tokens.join(""))
}
