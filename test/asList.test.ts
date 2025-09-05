import { describe, test, expect } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("asList", () => {
  test("should collect all values into an array", async () => {
    const result = await (await consume(fromList(["a", "b", "c"]))).list()
    expect(result).toEqual(["a", "b", "c"])
  })

  test("should handle empty iterator", async () => {
    const result = await (await consume(fromList([]))).list()
    expect(result).toEqual([])
  })

  test("should handle single value", async () => {
    const result = await (await consume(fromList(["lonely"]))).list()
    expect(result).toEqual(["lonely"])
  })

  test("should preserve empty strings", async () => {
    const result = await (await consume(fromList(["a", "", "b"]))).list()
    expect(result).toEqual(["a", "", "b"])
  })
})
