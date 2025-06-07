import * as tx from "./transforms"
import { Iterable } from "./types"

/** @hidden
 * A pipeline of transformations.
 * @example
 * ```ts
 * const pipeline = new Pipeline(streamOf(["a", "b", "c", "d", "e"]))
 * ```
 */
export class Pipeline<T = string> implements AsyncIterable<T> {
  constructor(protected readonly src: Iterable<T>) {}

  // ---- Generic methods that work with any type T ----
  filter(predicate: (value: T) => boolean) {
    return new Pipeline<T>(tx.filter(this.src, predicate))
  }

  first() {
    return new Pipeline<T>(tx.first(this.src))
  }

  last() {
    return new Pipeline<T>(tx.last(this.src))
  }

  map<U>(fn: (value: T) => U) {
    return new Pipeline<U>(tx.map(this.src, fn))
  }

  asyncMap<U>(fn: (value: T) => Promise<U>) {
    return new Pipeline<U>(tx.asyncMap(this.src, fn))
  }

  slice(start: number, end?: number) {
    return new Pipeline<T>(tx.slice(this.src, start, end))
  }

  tap(fn: (value: T) => void) {
    return new Pipeline<T>(tx.tap(this.src, fn))
  }

  throttle(intervalMs: number) {
    return new Pipeline<T>(tx.throttle(this.src, intervalMs))
  }

  // ---- terminators ----------------------------------------
  asList(): Promise<T[]> {
    return tx.asList(this.src)
  }

  value(): Iterable<T> {
    return this.src
  }

  [Symbol.asyncIterator]() {
    return (this.src as AsyncIterable<T>)[Symbol.asyncIterator]()
  }
}

// String-specific methods for Pipeline<string>
declare module "./pipeline" {
  interface Pipeline<T> {
    accumulate(this: Pipeline<string>): Pipeline<string>
    after(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string>
    before(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string>
    chunk(this: Pipeline<string>, size: number): Pipeline<string>
    compact(this: Pipeline<string>): Pipeline<string>
    diff(this: Pipeline<string>): Pipeline<string>
    atRate(this: Pipeline<string>, ms: number): Pipeline<string>
    replace(this: Pipeline<string>, regex: RegExp, replacement: string): Pipeline<string>
    split(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string>
    splitAfter(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string>
    splitBefore(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string>
    asString(this: Pipeline<string>): Promise<string>
  }
}

// Implementation of string-specific methods
Object.assign(Pipeline.prototype, {
  accumulate(this: Pipeline<string>) {
    return new Pipeline<string>(tx.accumulate(this.src))
  },

  after(this: Pipeline<string>, pattern: RegExp | string) {
    return new Pipeline<string>(tx.after(this.src, pattern))
  },

  before(this: Pipeline<string>, pattern: RegExp | string) {
    return new Pipeline<string>(tx.before(this.src, pattern))
  },

  chunk(this: Pipeline<string>, size: number) {
    return new Pipeline<string>(tx.chunk(this.src, size))
  },

  compact(this: Pipeline<string>) {
    return new Pipeline<string>(tx.compact(this.src))
  },

  diff(this: Pipeline<string>) {
    return new Pipeline<string>(tx.diff(this.src))
  },

  atRate(this: Pipeline<string>, ms: number) {
    return new Pipeline<string>(tx.minInterval(this.src, ms))
  },

  replace(this: Pipeline<string>, regex: RegExp, replacement: string) {
    return new Pipeline<string>(tx.replace(this.src, regex, replacement))
  },

  split(this: Pipeline<string>, pattern: RegExp | string) {
    return new Pipeline<string>(tx.split(this.src, pattern))
  },

  splitAfter(this: Pipeline<string>, pattern: RegExp | string) {
    return new Pipeline<string>(tx.splitAfter(this.src, pattern))
  },

  splitBefore(this: Pipeline<string>, pattern: RegExp | string) {
    return new Pipeline<string>(tx.splitBefore(this.src, pattern))
  },

  asString(this: Pipeline<string>) {
    return tx.asString(this.src)
  }
})
