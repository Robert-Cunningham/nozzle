import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { consume } from "../src/transforms/consume"
import { mapReturn } from "../src/transforms/mapReturn"

describe("mapReturn", () => {
  test("maps the return value while preserving yielded values", async () => {
    const source = async function* () {
      yield "item1"
      yield "item2"
      return 42
    }

    const stream = mapReturn(source(), (returnValue) => returnValue.toString())
    const consumed = await consume(stream)

    expect(consumed.list()).toEqual(["item1", "item2"])
    expect(consumed.return()).toBe("42")
  })

  test("returns undefined when source has no return value", async () => {
    const source = async function* () {
      yield "item1"
      yield "item2"
    }

    const stream = mapReturn(source(), (returnValue) => returnValue + "")
    const consumed = await consume(stream)

    expect(consumed.list()).toEqual(["item1", "item2"])
    expect(consumed.return()).toBe("undefined")
  })

  test("works with empty generator that has return value", async () => {
    const source = async function* () {
      return "empty return"
    }

    const stream = mapReturn(source(), (value) => value.toUpperCase())
    const consumed = await consume(stream)

    expect(consumed.list()).toEqual([])
    expect(consumed.return()).toBe("EMPTY RETURN")
  })

  test("propagates errors from source iterator", async () => {
    const source = async function* () {
      yield "item1"
      throw new Error("test error")
    }

    const stream = mapReturn(source(), (value) => value + "")

    await expect(consume(stream)).rejects.toThrow("test error")
  })

  test("works with Pipeline class", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return "original"
    }

    const consumed = await nz(source())
      .mapReturn((returnValue) => returnValue.toUpperCase())
      .consume()

    expect(consumed.list()).toEqual([1, 2, 3])
    expect(consumed.return()).toBe("ORIGINAL")
  })

  test("can chain with other transforms that preserve return values", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return 42
    }

    const consumed = await nz(source())
      .tap(() => {}) // tap preserves return values
      .mapReturn((returnValue) => `Result: ${returnValue}`)
      .consume()

    expect(consumed.list()).toEqual([1, 2, 3])
    expect(consumed.return()).toBe("Result: 42")
  })

  test("works with complex return value types", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      return { status: "complete", count: 2 }
    }

    const consumed = await nz(source())
      .mapReturn((result) => ({ ...result, processed: true }))
      .consume()

    expect(consumed.list()).toEqual(["a", "b"])
    expect(consumed.return()).toEqual({
      status: "complete",
      count: 2,
      processed: true,
    })
  })

  test("mapper function can return different types", async () => {
    const source = async function* () {
      yield "item"
      return 123
    }

    const consumed = await nz(source())
      .mapReturn((num) => (num > 100 ? "large" : "small"))
      .consume()

    expect(consumed.list()).toEqual(["item"])
    expect(consumed.return()).toBe("large")
  })
})
