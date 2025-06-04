// import { assert, test } from "vitest"
// import { p } from "../src/index"
//
// test("simple", () => {
//   assert.equal(foo, "foo")
// })
//
// test("simple", () => {
//   // fluent
//   const out = p(stream)
//     .after(/# Response/)
//     .until(/# Reasoning/)
//     .split(" ")
//     .chunk(10)
//     .throttle(100)
//     .value()
// })

import { assert, test } from "vitest"
import { p } from "../src/index"
import { after } from "../src/transforms/after"
import { expectStream, streamOf } from "./helpers"

/* ---------------------------------------------------------------- *\
|  1.  after() in functional form                                    |
\* ---------------------------------------------------------------- */

test("after() emits everything *after* the first matching chunk", async () => {
  const src = streamOf([
    "hello",
    "# Response",
    "a",
    "b",
    "c",
    "# Response still matches but is ignored", // proves only first hit matters
    "d",
  ])

  const out = after(src, /# Response/)
  await expectStream(
    out,
    ["a", "b", "c", "# Response still matches but is ignored", "d"],
    assert,
  )
})

test("after() with no match → empty output", async () => {
  const src = streamOf(["x", "y", "z"])
  const out = after(src, /# Response/)
  await expectStream(out, [], assert)
})

/* ---------------------------------------------------------------- *\
|  2.  Same logic inside a fluent chain                              |
\* ---------------------------------------------------------------- */

test("full pipeline example", async () => {
  const src = streamOf([
    "meta",
    "# Response",
    "The quick brown fox jumps over the lazy dog",
    "!",
  ])

  const out = p(src)
    .after(/# Response/)
    .value()

  await expectStream(
    out,
    ["The quick brown fox jumps over the lazy dog", "!"],
    assert,
  )
})
