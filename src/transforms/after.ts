import { AnyIterable } from "../types"

/**
 * Emit everything **after** the first chunk that matches `pattern`.
 * @param src     stream or iterable to scan
 * @param pattern first `RegExp` that marks the cut-off
 * @returns async stream with the leading section removed
 */

export function after<T extends string>(
  src: AnyIterable<T>,
  pattern: RegExp,
): AsyncIterable<T> {
  async function* gen() {
    let seen = false
    for await (const chunk of src) {
      if (seen) yield chunk
      else if (pattern.test(chunk as unknown as string)) seen = true
    }
  }
  return gen()
}
