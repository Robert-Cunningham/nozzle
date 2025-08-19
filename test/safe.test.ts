import { describe, expect, test } from "vitest"
import { safe } from "../src/transforms/safe"
import { errorSources } from "./error-test-sources"

describe("safe", () => {
  test("yields success results for normal iteration", async () => {
    const source = async function* () {
      yield "hello"
      yield "world"
    }

    const results = []
    for await (const result of safe(source())) {
      results.push(result)
    }

    expect(results).toEqual([{ success: "hello" }, { success: "world" }])
  })

  test("yields error result for immediate error", async () => {
    const results = []
    for await (const result of safe(errorSources.immediateError())) {
      results.push(result)
    }

    expect(results).toHaveLength(1)
    expect(results[0]).toHaveProperty("error")
    expect(results[0].error).toBeInstanceOf(Error)
    expect((results[0].error as Error).message).toBe("immediate error")
  })

  test("yields success results then error for errorAfterOne", async () => {
    const results = []
    for await (const result of safe(errorSources.errorAfterOne())) {
      results.push(result)
    }

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ success: "item1" })
    expect(results[1]).toHaveProperty("error")
    expect((results[1].error as Error).message).toBe("error after one")
  })

  test("yields multiple success results then error for errorAfterMultiple", async () => {
    const results = []
    for await (const result of safe(errorSources.errorAfterMultiple())) {
      results.push(result)
    }

    expect(results).toHaveLength(4)
    expect(results[0]).toEqual({ success: "item1" })
    expect(results[1]).toEqual({ success: "item2" })
    expect(results[2]).toEqual({ success: "item3" })
    expect(results[3]).toHaveProperty("error")
    expect((results[3].error as Error).message).toBe("error after multiple")
  })

  test("preserves custom error types", async () => {
    const results = []
    for await (const result of safe(errorSources.customError())) {
      results.push(result)
    }

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ success: "item1" })
    expect(results[1]).toHaveProperty("error")
    expect(results[1].error).toBeInstanceOf(TypeError)
    expect((results[1].error as TypeError).message).toBe("custom type error")
  })

  test("handles error after delay", async () => {
    const results = []
    for await (const result of safe(errorSources.errorAfterDelay())) {
      results.push(result)
    }

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ success: "item1" })
    expect(results[1]).toHaveProperty("error")
    expect((results[1].error as Error).message).toBe("error after delay")
  })

  test("handles non-Error thrown values", async () => {
    const source = async function* () {
      yield "item1"
      throw "string error"
    }

    const results = []
    for await (const result of safe(source())) {
      results.push(result)
    }

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ success: "item1" })
    expect(results[1]).toEqual({ error: "string error" })
  })

  test("handles thrown objects", async () => {
    const thrownObject = { code: 500, message: "server error" }
    const source = async function* () {
      yield "item1"
      throw thrownObject
    }

    const results = []
    for await (const result of safe(source())) {
      results.push(result)
    }

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ success: "item1" })
    expect(results[1]).toEqual({ error: thrownObject })
  })

  test("handles thrown null/undefined", async () => {
    const source1 = async function* () {
      throw null
    }

    const source2 = async function* () {
      throw undefined
    }

    const results1 = []
    for await (const result of safe(source1())) {
      results1.push(result)
    }

    const results2 = []
    for await (const result of safe(source2())) {
      results2.push(result)
    }

    expect(results1).toEqual([{ error: null }])
    expect(results2).toEqual([{ error: undefined }])
  })

  test("empty iterator yields no results", async () => {
    const source = async function* () {
      // yields nothing
    }

    const results = []
    for await (const result of safe(source())) {
      results.push(result)
    }

    expect(results).toHaveLength(0)
  })

  test("result objects have correct shape", async () => {
    const source = async function* () {
      yield "test"
      throw new Error("test error")
    }

    const results = []
    for await (const result of safe(source())) {
      results.push(result)
    }

    expect(results).toHaveLength(2)

    // Success result should have success property, no error property
    expect(results[0]).toHaveProperty("success")
    expect(results[0]).not.toHaveProperty("error")
    expect(Object.keys(results[0])).toEqual(["success"])

    // Error result should have error property, no success property
    expect(results[1]).toHaveProperty("error")
    expect(results[1]).not.toHaveProperty("success")
    expect(Object.keys(results[1])).toEqual(["error"])
  })
})
