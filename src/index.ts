import { Pipeline } from "./pipeline"
import * as tx from "./transforms"
import { StringIterable } from "./types"

// 1. the callable builder
function _p(src: StringIterable) {
  return new Pipeline(src)
}

// 2. merge in the stand-alone helpers *at type level*
export const p: {
  (src: StringIterable): Pipeline
} & typeof tx = Object.assign(_p, tx)

// re-export everything else for tree-shaking users
export * from "./transforms"
export { Pipeline }
