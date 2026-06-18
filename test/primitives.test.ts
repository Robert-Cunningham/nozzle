import { describe, expect, test } from "vitest"
import { Channel, Cursor } from "../src/primitives"

describe("Channel", () => {
  test("yields queued values before close return value", async () => {
    const channel = new Channel<number, string>()

    await channel.push(1)
    channel.close("done")

    expect(await channel.next()).toEqual({ done: false, value: 1 })
    expect(await channel.next()).toEqual({ done: true, value: "done" })
  })

  test("applies bounded backpressure", async () => {
    const channel = new Channel<number>({ capacity: 1 })

    await channel.push(1)

    let pushedSecond = false
    const secondPush = channel.push(2).then(() => {
      pushedSecond = true
    })

    await Promise.resolve()
    expect(pushedSecond).toBe(false)

    expect(await channel.next()).toEqual({ done: false, value: 1 })
    await secondPush

    expect(pushedSecond).toBe(true)
    expect(await channel.next()).toEqual({ done: false, value: 2 })
  })

  test("yields queued values before a failure", async () => {
    const channel = new Channel<number>()
    const error = new Error("boom")

    await channel.push(1)
    channel.fail(error)

    expect(await channel.next()).toEqual({ done: false, value: 1 })
    await expect(channel.next()).rejects.toBe(error)
  })

  test("can pump from an async iterable while preserving return values", async () => {
    async function* source(): AsyncGenerator<string, number> {
      yield "a"
      yield "b"
      return 42
    }

    const channel = Channel.from(source())

    expect(await channel.next()).toEqual({ done: false, value: "a" })
    expect(await channel.next()).toEqual({ done: false, value: "b" })
    expect(await channel.next()).toEqual({ done: true, value: 42 })
  })
})

describe("Cursor", () => {
  test("tracks current, upcoming, past, done, and return value", async () => {
    async function* source(): AsyncGenerator<number, string> {
      yield 1
      yield 2
      yield 3
      return "done"
    }

    const cursor = new Cursor<number, string>(source(), { maxPast: 1 })

    expect(await cursor.init()).toBe(true)
    expect(cursor.snapshot()).toEqual({
      past: [],
      current: 1,
      upcoming: [],
      index: 0,
      done: false,
    })

    expect(await cursor.peek(2)).toEqual([2, 3])
    expect(cursor.snapshot().upcoming).toEqual([2, 3])

    expect(await cursor.advance()).toBe(true)
    expect(cursor.snapshot()).toEqual({
      past: [1],
      current: 2,
      upcoming: [3],
      index: 1,
      done: false,
    })

    expect(await cursor.peek(2)).toEqual([3])
    expect(cursor.done).toBe(true)
    expect(cursor.returnValue).toBe("done")

    expect(await cursor.advance()).toBe(true)
    expect(cursor.snapshot()).toEqual({
      past: [2],
      current: 3,
      upcoming: [],
      index: 2,
      done: true,
    })

    expect(await cursor.advance()).toBe(false)
    expect(cursor.returnValue).toBe("done")
  })

  test("can cancel the upstream iterator", async () => {
    let returned = false

    async function* source(): AsyncGenerator<number, string> {
      try {
        yield 1
        yield 2
      } finally {
        returned = true
      }

      return "done"
    }

    const cursor = new Cursor<number, string>(source())

    expect(await cursor.init()).toBe(true)
    await cursor.cancel("stopped")

    expect(returned).toBe(true)
    expect(cursor.hasCurrent).toBe(false)
    expect(cursor.returnValue).toBe("stopped")
  })
})
