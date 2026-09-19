/**
 * Nozzle provides utility functions for working with async iterables in a functional and chainable manner.

 * The individual functions can be invoked directly on async iterables:
* ```ts
 * async function* generate() { yield 1; yield 2; yield 3 }
 * for await (filter(generate(), x => x > 1)) {
 *   console.log(x) // 2, 3 
 * }
 * ```
 * 
 * They can also be chained using the `nz` function, which accepts many iterable sources:
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
 * nz(stream).map(chunk => chunk.choices[0]?.delta?.content).filter(x => !!x).split(' ').slice(0, 10)
 * ```
 *
 * @module
 * @disableGroups
 */

import { Pipeline } from "./pipeline"
import * as tx from "./transforms"
// Preserve both yield and return types when adapting synchronous sources.
function ensureAsyncIterable<T, R>(source: globalThis.Iterable<T, R> | AsyncIterable<T, R>): AsyncIterable<T, R> {
  if (Symbol.asyncIterator in Object(source)) {
    return source as AsyncIterable<T, R>
  }
  if (Symbol.iterator in Object(source)) {
    return (async function* (): AsyncGenerator<T, R> {
      return yield* source as globalThis.Iterable<T, R>
    })()
  }
  throw new TypeError("nz expects a synchronous or asynchronous iterable")
}

function pipeline<T>(src: readonly T[]): Pipeline<T, undefined>
function pipeline<T, R = undefined>(src: globalThis.Iterable<T, R> | AsyncIterable<T, R>): Pipeline<T, R>
function pipeline<T, R>(src: globalThis.Iterable<T, R> | AsyncIterable<T, R>): Pipeline<T, R> {
  return new Pipeline(ensureAsyncIterable(src))
}

/** @hidden */
export const nz = Object.assign(pipeline, tx)

// re-export everything else for tree-shaking users
export * from "./transforms"
export { Pipeline }
