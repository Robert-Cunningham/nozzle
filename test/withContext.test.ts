import { expect, expectTypeOf, test, vi } from "vitest"
import * as nozzle from "../src"
import { nz, type ItemContext, type Pipeline } from "../src"

test("context is bounded, ordered, and shorter at the boundaries", async () => {
  const result = await nz([1, 2, 3, 4]).withContext({ before: 2, after: 1 }).consume()
  expect(result.list()).toEqual([
    { past: [], current: 1, upcoming: [2], index: 0 },
    { past: [1], current: 2, upcoming: [3], index: 1 },
    { past: [1, 2], current: 3, upcoming: [4], index: 2 },
    { past: [2, 3], current: 4, upcoming: [], index: 3 },
  ])
})

test.each([{ items: [] }, { items: [1] }, { items: [1, 2] }])(
  "context larger than source preserves every item: %j",
  async ({ items }) => {
    const result = await nz(items).withContext({ before: 5, after: 5 }).consume()
    expect(result.list()).toEqual(
      items.map((current, index) => ({
        past: items.slice(0, index),
        current,
        upcoming: items.slice(index + 1),
        index,
      })),
    )
  },
)

test("defaults require no lookahead and preserve return types and values", async () => {
  let reads = 0
  async function* source() {
    reads++
    yield "a"
    reads++
    yield "b"
    return 42
  }
  const pipeline = nz(source()).withContext()
  expectTypeOf(pipeline).toEqualTypeOf<Pipeline<ItemContext<"a" | "b">, number>>()
  const iterator = pipeline[Symbol.asyncIterator]()
  expect((await iterator.next()).value).toEqual({ past: [], current: "a", upcoming: [], index: 0 })
  expect(reads).toBe(1)
  const result = await nz({ [Symbol.asyncIterator]: () => iterator }).consume()
  expect(result.return()).toBe(42)
})

test("empty source retains its return value", async () => {
  async function* source(): AsyncGenerator<number, string> {
    return "empty"
  }
  const result = await nz(source()).withContext({ after: 2 }).consume()
  expect(result.list()).toEqual([])
  expect(result.return()).toBe("empty")
})

test("lookahead reads only the requested context and closes on break", async () => {
  let reads = 0
  let closed = false
  async function* source() {
    try {
      while (true) yield reads++
    } finally {
      closed = true
    }
  }
  for await (const context of nz(source()).withContext({ before: 2, after: 3 })) {
    expect(reads).toBe(4)
    expect(context.upcoming).toEqual([1, 2, 3])
    break
  }
  expect(closed).toBe(true)
})

test("snapshots cannot alter later context through their arrays", async () => {
  const iterator = nz([1, 2, 3]).withContext({ before: 1, after: 1 })[Symbol.asyncIterator]()
  const first = await iterator.next()
  if (first.done) throw new Error("missing first item")
  ;(first.value.upcoming as number[]).push(99)
  ;(first.value.past as number[]).push(99)
  expect((await iterator.next()).value).toEqual({ past: [1], current: 2, upcoming: [3], index: 1 })
  await iterator.return?.()
})

test.each([0, 1, 3])("source errors are catchable with lookahead %i", async (after) => {
  const failure = new Error("source failed")
  let reads = 0
  const source = {
    [Symbol.asyncIterator]() {
      return this
    },
    async next(): Promise<IteratorResult<number, undefined>> {
      if (reads++ === 0) return { value: 1, done: false }
      throw failure
    },
    return: vi.fn(async () => ({ value: undefined, done: true as const })),
  }
  await expect(nz(source).withContext({ after }).consume()).rejects.toBe(failure)
  expect(source.return).toHaveBeenCalledTimes(1)
})

test.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  "rejects invalid counts before reading: %s",
  async (count) => {
    const source = { [Symbol.asyncIterator]: vi.fn() }
    for (const option of ["before", "after"]) {
      await expect(
        nz(source)
          .withContext({ [option]: count })
          .consume(),
      ).rejects.toThrow(RangeError)
    }
    expect(source[Symbol.asyncIterator]).not.toHaveBeenCalled()
  },
)

test("public API exposes withContext instead of window", async () => {
  expect(nozzle).not.toHaveProperty("window")
  expect(nz).not.toHaveProperty("window")
  expect(nz([])).not.toHaveProperty("window")
  const result = await nz(nz.withContext(nz([1, 2]), { before: 1 }))
    .map(({ past, current }) => current + past.length)
    .consume()
  expect(result.list()).toEqual([1, 3])
})
