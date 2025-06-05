import { Pipeline } from "./pipeline"
import * as tx from "./transforms"
import { StringIterable } from "./types"

// 1. the callable builder
function _p<T>(src: StringIterable<T>) {
  return new Pipeline(src)
}

// 2. merge in the stand-alone helpers *at type level*
export const p: {
  <T>(src: StringIterable<T>): Pipeline<T>
} & typeof tx = Object.assign(_p, tx)

// re-export everything else for tree-shaking users
export * from "./transforms"
export { Pipeline }
