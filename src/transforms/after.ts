import { StringIterable } from "../types"

/**
 * Emit everything **after** the first chunk that matches `pattern`.
 * @param src     stream or iterable to scan
 * @param pattern first `RegExp` that marks the cut-off
 * @returns async stream with the leading section removed
 * @example
 * ```ts
 * const stream = after(streamOf(["a", "b", "c", "d", "e"]), /bc/)
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["d", "e"]
 * ```
 */

export function after(
  src: StringIterable,
  pattern: RegExp,
): AsyncIterable<string> {
  async function* gen() {
    let seen = false
    for await (const chunk of src) {
      if (seen) yield chunk
      else if (pattern.test(chunk as unknown as string)) seen = true
    }
  }
  return gen()
}
