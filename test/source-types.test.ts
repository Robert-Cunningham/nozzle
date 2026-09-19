import { expect, expectTypeOf, test } from "vitest"
import { nz, Pipeline } from "../src"

test("preserves synchronous generator returns through a pipeline", async () => {
  function* source() {
    yield "hello"
    return { count: 1 }
  }
  const pipeline = nz(source()).map((s) => s.toUpperCase())
  expectTypeOf(pipeline).toEqualTypeOf<Pipeline<string, { count: number }>>()
  const result = await pipeline.consume()
  expect(result.list()).toEqual(["HELLO"])
  expect(result.return()).toEqual({ count: 1 })
})

test("preserves async return types through value, iteration, and wrap/unwrap", async () => {
  async function* source() {
    yield "a"
    return 42
  }
  const pipeline = nz(source()).split(",")
  expectTypeOf(pipeline.value()).toEqualTypeOf<AsyncIterable<string, number>>()
  expectTypeOf(pipeline[Symbol.asyncIterator]()).toEqualTypeOf<AsyncIterator<string, number>>()
  const roundTrip = pipeline.wrap().unwrap()
  expectTypeOf(roundTrip).toEqualTypeOf<Pipeline<string, number>>()
  expect((await roundTrip.consume()).return()).toBe(42)
})

test("arrays have an undefined return type and sync flatMap accepts arrays", async () => {
  const pipeline = nz(["hi"]).flatMap((s) => s.split(""))
  expectTypeOf(pipeline).toEqualTypeOf<Pipeline<string, undefined>>()
  expect((await pipeline.consume()).list()).toEqual(["h", "i"])
})

test("closing an adapted synchronous generator runs its cleanup", async () => {
  let closed = false
  function* source() {
    try {
      yield 1
      yield 2
    } finally {
      closed = true
    }
    return "done"
  }
  for await (const _value of nz(source())) break
  expect(closed).toBe(true)
})

test("empty synchronous generators preserve their return value", async () => {
  function* source(): Generator<string, string> {
    return "empty"
  }
  expect((await nz(source()).consume()).return()).toBe("empty")
})
