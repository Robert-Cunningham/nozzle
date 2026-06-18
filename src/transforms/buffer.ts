import { Channel } from "../primitives"

/**
 * Buffers up to N items from the source iterator, consuming them eagerly
 * and yielding them on demand. If n is undefined, buffers unlimited items.
 *
 * The buffer() function "slurps up" as much of the input iterator as it can
 * as fast as it can, storing items in an internal buffer. When items are
 * requested from the buffer, they are yielded from this pre-filled buffer.
 * This creates a decoupling between the consumption rate and the production rate.
 *
 * @group Buffering
 * @param source The async iterable source of values.
 * @param n The maximum number of items to buffer. If undefined, buffers unlimited items.
 * @returns An async iterable that yields buffered values.
 *
 * @example
 * ```ts
 * nz(["a", "b", "c"]).tap(x => console.log(`consumed: ${x}`)).buffer(2).tap(x => console.log(`yielded: ${x}`)) // => consumed: a, consumed: b, yielded: a, consumed: c, yielded: b, yielded: c
 * ```
 */
export const buffer = async function* <T, R = any>(source: AsyncIterable<T, R>, n?: number): AsyncGenerator<T, R> {
  if (n !== undefined && (n <= 0 || !Number.isInteger(n))) {
    throw new Error(`buffer size must be a positive integer, got ${n}`)
  }

  return yield* Channel.from(source, { capacity: n })
}
