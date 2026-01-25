/**
 * # Nozzle - Stream Processing Library
 *
 * Nozzle is built for manipulating async iterators and streams through chainable transformations.
 * It converts various input sources into Pipelines that support functional-style method chaining.
 *
 * ## Core Components
 *
 * ### nz(source) - Main Entry Point
 * Creates a Pipeline from various iterable sources. Automatically converts sync iterables to async.
 *
 * ```ts
 * // From arrays
 * nz(['a', 'b', 'c']).map(x => x.toUpperCase())
 *
 * // From async generators
 * async function* generate() { yield 1; yield 2; yield 3 }
 * nz(generate()).filter(x => x > 1)
 *
 * // From streams (like LLM responses)
 * const stream = await openai.chat.completions.create({...args, stream: true})
 * nz(stream).filter(chunk => chunk.choices[0]?.delta?.content)
 * ```
 *
 * ### Pipeline<T, R> - Chainable Transformations
 * The core class providing immutable method chaining. Each method returns a new Pipeline instance.
 *
 * ```ts
 * const result = await nz([1, 2, 3, 4, 5])
 *   .filter(x => x > 2)           // Pipeline<number>
 *   .map(x => x * 2)              // Pipeline<number>
 *   .slice(0, 2)                  // Pipeline<number>
 *   .consume()                    // Promise<ConsumedPipeline<number>>
 * ```
 *
 * ## Working with Async Iterators
 * Nozzle works seamlessly with manually constructed async iterators:
 *
 * ```ts
 * async function* customIterator() {
 *   yield "first"
 *   yield "second"
 *   return "final"  // This becomes the return value
 * }
 *
 * const result = await nz(customIterator())
 *   .map(x => x.toUpperCase())
 *   .consume()
 *
 * console.log(result.list())    // ["FIRST", "SECOND"]
 * console.log(result.return())  // "final"
 * ```
 *
 * @module
 * @disableGroups
 */

import { Pipeline } from "./pipeline"
import * as tx from "./transforms"
import { Iterable, StringIterable } from "./types"

// Helper function to convert sync iterables to async iterables
function ensureAsyncIterable<T>(source: T[] | globalThis.Iterable<T> | AsyncIterable<T>): AsyncIterable<T> {
  // Check if it's already an async iterable
  if (source && typeof source === "object" && Symbol.asyncIterator in source) {
    return source as AsyncIterable<T>
  }
  // Check if it's a sync iterable (arrays, strings, Sets, Maps, etc.)
  if (
    Array.isArray(source) ||
    (source && typeof source === "object" && Symbol.iterator in source) ||
    typeof source === "string"
  ) {
    return (async function* () {
      for (const item of source as globalThis.Iterable<T>) {
        yield item
      }
    })()
  } else {
    return source as AsyncIterable<T>
  }
}

// 1. the callable builder - overloaded for string and generic types
function _p(src: StringIterable): Pipeline<string>
function _p(src: string[]): Pipeline<string>
function _p<T>(src: Iterable<T>): Pipeline<T>
function _p<T>(src: T[]): Pipeline<T>
function _p<T>(src: globalThis.Iterable<T>): Pipeline<T>
function _p<T, R>(src: Iterable<T>): Pipeline<T, R>
function _p<T, R>(src: T[]): Pipeline<T, R>
function _p<T, R>(src: globalThis.Iterable<T>): Pipeline<T, R>
function _p<T, R>(src: Iterable<T> | T[] | globalThis.Iterable<T>) {
  const asyncIterable = ensureAsyncIterable(src as T[] | globalThis.Iterable<T> | AsyncIterable<T>)
  return new Pipeline<T, R>(asyncIterable)
}

// 2. merge in the stand-alone helpers *at type level*
/** @hidden */
export const nz: {
  (src: StringIterable): Pipeline<string>
  (src: string[]): Pipeline<string>
  <T>(src: Iterable<T>): Pipeline<T>
  <T>(src: T[]): Pipeline<T>
  <T>(src: globalThis.Iterable<T>): Pipeline<T>
  <T, R>(src: Iterable<T>): Pipeline<T, R>
  <T, R>(src: T[]): Pipeline<T, R>
  <T, R>(src: globalThis.Iterable<T>): Pipeline<T, R>
} & typeof tx = Object.assign(_p, tx)

// re-export everything else for tree-shaking users
export * from "./transforms"
export { Pipeline }
