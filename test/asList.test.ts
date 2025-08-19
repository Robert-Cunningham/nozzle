import { describe, test, expect } from "vitest"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"

describe("asList", () => {
  test("should collect all values into an array", async () => {
    const result = await asList(fromList(["a", "b", "c"]))
    expect(result).toEqual(["a", "b", "c"])
  })

  test("should handle empty iterator", async () => {
    const result = await asList(fromList([]))
    expect(result).toEqual([])
  })

  test("should handle single value", async () => {
    const result = await asList(fromList(["lonely"]))
    expect(result).toEqual(["lonely"])
  })

  test("should preserve empty strings", async () => {
    const result = await asList(fromList(["a", "", "b"]))
    expect(result).toEqual(["a", "", "b"])
  })
})
