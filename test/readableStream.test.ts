import { describe, expect, expectTypeOf, test } from "vitest"
import { nz, Pipeline, toReadableStream } from "../src"

function streamOf<T>(values: T[], onCancel?: () => void): ReadableStream<T> {
  let i = 0
  return new ReadableStream<T>({
    pull(controller) {
      if (i < values.length) controller.enqueue(values[i++])
      else controller.close()
    },
    cancel: onCancel,
  })
}

// A stream without Symbol.asyncIterator, like Safari's ReadableStream.
function readerOnly<T>(stream: ReadableStream<T>) {
  return { getReader: () => stream.getReader() }
}

async function readAll<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader()
  const values: T[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) return values
    values.push(value)
  }
}

describe("ReadableStream input", () => {
  test("accepts a native ReadableStream", async () => {
    const pipeline = nz(streamOf(["a,b", ",c"])).split(",")
    expectTypeOf(pipeline).toEqualTypeOf<Pipeline<string, undefined>>()
    expect((await pipeline.consume()).list()).toEqual(["a", "b", "c"])
  })

  test("accepts streams that are not async iterable", async () => {
    const pipeline = nz(readerOnly(streamOf(["a,b", ",c"]))).split(",")
    expectTypeOf(pipeline).toEqualTypeOf<Pipeline<string, undefined>>()
    const result = await pipeline.consume()
    expect(result.list()).toEqual(["a", "b", "c"])
    expect(result.return()).toBeUndefined()
  })

  test("handles empty streams", async () => {
    expect((await nz(readerOnly(streamOf<string>([]))).consume()).list()).toEqual([])
  })

  test("early exit cancels the stream and releases the reader", async () => {
    let cancelled = false
    const stream = streamOf([1, 2, 3], () => {
      cancelled = true
    })
    expect(await nz(readerOnly(stream)).first()).toBe(1)
    expect(cancelled).toBe(true)
    expect(stream.locked).toBe(false)
  })

  test("stream errors are catchable and release the reader", async () => {
    let pulls = 0
    const stream = new ReadableStream<string>({
      pull(controller) {
        if (pulls++ === 0) controller.enqueue("a")
        else controller.error(new Error("boom"))
      },
    })
    const seen: string[] = []
    await expect(
      (async () => {
        for await (const value of nz(readerOnly(stream))) seen.push(value)
      })(),
    ).rejects.toThrow("boom")
    expect(seen).toEqual(["a"])
    expect(stream.locked).toBe(false)
  })

  test("still rejects non-iterable values", () => {
    expect(() => nz(42 as any)).toThrow(TypeError)
  })
})

describe("toReadableStream", () => {
  test("yields each value and closes", async () => {
    const stream = nz(["a", "b", "c"])
      .map((x) => x.toUpperCase())
      .toReadableStream()
    expectTypeOf(stream).toEqualTypeOf<ReadableStream<string>>()
    expect(await readAll(stream)).toEqual(["A", "B", "C"])
  })

  test("is available as a standalone function", async () => {
    expect(await readAll(toReadableStream(nz([1, 2]).value()))).toEqual([1, 2])
  })

  test("handles empty sources", async () => {
    expect(await readAll(nz([]).toReadableStream())).toEqual([])
  })

  test("does not read ahead of the consumer", async () => {
    const pulled: number[] = []
    const stream = nz([1, 2, 3])
      .tap((x) => pulled.push(x))
      .toReadableStream()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(pulled).toEqual([])
    const reader = stream.getReader()
    expect(await reader.read()).toEqual({ done: false, value: 1 })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(pulled).toEqual([1])
  })

  test("cancel closes the source iterator", async () => {
    let closed = false
    async function* source() {
      try {
        yield 1
        yield 2
      } finally {
        closed = true
      }
    }
    const reader = nz(source()).toReadableStream().getReader()
    await reader.read()
    await reader.cancel()
    expect(closed).toBe(true)
  })

  test("source errors error the stream", async () => {
    async function* source() {
      yield 1
      throw new Error("boom")
    }
    const reader = nz(source()).toReadableStream().getReader()
    expect(await reader.read()).toEqual({ done: false, value: 1 })
    await expect(reader.read()).rejects.toThrow("boom")
  })

  test("round-trips through pipeThrough", async () => {
    const encoded = nz(["hé", "llo"]).toReadableStream().pipeThrough(new TextEncoderStream())
    const decoded = encoded.pipeThrough(new TextDecoderStream())
    expect((await nz(decoded).consume()).string()).toBe("héllo")
  })
})
