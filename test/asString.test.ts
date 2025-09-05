import { describe, test, expect } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("asString", () => {
  test("should accumulate all strings into one", async () => {
    const result = await (await consume(fromList(["Hello", " ", "World", "!"]))).string()
    expect(result).toBe("Hello World!")
  })

  test("should handle empty iterator", async () => {
    const result = await (await consume(fromList([]))).string()
    expect(result).toBe("")
  })

  test("should handle single string", async () => {
    const result = await (await consume(fromList(["lonely"]))).string()
    expect(result).toBe("lonely")
  })

  test("should handle empty strings", async () => {
    const result = await (await consume(fromList(["a", "", "b", "", "c"]))).string()
    expect(result).toBe("abc")
  })
})
