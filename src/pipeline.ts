import { ConsumedPipeline } from "./consumedPipeline"
import * as tx from "./transforms"
import { ScanResult } from "./transforms/scan"
import { Iterable } from "./types"

/**
 * A pipeline of transformations.
 * @hidden
 * @example
 * ```ts
 * const pipeline = new Pipeline(streamOf(["a", "b", "c", "d", "e"]))
 * ```
 */
export class Pipeline<T = string, R = any> implements AsyncIterable<T, R> {
  constructor(protected readonly src: Iterable<T, R>) {}

  // ---- Generic methods that work with any type T ----
  /**
   * @hidden
   */
  filter(predicate: (value: T) => boolean) {
    return new Pipeline<T, R>(tx.filter(this.src, predicate))
  }

  /**
   * @hidden
   */
  find(predicate: (value: T) => boolean): Promise<T | undefined> {
    return tx.find(this.src, predicate)
  }

  /**
   * @hidden
   */
  first(): Promise<T | undefined> {
    return tx.first(this.src)
  }

  /**
   * @hidden
   */
  last(): Promise<T | undefined> {
    return tx.last(this.src)
  }

  /**
   * @hidden
   */
  map<U>(fn: (value: T) => U) {
    return new Pipeline<U, R>(tx.map(this.src, fn))
  }

  /**
   * @hidden
   */
  reduce<A>(reducer: (accumulator: A, current: T, index: number) => A, initial: A) {
    return new Pipeline<A, R>(tx.reduce(this.src, reducer, initial))
  }

  /**
   * @hidden
   */
  asyncMap<U>(fn: (value: T) => Promise<U>) {
    return new Pipeline<U, R>(tx.asyncMap(this.src, fn))
  }

  /**
   * @hidden
   */
  buffer(n?: number) {
    return new Pipeline<T, R>(tx.buffer(this.src, n))
  }

  /**
   * @hidden
   */
  aperture(n: number) {
    return new Pipeline<T[], R>(tx.aperture(this.src, n))
  }

  /**
   * @hidden
   */
  flatten<U>(this: Pipeline<U[] | Iterable<U>, R>) {
    return new Pipeline<U, R>(tx.flatten(this.src))
  }

  /**
   * @hidden
   */
  slice(start: number, end?: number) {
    return new Pipeline<T, R>(tx.slice(this.src, start, end))
  }

  /**
   * @hidden
   */
  tap(fn: (value: T) => void) {
    return new Pipeline<T, R>(tx.tap(this.src, fn))
  }

  /**
   * @hidden
   */
  throttle(intervalMs: number, merge: (values: T[]) => T) {
    return new Pipeline<T, R>(tx.throttle(this.src, intervalMs, merge))
  }

  /**
   * @hidden
   */
  minInterval(delayMs: number) {
    return new Pipeline<T, R>(tx.minInterval(this.src, delayMs))
  }

  /**
   * @hidden
   */
  mapReturn<U>(fn: (value: R) => U) {
    return new Pipeline<T, U>(tx.mapReturn(this.src, fn))
  }

  /**
   * @hidden
   */
  wrap() {
    return new Pipeline<{ value?: T; return?: R; error?: unknown }, undefined>(tx.wrap(this.src))
  }

  /**
   * @hidden
   */
  unwrap(this: Pipeline<{ value?: T; return?: R; error?: unknown }, R>) {
    return new Pipeline<T, any>(tx.unwrap(this.src))
  }

  /**
   * @hidden
   */
  window<K>(
    fn: (ctx: { past: T[]; current: T; upcoming: T[]; index: number; done: boolean }) => { value: K; advance?: number },
    options?: { maxPast?: number },
  ) {
    return new Pipeline<K, R>(tx.window(this.src, fn, options))
  }

  // ---- String-specific methods ----
  /**
   * @hidden
   */
  accumulate(this: Pipeline<string, R>): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.accumulate(this.src as AsyncIterable<string>))
  }

  /**
   * @hidden
   */
  after(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.after(this.src as AsyncIterable<string>, pattern))
  }

  /**
   * @hidden
   */
  before(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.before(this.src as AsyncIterable<string>, pattern))
  }

  /**
   * @hidden
   */
  chunk(this: Pipeline<string, R>, size: number): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.chunk(this.src as AsyncIterable<string>, size))
  }

  /**
   * @hidden
   */
  compact(this: Pipeline<string, R>): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.compact(this.src as AsyncIterable<string>))
  }

  /**
   * @hidden
   */
  diff(this: Pipeline<string, R>): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.diff(this.src as AsyncIterable<string>))
  }

  /**
   * @hidden
   */
  replace(this: Pipeline<string, R>, regex: RegExp, replacement: string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.replace(this.src as AsyncIterable<string>, regex, replacement))
  }

  /**
   * @hidden
   */
  scan(this: Pipeline<string, R>, regex: RegExp): Pipeline<ScanResult, R> {
    return new Pipeline<ScanResult, R>(tx.scan(this.src as AsyncIterable<string>, regex))
  }

  /**
   * @hidden
   */
  parse<T>(
    this: Pipeline<string, R>,
    regex: RegExp,
    transform: (match: RegExpExecArray) => T,
  ): Pipeline<string | T, R> {
    return new Pipeline<string | T, R>(tx.parse(this.src as AsyncIterable<string>, regex, transform))
  }

  /**
   * @hidden
   */
  match(this: Pipeline<string, R>, regex: RegExp): Pipeline<RegExpExecArray, R> {
    return new Pipeline<RegExpExecArray, R>(tx.match(this.src as AsyncIterable<string>, regex))
  }

  /**
   * @hidden
   */
  split(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.split(this.src as AsyncIterable<string>, pattern))
  }

  /**
   * @hidden
   */
  splitAfter(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.splitAfter(this.src as AsyncIterable<string>, pattern))
  }

  /**
   * @hidden
   */
  splitBefore(this: Pipeline<string, R>, pattern: RegExp | string): Pipeline<string, R> {
    return new Pipeline<string, R>(tx.splitBefore(this.src as AsyncIterable<string>, pattern))
  }

  // ---- terminators ----------------------------------------
  /**
   * @hidden
   */
  consume(): Promise<ConsumedPipeline<T, R>> {
    return tx.consume(this.src)
  }

  /**
   * @hidden
   */
  value(): Iterable<T> {
    return this.src
  }

  [Symbol.asyncIterator]() {
    return (this.src as AsyncIterable<T>)[Symbol.asyncIterator]()
  }
}
