import { isPatternEmpty, toNonGlobalRegex } from "../regex"
import { generalRegex } from "../streamingRegex"
import { StringIterable } from "../types"

/**
 * Emit everything **after** the accumulated prefix that matches `pattern`.
 * @group Splitting
 * @param source     stream or iterable to scan
 * @param pattern first `RegExp` that marks the cut-off
 * @returns async stream with the leading section removed
 * @example
 * ```ts
 * nz(["a", "b", "c", "d", "e"]).after(/bc/) // => "d", "e"
 * ```
 */

export async function* after(source: StringIterable, pattern: RegExp | string): AsyncGenerator<string> {
  let found = false
  const regex = toNonGlobalRegex(pattern)

  if (isPatternEmpty(pattern)) {
    yield* source
    return
  }

  // must not be a global regex; once it matches once, everything else should pass through.
  for await (const result of generalRegex(source, regex)) {
    if ("regex" in result) {
      if (found) {
        yield result.regex[0]
      } else {
        found = true
      }
    } else if (found) {
      yield result.text
    }
  }
}
