import { isPatternEmpty, toNonGlobalRegex } from "../regex"
import { StringIterable } from "../types"
import { scan } from "./scan"

/**
 * Emit everything **before** the accumulated prefix that contains `separator`.
 *
 * Built on: `scan(source, regex)` taking text until first match
 *
 * Early termination may return undefined instead of the source's final value.
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
export async function* before<R = any>(
  source: StringIterable<R>,
  separator: string | RegExp,
): AsyncGenerator<string, R | undefined, undefined> {
  const regex = toNonGlobalRegex(separator)

  if (isPatternEmpty(separator)) return yield* source

  const iter = scan(source, regex)[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        return next.value as R
      }

      const result = next.value

      if ("text" in result) {
        yield result.text
      } else {
        completed = true
        const returned = await iter.return?.(undefined as R)
        return returned?.done ? returned.value : undefined
      }
    }
  } finally {
    if (!completed) {
      await iter.return?.(undefined as R)
    }
  }
}
