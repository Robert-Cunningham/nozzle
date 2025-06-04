import * as tx from "./transforms"
import { AnyIterable } from "./types"

export class Pipeline<T> implements AsyncIterable<T> {
  constructor(private readonly src: AnyIterable<T>) {}

  // ---- 1-to-1 wrappers ------------------------------------
  after(pattern: RegExp) {
    return new Pipeline(tx.after(this.src as AnyIterable<string>, pattern))
  }

  // ---- terminator -----------------------------------------
  value(): AnyIterable<T> {
    return this.src
  }

  [Symbol.asyncIterator]() {
    return (this.src as AsyncIterable<T>)[Symbol.asyncIterator]()
  }
}
