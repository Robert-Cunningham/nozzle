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
  accumulate() {
    return new Pipeline(tx.accumulate(this.src))
  }

  after(pattern: RegExp | string) {
    return new Pipeline(tx.after(this.src, pattern))
  }

  asyncMap(fn: (value: string) => Promise<string>) {
    return new Pipeline(tx.asyncMap(this.src, fn))
  }

  before(pattern: RegExp | string) {
    return new Pipeline(tx.before(this.src, pattern))
  }

  chunk(size: number) {
    return new Pipeline(tx.chunk(this.src, size))
  }

  compact() {
    return new Pipeline(tx.compact(this.src))
  }

  diff() {
    return new Pipeline(tx.diff(this.src))
  }

  filter(predicate: (value: string) => boolean) {
    return new Pipeline(tx.filter(this.src, predicate))
  }

  first() {
    return new Pipeline(tx.first(this.src))
  }

  last() {
    return new Pipeline(tx.last(this.src))
  }

  map(fn: (value: string) => string) {
    return new Pipeline(tx.map(this.src, fn))
  }

  atRate(ms: number) {
    return new Pipeline(tx.minInterval(this.src, ms))
  }

  replace(regex: RegExp, replacement: string) {
    return new Pipeline(tx.replace(this.src, regex, replacement))
  }

  slice(start: number, end?: number) {
    return new Pipeline(tx.slice(this.src, start, end))
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

  tap(fn: (value: string) => void) {
    return new Pipeline(tx.tap(this.src, fn))
  }

  throttle(intervalMs: number) {
    return new Pipeline(tx.throttle(this.src, intervalMs))
  }

  // ---- terminators ----------------------------------------
  asList(): Promise<string[]> {
    return tx.asList(this.src)
  }

  asString(): Promise<string> {
    return tx.asString(this.src)
  }

  value(): StringIterable {
    return this.src
  }

  [Symbol.asyncIterator]() {
    return (this.src as AsyncIterable<string>)[Symbol.asyncIterator]()
  }
}
