import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { consume } from "../src/transforms/consume"

describe("return", () => {
  test("captures and returns the return value of an async generator", async () => {
    const source = async function* () {
      yield "item1"
      yield "item2"
      return "final value"
    }

    const result = (await consume(source())).return()
    expect(result).toBe("final value")
  })

  test("returns undefined when async generator has no return value", async () => {
    const source = async function* () {
      yield "item1"
      yield "item2"
    }

    const result = (await consume(source())).return()
    expect(result).toBeUndefined()
  })

  test("works with empty async generator that has return value", async () => {
    const source = async function* () {
      return "empty return"
    }

    const result = (await consume(source())).return()
    expect(result).toBe("empty return")
  })

  test("works with empty async generator with no return value", async () => {
    const source = async function* () {}

    const result = (await consume(source())).return()
    expect(result).toBeUndefined()
  })

  test("works with Pipeline.return() method", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return 42
    }

    const result = (await nz(source()).consume()).return()
    expect(result).toBe(42)
  })

  test("return value is preserved when using map and filter transforms", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return "original"
    }

    const result = (
      await nz(source())
        .map((x) => x * 2)
        .filter((x) => x > 2)
        .consume()
    ).return()

    // Note: return values are now preserved through map/filter
    expect(result).toBe("original")
  })

  test("works with tap transform which preserves return value", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return "preserved"
    }

    const result = (
      await nz(source())
        .tap((x) => {}) // tap preserves return values
        .consume()
    ).return()

    expect(result).toBe("preserved")
  })

  test("propagates errors from async generator", async () => {
    const source = async function* () {
      yield "item1"
      throw new Error("test error")
    }

    await expect(consume(source()).then((c) => c.return())).rejects.toThrow("test error")
  })
})
