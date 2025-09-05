import { describe, test, expect } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("fromList", () => {
  test("should convert array to async iterator", async () => {
    const result = (await consume(fromList(["a", "b", "c"]))).list()
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle empty array", async () => {
    const result = (await consume(fromList([]))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item", async () => {
    const result = (await consume(fromList(["lonely"]))).list()
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should preserve empty strings", async () => {
    const result = (await consume(fromList(["a", "", "b"]))).list()
    const expected = ["a", "", "b"]
    expect(result).toEqual(expected)
  })
})
