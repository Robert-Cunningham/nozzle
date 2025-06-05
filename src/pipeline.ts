import * as tx from "./transforms"
import { StringIterable } from "./types"

/*
 * A pipeline of transformations.
 * @example
 * ```ts
 * const pipeline = new Pipeline(streamOf(["a", "b", "c", "d", "e"]))
 * ```
 */
export class Pipeline implements AsyncIterable<string> {
  constructor(private readonly src: StringIterable) {}

  // ---- 1-to-1 wrappers ------------------------------------
  after(pattern: RegExp) {
    return new Pipeline(tx.after(this.src as StringIterable, pattern))
  }

  // ---- terminator -----------------------------------------
  value(): StringIterable {
    return this.src
  }

  [Symbol.asyncIterator]() {
    return (this.src as AsyncIterable<string>)[Symbol.asyncIterator]()
  }
}
