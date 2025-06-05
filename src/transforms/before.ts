
import { StringIterable } from "../types"
import { accumulate } from "./accumulate"
import { diff } from "./diff"

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
  separator: string,
): AsyncIterable<string> {
  const prefixes = accumulate(source)

  const beforeFilter = async function* () {
    for await (const prefix of prefixes) {
      const index = prefix.indexOf(separator)
      if (index !== -1) {
        yield prefix.slice(0, index)
        return
      }
      yield prefix
    }
  }

  yield* diff(beforeFilter())
}