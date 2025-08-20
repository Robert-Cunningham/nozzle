import * as tx from "./transforms"
import { Iterable } from "./types"

/** @hidden
 * A pipeline of transformations.
 * @example
 * ```ts
 * const pipeline = new Pipeline(streamOf(["a", "b", "c", "d", "e"]))
 * ```
 */
export class Pipeline<T = string, R = any> implements AsyncIterable<T, R> {
  constructor(protected readonly src: Iterable<T, R>) {}

  // ---- Generic methods that work with any type T ----
  filter(predicate: (value: T) => boolean) {
    return new Pipeline<T, R>(tx.filter(this.src, predicate))
  }

  first() {
    return new Pipeline<T, R>(tx.first(this.src))
  }

  last() {
    return new Pipeline<T, R>(tx.last(this.src))
  }

  map<U>(fn: (value: T) => U) {
    return new Pipeline<U, R>(tx.map(this.src, fn))
  }

  asyncMap<U>(fn: (value: T) => Promise<U>) {
    return new Pipeline<U, R>(tx.asyncMap(this.src, fn))
  }

  buffer(n?: number) {
    return new Pipeline<T, R>(tx.buffer(this.src, n))
  }

  aperture(n: number) {
    return new Pipeline<T[], R>(tx.aperture(this.src, n))
  }

  flatten<U>(this: Pipeline<U[] | Iterable<U>, R>) {
    return new Pipeline<U, R>(tx.flatten(this.src))
  }

  slice(start: number, end?: number) {
    return new Pipeline<T, R>(tx.slice(this.src, start, end))
  }

  tap(fn: (value: T) => void) {
    return new Pipeline<T, R>(tx.tap(this.src, fn))
  }

  throttle(intervalMs: number, merge: (values: T[]) => T) {
    return new Pipeline<T, R>(tx.throttle(this.src, intervalMs, merge))
  }

  wrap() {
    return new Pipeline<{ value?: T; return?: R; error?: unknown }, undefined>(tx.wrap(this.src))
  }

  unwrap(this: Pipeline<{ value?: T; return?: R; error?: unknown }, R>) {
    return new Pipeline<T, any>(tx.unwrap(this.src))
  }

  // ---- String-specific methods ----
  accumulate(this: Pipeline<string, R>): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.accumulate(this.src as AsyncIterable<string>))
  }

  after(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.after(this.src as AsyncIterable<string>, pattern))
  }

  before(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.before(this.src as AsyncIterable<string>, pattern))
  }

  chunk(this: Pipeline<string, R>, size: number): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.chunk(this.src as AsyncIterable<string>, size))
  }

  compact(this: Pipeline<string, R>): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.compact(this.src as AsyncIterable<string>))
  }

  diff(this: Pipeline<string, R>): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.diff(this.src as AsyncIterable<string>))
  }

  minInterval(this: Pipeline<string, R>, delayMs: number): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.minInterval(this.src as AsyncIterable<string>, delayMs))
  }

  replace(this: Pipeline<string, R>, regex: RegExp, replacement: string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.replace(this.src as AsyncIterable<string>, regex, replacement))
  }

  split(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.split(this.src as AsyncIterable<string>, pattern))
  }

  splitAfter(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.splitAfter(this.src as AsyncIterable<string>, pattern))
  }

  splitBefore(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.splitBefore(this.src as AsyncIterable<string>, pattern))
  }

  asString(this: Pipeline<string, R>): Promise<string> {
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
