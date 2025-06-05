import { StringIterable } from "../types"
import { accumulate } from "./accumulate"
import { diff } from "./diff"

/**
 * Emit everything **after** the accumulated prefix that matches `pattern`.
 * @param source     stream or iterable to scan
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

export async function* after(
  source: StringIterable,
  pattern: RegExp,
): AsyncIterable<string> {
  const prefixes = accumulate(source)

  const afterFilter = async function* () {
    // start yielding after this is first broken.
    for await (const prefix of prefixes) {
      const match = pattern.exec(prefix)
      if (match) {
        yield prefix.slice(match.index + match[0].length)
      }
    }
    return ""
  }

  yield* diff(afterFilter())
}
