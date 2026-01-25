import { isPatternEmpty, toNonGlobalRegex } from "../regex"
import { StringIterable } from "../types"
import { scan } from "./scan"

/**
 * Emit everything **before** the accumulated prefix that contains `separator`.
 *
 * Built on: `scan(source, regex)` taking text until first match
 *
 * @group Splitting
 * @param source     stream or iterable to scan
 * @param separator  string that marks the cut-off
 * @returns async stream with the trailing section removed
 * @example
 * ```ts
 * nz(["a", "b", "c", "d", "e"]).before("cd") // => "a", "b"
 * ```
 */
export async function* before(source: StringIterable, separator: string | RegExp): AsyncGenerator<string> {
  const regex = toNonGlobalRegex(separator)

  if (isPatternEmpty(separator)) return yield* source

  for await (const result of scan(source, regex)) {
    if ("text" in result) {
      yield result.text
    } else {
      break
    }
  }
}
