import { describe, expect, test } from "vitest"
import { safe } from "../src/transforms/safe"
import { unwrap } from "../src/transforms/unwrap"
import { fromList } from "../src/transforms/fromList"

describe("unwrap", () => {
  test("unwraps safe values back to normal iterator", async () => {
    const source = fromList(["hello", "world"])
    const safeResults = safe(source)
    const unwrapped = unwrap(safeResults)

    const results = []
    for await (const value of unwrapped) {
      results.push(value)
    }

    expect(results).toEqual(["hello", "world"])
  })

  test("throws errors when unwrapping error results", async () => {
    const errorSource = async function* () {
      yield "item1"
      throw new Error("test error")
    }

    const safeResults = safe(errorSource())
    const unwrapped = unwrap(safeResults)

    const results = []
    await expect(async () => {
      for await (const value of unwrapped) {
        results.push(value)
      }
    }).rejects.toThrow("test error")

    expect(results).toEqual(["item1"])
  })

  test("handles return values correctly", async () => {
    const sourceWithReturn = async function* () {
      yield "item1"
      yield "item2"
      return "final value"
    }

    const safeResults = safe(sourceWithReturn())
    const unwrapped = unwrap(safeResults)

    const results = []
    const iterator = unwrapped[Symbol.asyncIterator]()

    let result = await iterator.next()
    while (!result.done) {
      results.push(result.value)
      result = await iterator.next()
    }

    expect(results).toEqual(["item1", "item2"])
    expect(result.value).toBe("final value")
  })

  test("handles custom error types", async () => {
    const customErrorSource = async function* () {
      yield "item1"
      throw new TypeError("custom type error")
    }

    const safeResults = safe(customErrorSource())
    const unwrapped = unwrap(safeResults)

    const results = []
    await expect(async () => {
      for await (const value of unwrapped) {
        results.push(value)
      }
    }).rejects.toThrow(TypeError)

    expect(results).toEqual(["item1"])
  })

  test("handles non-Error thrown values", async () => {
    const stringErrorSource = async function* () {
      yield "item1"
      throw "string error"
    }

    const safeResults = safe(stringErrorSource())
    const unwrapped = unwrap(safeResults)

    const results = []
    await expect(async () => {
      for await (const value of unwrapped) {
        results.push(value)
      }
    }).rejects.toBe("string error")

    expect(results).toEqual(["item1"])
  })

  test("handles thrown objects", async () => {
    const thrownObject = { code: 500, message: "server error" }
    const objectErrorSource = async function* () {
      yield "item1"
      throw thrownObject
    }

    const safeResults = safe(objectErrorSource())
    const unwrapped = unwrap(safeResults)

    const results = []
    await expect(async () => {
      for await (const value of unwrapped) {
        results.push(value)
      }
    }).rejects.toBe(thrownObject)

    expect(results).toEqual(["item1"])
  })

  test("handles null/undefined thrown values", async () => {
    const nullErrorSource = async function* () {
      throw null
    }

    const safeResults = safe(nullErrorSource())
    const unwrapped = unwrap(safeResults)

    await expect(async () => {
      for await (const value of unwrapped) {
        // should not reach here
      }
    }).rejects.toBe(null)
  })

  test("empty iterator yields no results", async () => {
    const emptySource = async function* () {
      // yields nothing
    }

    const safeResults = safe(emptySource())
    const unwrapped = unwrap(safeResults)

    const results = []
    for await (const value of unwrapped) {
      results.push(value)
    }

    expect(results).toHaveLength(0)
  })

  test("round trip: safe -> unwrap preserves behavior", async () => {
    const originalSource = fromList(["a", "b", "c"])

    // Original behavior
    const originalResults = []
    for await (const value of originalSource) {
      originalResults.push(value)
    }

    // Round trip behavior
    const roundTripSource = fromList(["a", "b", "c"])
    const safeResults = safe(roundTripSource)
    const unwrapped = unwrap(safeResults)

    const roundTripResults = []
    for await (const value of unwrapped) {
      roundTripResults.push(value)
    }

    expect(roundTripResults).toEqual(originalResults)
  })

  test("ignores results with no properties set", async () => {
    const manualSafeResults = async function* () {
      yield { value: "item1" }
      yield {} // empty result object
      yield { value: "item2" }
    }

    const unwrapped = unwrap(manualSafeResults())

    const results = []
    for await (const value of unwrapped) {
      results.push(value)
    }

    expect(results).toEqual(["item1", "item2"])
  })
})
