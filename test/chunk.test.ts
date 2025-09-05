import { describe, expect, test } from "vitest"
import { chunk } from "../src/transforms/chunk"
import { consume } from "../src/transforms/consume"
import { fromList } from "../src/transforms/fromList"

describe("chunk", () => {
  test("should group tokens by size and join them", async () => {
    const result = (await consume(chunk(fromList(["a", "b", "c", "d", "e", "f"]), 3))).list()
    const expected = ["abc", "def"]
    expect(result).toEqual(expected)
  })

  test("should handle partial chunks at the end", async () => {
    const result = (await consume(chunk(fromList(["a", "b", "c", "d", "e"]), 3))).list()
    const expected = ["abc", "de"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = (await consume(chunk(fromList([]), 3))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item", async () => {
    const result = (await consume(chunk(fromList(["lonely"]), 3))).list()
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size of 1", async () => {
    const result = await (await consume(chunk(fromList(["a", "b", "c"]), 1))).list()
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size equal to input length", async () => {
    const result = await (await consume(chunk(fromList(["hello", "world", "test"]), 3))).list()
    const expected = ["helloworldtest"]
    expect(result).toEqual(expected)
  })

  test("should handle chunk size larger than input length", async () => {
    const result = await (await consume(chunk(fromList(["a", "b"]), 5))).list()
    const expected = ["ab"]
    expect(result).toEqual(expected)
  })

  test("should preserve content for asString equality", async () => {
    const input = fromList(["hello", "world", "test", "data"])
    const original = await (await consume(input)).string()
    const chunked = chunk(fromList(["hello", "world", "test", "data"]), 2)
    const reconstructed = await (await consume(chunked)).string()
    expect(reconstructed).toBe(original)
  })

  test("should handle different token lengths", async () => {
    const result = await (await consume(chunk(fromList(["short", "verylongtoken", "mid"]), 2))).list()
    const expected = ["shortverylongtoken", "mid"]
    expect(result).toEqual(expected)
  })
})
