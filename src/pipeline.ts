import * as tx from "./transforms"
import { StringIterable } from "./types"

/** @hidden
 * A pipeline of transformations.
 * @example
 * ```ts
 * const pipeline = new Pipeline(streamOf(["a", "b", "c", "d", "e"]))
 * ```
 */
export class Pipeline implements AsyncIterable<string> {
  constructor(private readonly src: StringIterable) {}

  // ---- 1-to-1 wrappers ------------------------------------
  after(pattern: RegExp | string) {
    return new Pipeline(tx.after(this.src, pattern))
  }

  before(pattern: RegExp | string) {
    return new Pipeline(tx.before(this.src, pattern))
  }

  split(pattern: RegExp | string) {
    return new Pipeline(tx.split(this.src, pattern))
  }

  splitAfter(pattern: RegExp | string) {
    return new Pipeline(tx.splitAfter(this.src, pattern))
  }

  splitBefore(pattern: RegExp | string) {
    return new Pipeline(tx.splitBefore(this.src, pattern))
  }

  atRate(ms: number) {
    return new Pipeline(tx.minInterTokenDelay(this.src, ms))
  }

  filter(predicate: (value: string) => boolean) {
    return new Pipeline(tx.filter(this.src, predicate))
  }

  map(fn: (value: string) => string) {
    return new Pipeline(tx.map(this.src, fn))
  }

  // ---- terminator -----------------------------------------
  value(): StringIterable {
    return this.src
  }

  [Symbol.asyncIterator]() {
    return (this.src as AsyncIterable<string>)[Symbol.asyncIterator]()
  }
}
