import { expect, expectTypeOf, test } from "vitest"
import { aperture, before, head, nz, Pipeline, slice, takeUntil, takeWhile } from "../src"

async function* source(values = ["a", "stop", "b"]): AsyncGenerator<string, string> {
  yield* values
  return "done"
}

test("early-stopping pipeline methods expose an optional return value", () => {
  expectTypeOf(nz(source()).takeWhile(() => false)).toEqualTypeOf<Pipeline<string, string | undefined>>()
  expectTypeOf(nz(source()).takeUntil(() => true)).toEqualTypeOf<Pipeline<string, string | undefined>>()
  expectTypeOf(nz(source()).before("stop")).toEqualTypeOf<Pipeline<string, string | undefined>>()
  expectTypeOf(nz(source()).head()).toEqualTypeOf<Pipeline<string, string | undefined>>()
  expectTypeOf(nz(source()).slice(0, 1)).toEqualTypeOf<Pipeline<string, string | undefined>>()
  expectTypeOf(nz(source()).aperture(0)).toEqualTypeOf<Pipeline<string[], string | undefined>>()

  nz(source())
    .takeWhile(() => false)
    .mapReturn((value) => {
      // @ts-expect-error Early termination can leave the return value undefined.
      return value.toUpperCase()
    })
  nz(source())
    .head()
    .map((value) => value)
    .mapReturn((value) => {
      // @ts-expect-error Early termination can leave the return value undefined.
      return value.toUpperCase()
    })
})

test("standalone transforms expose the same optional return types", () => {
  expectTypeOf(takeWhile(source(), () => false)).toEqualTypeOf<AsyncGenerator<string, string | undefined, undefined>>()
  expectTypeOf(takeUntil(source(), () => true)).toEqualTypeOf<AsyncGenerator<string, string | undefined, undefined>>()
  expectTypeOf(before(source(), "stop")).toEqualTypeOf<AsyncGenerator<string, string | undefined, undefined>>()
  expectTypeOf(head(source())).toEqualTypeOf<AsyncGenerator<string, string | undefined, undefined>>()
  expectTypeOf(slice(source(), 0, 1)).toEqualTypeOf<AsyncGenerator<string, string | undefined, undefined>>()
  expectTypeOf(aperture(source(), 0)).toEqualTypeOf<AsyncGenerator<string[], string | undefined>>()
})

test("full-consumption methods retain precise return types", async () => {
  expectTypeOf(nz(source()).slice(1)).toEqualTypeOf<Pipeline<string, string>>()
  expectTypeOf(nz(source()).slice(1, undefined)).toEqualTypeOf<Pipeline<string, string>>()
  expectTypeOf(nz(source()).tail()).toEqualTypeOf<Pipeline<string, string>>()
  expectTypeOf(nz(source()).initial()).toEqualTypeOf<Pipeline<string, string>>()
  expectTypeOf(slice(source(), 1)).toEqualTypeOf<AsyncGenerator<string, string, undefined>>()
  for (const pipeline of [nz(source()).tail(), nz(source()).initial(), nz(source()).slice(1)]) {
    expect((await pipeline.mapReturn((value) => value.toUpperCase()).consume()).return()).toBe("DONE")
  }
})

test("optional returns stay typed through iterator access and wrap/unwrap", () => {
  const pipeline = nz(source()).takeUntil(() => true)
  expectTypeOf(pipeline.value()).toEqualTypeOf<AsyncIterable<string, string | undefined>>()
  expectTypeOf(pipeline[Symbol.asyncIterator]()).toEqualTypeOf<AsyncIterator<string, string | undefined>>()
  expectTypeOf(pipeline.wrap().unwrap()).toEqualTypeOf<Pipeline<string, string | undefined>>()
})

test("early termination reaches mapReturn as undefined", async () => {
  for (const pipeline of [
    nz(source()).takeWhile(() => false),
    nz(source()).takeUntil(() => true),
    nz(source()).before("stop"),
    nz(source()).head(),
    nz(source()).slice(0, 1),
  ]) {
    expect((await pipeline.mapReturn((value) => value?.toUpperCase() ?? "stopped").consume()).return()).toBe("stopped")
  }
  expect((await nz(source()).aperture(0).consume()).return()).toBeUndefined()
})

test("natural completion still preserves the source's final value", async () => {
  for (const pipeline of [
    nz(source()).takeWhile(() => true),
    nz(source()).takeUntil(() => false),
    nz(source()).before("missing"),
    nz(source([])).head(),
    nz(source()).slice(0, 10),
  ]) {
    expect((await pipeline.consume()).return()).toBe("done")
  }
})

test.each([[], ["a"], ["a", "b"]])("initial preserves returns for %j", async (...values) => {
  const result = await nz(source(values)).initial().consume()
  expect(result.list()).toEqual(values.slice(0, -1))
  expect(result.return()).toBe("done")
})

test("a value yielded during upstream return is not a final return value", async () => {
  function makeSource(): AsyncIterable<string, number> {
    return {
      [Symbol.asyncIterator]() {
        return {
          next: async () => ({ done: false, value: "item" }),
          return: async () => ({ done: false, value: "cleanup yield" }),
        }
      },
    }
  }
  for (const pipeline of [
    nz(makeSource()).takeWhile(() => false),
    nz(makeSource()).takeUntil(() => true),
    nz(makeSource()).head(),
    nz(makeSource()).slice(0, 1),
  ]) {
    expect((await pipeline.consume()).return()).toBeUndefined()
  }
})
