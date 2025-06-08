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

  throttle(intervalMs: number, merge: (values: T[]) => T) {
    return new Pipeline<T>(tx.throttle(this.src, intervalMs, merge))
  }

  // ---- String-specific methods ----
  accumulate(this: Pipeline<string>): Pipeline<string> {
    return new Pipeline<string>(
      tx.accumulate(this.src as AsyncIterable<string>),
    )
  }

  after(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string> {
    return new Pipeline<string>(
      tx.after(this.src as AsyncIterable<string>, pattern),
    )
  }

  before(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string> {
    return new Pipeline<string>(
      tx.before(this.src as AsyncIterable<string>, pattern),
    )
  }

  chunk(this: Pipeline<string>, size: number): Pipeline<string> {
    return new Pipeline<string>(
      tx.chunk(this.src as AsyncIterable<string>, size),
    )
  }

  compact(this: Pipeline<string>): Pipeline<string> {
    return new Pipeline<string>(tx.compact(this.src as AsyncIterable<string>))
  }

  diff(this: Pipeline<string>): Pipeline<string> {
    return new Pipeline<string>(tx.diff(this.src as AsyncIterable<string>))
  }

  minInterval(this: Pipeline<string>, delayMs: number): Pipeline<string> {
    return new Pipeline<string>(
      tx.minInterval(this.src as AsyncIterable<string>, delayMs),
    )
  }

  replace(
    this: Pipeline<string>,
    regex: RegExp,
    replacement: string,
  ): Pipeline<string> {
    return new Pipeline<string>(
      tx.replace(this.src as AsyncIterable<string>, regex, replacement),
    )
  }

  split(this: Pipeline<string>, pattern: RegExp | string): Pipeline<string> {
    return new Pipeline<string>(
      tx.split(this.src as AsyncIterable<string>, pattern),
    )
  }

  splitAfter(
    this: Pipeline<string>,
    pattern: RegExp | string,
  ): Pipeline<string> {
    return new Pipeline<string>(
      tx.splitAfter(this.src as AsyncIterable<string>, pattern),
    )
  }

  splitBefore(
    this: Pipeline<string>,
    pattern: RegExp | string,
  ): Pipeline<string> {
    return new Pipeline<string>(
      tx.splitBefore(this.src as AsyncIterable<string>, pattern),
    )
  }

  asString(this: Pipeline<string>): Promise<string> {
    return tx.asString(this.src as AsyncIterable<string>)
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
