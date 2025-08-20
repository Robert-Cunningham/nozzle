import { Pipeline } from "./pipeline"
import * as tx from "./transforms"
import { Iterable, StringIterable } from "./types"

// 1. the callable builder - overloaded for string and generic types
function _p(src: StringIterable): Pipeline<string>
function _p<T>(src: Iterable<T>): Pipeline<T>
function _p<T, R>(src: Iterable<T>): Pipeline<T, R>
function _p<T, R>(src: Iterable<T>) {
  return new Pipeline<T, R>(src)
}

// 2. merge in the stand-alone helpers *at type level*
/** @hidden */
export const nz: {
  (src: StringIterable): Pipeline<string>
  <T>(src: Iterable<T>): Pipeline<T>
  <T, R>(src: Iterable<T>): Pipeline<T, R>
} & typeof tx = Object.assign(_p, tx)

// re-export everything else for tree-shaking users
export * from "./transforms"
export { Pipeline }
