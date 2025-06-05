import { describe, test, expect } from "vitest"
import { aiter } from "../../testing/utils"
import { asString } from "./asString"

describe("asString", () => {
  test("should accumulate all strings into one", async () => {
    const source = aiter(["Hello", " ", "World", "!"])
    const result = await asString(source)
    expect(result).toBe("Hello World!")
  })

  test("should handle empty iterator", async () => {
    const source = aiter([])
    const result = await asString(source)
    expect(result).toBe("")
  })

  test("should handle single string", async () => {
    const source = aiter(["lonely"])
    const result = await asString(source)
    expect(result).toBe("lonely")
  })

  test("should handle empty strings", async () => {
    const source = aiter(["a", "", "b", "", "c"])
    const result = await asString(source)
    expect(result).toBe("abc")
  })
})