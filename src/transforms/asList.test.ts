import { describe, test, expect } from "vitest"
import { aiter } from "../../testing/utils"
import { asList } from "./asList"

describe("asList", () => {
  test("should collect all values into an array", async () => {
    const source = aiter(["a", "b", "c"])
    const result = await asList(source)
    expect(result).toEqual(["a", "b", "c"])
  })

  test("should handle empty iterator", async () => {
    const source = aiter([])
    const result = await asList(source)
    expect(result).toEqual([])
  })

  test("should handle single value", async () => {
    const source = aiter(["lonely"])
    const result = await asList(source)
    expect(result).toEqual(["lonely"])
  })

  test("should preserve empty strings", async () => {
    const source = aiter(["a", "", "b"])
    const result = await asList(source)
    expect(result).toEqual(["a", "", "b"])
  })
})