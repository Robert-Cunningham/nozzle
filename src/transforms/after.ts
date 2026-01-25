import { isPatternEmpty, toNonGlobalRegex } from "../regex"
import { StringIterable } from "../types"
import { scan } from "./scan"

/**
 * Emit everything **after** the accumulated prefix that matches `pattern`.
 *
 * Built on: `scan(source, regex)` skipping until first match, then yielding everything after
 *
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
  for await (const result of scan(source, regex)) {
    if ("match" in result) {
      if (found) {
        yield result.match[0]
      } else {
        found = true
      }
    } else if (found) {
      yield result.text
    }
  }
}
