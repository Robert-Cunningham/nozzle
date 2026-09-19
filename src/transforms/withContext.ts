import { Cursor } from "../primitives"
import { Iterable } from "../types"

export type WithContextOptions = {
  before?: number
  after?: number
}

export type ItemContext<T> = {
  readonly past: readonly T[]
  readonly current: T
  readonly upcoming: readonly T[]
  readonly index: number
}

/**
 * Yields each item with bounded neighboring context in source order.
 * `before` and `after` default to zero and must be nonnegative safe integers.
 * Lookahead delays emission until `after` items arrive or the source ends.
 * Context is shorter at stream boundaries. Each output has independent arrays;
 * the items themselves are shared. The source's return value is preserved.
 *
 * @group Buffering
 * @example
 * ```ts
 * nz([1, 2, 3]).withContext({ before: 1, after: 1 })
 * // { past: [], current: 1, upcoming: [2], index: 0 }
 * // { past: [1], current: 2, upcoming: [3], index: 1 }
 * // { past: [2], current: 3, upcoming: [], index: 2 }
 * ```
 */
export async function* withContext<T, R = any>(
  source: Iterable<T, R>,
  options: WithContextOptions = {},
): AsyncGenerator<ItemContext<T>, R> {
  const { before = 0, after = 0 } = options
  for (const [name, count] of Object.entries({ before, after })) {
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError(`${name} must be a nonnegative safe integer`)
    }
  }

  const cursor = new Cursor(source, { maxPast: before })
  try {
    if (await cursor.init()) {
      while (cursor.hasCurrent) {
        await cursor.peek(after)
        const { past, current, upcoming, index } = cursor.snapshot()
        yield { past, current, upcoming, index }
        await cursor.advance()
      }
    }
    return cursor.returnValue as R
  } finally {
    await cursor.cancel()
  }
}
