import { expect, test, vi } from "vitest"
import { nz } from "../src"
import { window } from "../src/transforms/window"

test("asyncMap does not start a mapper for a read that finishes after cancellation", async () => {
  let release!: (result: IteratorResult<number, undefined>) => void
  let notifyRead!: () => void
  const secondRead = new Promise<void>((resolve) => {
    notifyRead = resolve
  })
  let reads = 0
  const source: AsyncIterable<number, undefined> & AsyncIterator<number, undefined> = {
    [Symbol.asyncIterator]() {
      return this
    },
    async next(): Promise<IteratorResult<number, undefined>> {
      if (reads++ === 0) return { done: false, value: 1 }
      notifyRead()
      return new Promise((resolve) => {
        release = resolve
      })
    },
    async return() {
      release({ done: false, value: 2 })
      return { done: true as const, value: undefined }
    },
  }
  const mapper = vi.fn(async (n: number) => n)
  const iter = nz(source).asyncMap(mapper, { concurrency: 1 })[Symbol.asyncIterator]()
  await iter.next()
  await secondRead
  await iter.return?.()
  expect(mapper).toHaveBeenCalledTimes(1)
})

test.each(["wrap", "window", "aperture"] as const)("%s closes upstream on consumer break", async (name) => {
  let closed = false
  async function* source() {
    try {
      yield 1
      yield 2
      yield 3
    } finally {
      closed = true
    }
  }
  const pipeline = nz(source())
  const transformed =
    name === "wrap"
      ? pipeline.wrap()
      : name === "window"
        ? window(pipeline, ({ current }) => ({ value: current }))
        : pipeline.aperture(2)
  for await (const _value of transformed) break
  expect(closed).toBe(true)
})

test("window closes upstream if its callback fails", async () => {
  let closed = false
  async function* source() {
    try {
      yield 1
      yield 2
    } finally {
      closed = true
    }
  }
  await expect(
    nz(
      window(source(), () => {
        throw new Error("callback")
      }),
    ).consume(),
  ).rejects.toThrow("callback")
  expect(closed).toBe(true)
})

test.each(["consume", "recover"] as const)("%s closes custom iterators after a read failure", async (name) => {
  const source = {
    [Symbol.asyncIterator]() {
      return this
    },
    next: vi.fn(async (): Promise<IteratorResult<string>> => {
      throw new Error("read failed")
    }),
    return: vi.fn(async () => ({ done: true as const, value: undefined })),
  }
  if (name === "consume") {
    await expect(nz(source).consume()).rejects.toThrow("read failed")
  } else {
    expect(
      (
        await nz(source)
          .recover(() => ["fallback"])
          .consume()
      ).list(),
    ).toEqual(["fallback"])
  }
  expect(source.return).toHaveBeenCalledTimes(1)
})

test.each(["buffer", "asyncMap", "throttle"] as const)("%s closes a failed background source", async (name) => {
  const source = {
    [Symbol.asyncIterator]() {
      return this
    },
    next: vi.fn(async (): Promise<IteratorResult<string>> => {
      throw new Error("read failed")
    }),
    return: vi.fn(async () => ({ done: true as const, value: undefined })),
  }
  const pipeline = nz(source)
  const transformed =
    name === "buffer"
      ? pipeline.buffer(1)
      : name === "asyncMap"
        ? pipeline.asyncMap(async (x) => x)
        : pipeline.throttle(1, (xs) => xs.join(""))
  await expect(transformed.consume()).rejects.toThrow("read failed")
  expect(source.return).toHaveBeenCalledTimes(1)
})

test("throttle closes upstream when the merge callback throws", async () => {
  let release!: (result: IteratorResult<string>) => void
  let reads = 0
  const source = {
    [Symbol.asyncIterator]() {
      return this
    },
    async next(): Promise<IteratorResult<string>> {
      if (reads++ === 0) return { done: false, value: "a" }
      return new Promise((resolve) => {
        release = resolve
      })
    },
    return: vi.fn(async () => {
      release({ done: true, value: undefined })
      return { done: true as const, value: undefined }
    }),
  }
  await expect(
    nz(source)
      .throttle(1, () => {
        throw new Error("merge failed")
      })
      .consume(),
  ).rejects.toThrow("merge failed")
  expect(source.return).toHaveBeenCalledTimes(1)
})
