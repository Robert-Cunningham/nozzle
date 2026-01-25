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
  const iter = (source as AsyncIterable<T, R>)[Symbol.asyncIterator]()
  const past: T[] = []
  const upcoming: T[] = []
  const maxPast = options?.maxPast
  let done = false
  let returnValue: R | undefined

  // Helper to add to past with maxPast limit
  const addToPast = (item: T) => {
    past.push(item)
    if (maxPast !== undefined && past.length > maxPast) {
      past.shift()
    }
  }

  // Get first item
  const first = await iter.next()
  if (first.done) return first.value as R

  let current: T = first.value
  let index = 0

  while (true) {
    const { value, advance = 1 } = fn({
      past: [...past],
      current,
      upcoming: [...upcoming],
      index,
      done,
    })
    yield value

    // Validate advance
    const maxAdvance = upcoming.length + 1
    if (advance > maxAdvance) {
      throw new Error(`advance (${advance}) cannot exceed upcoming.length + 1 (${maxAdvance})`)
    }

    if (advance === 0) {
      // Stay in place, fetch one more into upcoming (if possible)
      if (!done) {
        const next = await iter.next()
        if (next.done) {
          done = true
          returnValue = next.value as R
        } else {
          upcoming.push(next.value)
        }
      }
      // Loop again with same current, updated upcoming/done
    } else {
      // Move forward by `advance` positions
      // Move current to past
      addToPast(current)

      // Consume (advance - 1) more items from upcoming into past
      for (let i = 1; i < advance; i++) {
        addToPast(upcoming.shift()!)
      }

      // Get next current from upcoming, or fetch from stream
      if (upcoming.length > 0) {
        current = upcoming.shift()!
      } else if (!done) {
        const next = await iter.next()
        if (next.done) {
          done = true
          returnValue = next.value as R
          return returnValue
        }
        current = next.value
      } else {
        // No more items (done was already true, upcoming empty)
        return returnValue as R
      }

      index += advance
    }
  }
}
