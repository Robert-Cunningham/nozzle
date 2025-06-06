import { generalRegex } from "../streamingRegex"
import { StringIterable } from "../types"

/**
 * Emit everything **before** the accumulated prefix that contains `separator`.
 * @param source     stream or iterable to scan
 * @param separator  string that marks the cut-off
 * @returns async stream with the trailing section removed
 * @example
 * ```ts
 * const stream = before(streamOf(["a", "b", "c", "d", "e"]), "cd")
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["a", "b"]
 * ```
 */

export async function* before(
  source: StringIterable,
  separator: string | RegExp,
): AsyncIterable<string> {
  for await (const result of generalRegex(
    source,
    typeof separator === "string" ? new RegExp(separator) : separator, // would be better to escape this
  )) {
    if ("text" in result) {
      yield result.text
    } else {
      break
    }
  }
}
