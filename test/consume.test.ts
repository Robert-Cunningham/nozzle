import { describe, test, expect } from "vitest"
import { consume } from "../src/transforms/consume"
import { fromList } from "../src/transforms/fromList"
import { nz } from "../src"

describe("consume", () => {
  test("should capture both yielded values and return value", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      yield "c"
      return "done"
    }

    const consumed = await consume(source())
    expect(consumed.list()).toEqual(["a", "b", "c"])
    expect(consumed.return()).toBe("done")
  })

  test("should handle generators with only yielded values", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
    }

    const consumed = await consume(source())
    expect(consumed.list()).toEqual([1, 2, 3])
    expect(consumed.return()).toBeUndefined()
  })

  test("should handle generators with only return value", async () => {
    const source = async function* () {
      return "only return"
    }

    const consumed = await consume(source())
    expect(consumed.list()).toEqual([])
    expect(consumed.return()).toBe("only return")
  })

  test("should handle empty generators", async () => {
    const source = async function* () {}

    const consumed = await consume(source())
    expect(consumed.list()).toEqual([])
    expect(consumed.return()).toBeUndefined()
  })

  test("should work with Pipeline.consume()", async () => {
    const source = async function* () {
      yield "hello"
      yield " "
      yield "world"
      return "finished"
    }

    const consumed = await nz(source()).consume()
    expect(consumed.list()).toEqual(["hello", " ", "world"])
    expect(consumed.return()).toBe("finished")
  })

  test("should work with transformed pipeline", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return 10
    }

    const consumed = await nz(source())
      .map((x) => x * 2)
      .consume()

    expect(consumed.list()).toEqual([2, 4, 6])
    // Return value is lost through map transform
    expect(consumed.return()).toBeUndefined()
  })

  test("should preserve return value with tap transform", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return "preserved"
    }

    const consumed = await nz(source())
      .tap(() => {}) // tap preserves return values
      .consume()

    expect(consumed.list()).toEqual([1, 2, 3])
    expect(consumed.return()).toBe("preserved")
  })

  test("string() method should work with string arrays", async () => {
    const consumed = await consume(fromList(["Hello", " ", "World", "!"]))
    expect(consumed.string()).toBe("Hello World!")
  })

  test("string() method should handle empty arrays", async () => {
    const consumed = await consume(fromList([]))
    expect(consumed.string()).toBe("")
  })

  test("should propagate errors", async () => {
    const source = async function* () {
      yield "item1"
      throw new Error("test error")
    }

    await expect(consume(source())).rejects.toThrow("test error")
  })

  test("should handle large arrays efficiently", async () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i)
    const consumed = await consume(fromList(largeArray))
    expect(consumed.list()).toEqual(largeArray)
    expect(consumed.return()).toBeUndefined()
  })
})
