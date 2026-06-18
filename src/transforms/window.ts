import { Cursor } from "../primitives"
import { Iterable } from "../types"

/**
 * Provides a windowed view of the stream with lookahead/lookbehind capabilities.
 *
 * @group Functions
 * @param source - The async iterable to window over
 * @param fn - Callback receiving context and returning value and advance amount
 * @param options - Optional configuration
 * @param options.maxPast - Maximum number of elements to keep in past array
 * @returns An AsyncGenerator yielding transformed values
 *
 * @example
 * ```ts
 * // Simple passthrough with lookahead
 * nz([1, 2, 3, 4]).window(({ current, upcoming, done }) => {
 *   if (!done && upcoming.length === 0) {
 *     return { value: current, advance: 0 } // peek ahead
 *   }
 *   return { value: current } // advance by 1 (default)
 * })
 * ```
 */
export async function* window<T, U, R = any>(
  source: Iterable<T, R>,
  fn: (ctx: { past: T[]; current: T; upcoming: T[]; index: number; done: boolean }) => { value: U; advance?: number },
  options?: { maxPast?: number },
): AsyncGenerator<U, R> {
  const cursor = new Cursor(source, options)
  if (!(await cursor.init())) return cursor.returnValue as R

  while (cursor.hasCurrent) {
    const { value, advance = 1 } = fn({
      ...cursor.snapshot(),
    })
    yield value

    if (advance < 0 || !Number.isInteger(advance)) {
      throw new Error(`advance must be a non-negative integer, got ${advance}`)
    }

    const maxAdvance = cursor.upcomingLength + 1
    if (advance > maxAdvance) {
      throw new Error(`advance (${advance}) cannot exceed upcoming.length + 1 (${maxAdvance})`)
    }

    if (advance === 0) {
      await cursor.peek(cursor.upcomingLength + 1)
    } else {
      const hasCurrent = await cursor.advance(advance)
      if (!hasCurrent) return cursor.returnValue as R
    }
  }

  return cursor.returnValue as R
}
