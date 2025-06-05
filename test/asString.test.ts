import { describe, test, expect } from "vitest"
import { asString } from "../src/transforms/asString"
import { fromList } from "../src/transforms/fromList"

describe("asString", () => {
  test("should accumulate all strings into one", async () => {
    const result = await asString(fromList(["Hello", " ", "World", "!"]))
    expect(result).toBe("Hello World!")
  })

  test("should handle empty iterator", async () => {
    const result = await asString(fromList([]))
    expect(result).toBe("")
  })

  test("should handle single string", async () => {
    const result = await asString(fromList(["lonely"]))
    expect(result).toBe("lonely")
  })

  test("should handle empty strings", async () => {
    const result = await asString(fromList(["a", "", "b", "", "c"]))
    expect(result).toBe("abc")
  })
})