import { isPatternEmpty, toNonGlobalRegex } from "../regex"
import { generalRegex } from "../streamingRegex"
import { StringIterable } from "../types"

/**
 * Emit everything **before** the accumulated prefix that contains `separator`.
 * @group Splitting
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
  const regex = toNonGlobalRegex(separator)

  if (isPatternEmpty(separator)) {
    yield* source
    return
  }

  for await (const result of generalRegex(source, regex)) {
    if ("text" in result) {
      yield result.text
    } else {
      break
    }
  }
}
