import { generalRegex } from "../streamingRegex"
import { StringIterable } from "../types"

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
  pattern: RegExp | string,
): AsyncIterable<string> {
  let found = false

  const regex =
    typeof pattern === "string"
      ? new RegExp(pattern)
      : new RegExp(pattern.source, pattern.flags.replace(/g/g, ""))

  // must not be a global regex; once it matches once, everything else should pass through.
  for await (const result of generalRegex(source, regex)) {
    if ("regex" in result) {
      found = true
    }
    if (!found) continue

    if ("text" in result) yield result.text
    else yield result.regex[0]
  }
}
