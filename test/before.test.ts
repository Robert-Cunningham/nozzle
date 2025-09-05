import { describe, test, expect } from "vitest"
import { before } from "../src/transforms/before"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("before", () => {
  test("should emit everything before the separator match", async () => {
    const result = (await consume(before(fromList(["a", "b", "c", "d", "e"]), "cd"))).list()
    const expected = ["a", "b"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at the beginning", async () => {
    const result = (await consume(before(fromList(["abc", "def", "ghi"]), "ab"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should emit everything if separator is not found", async () => {
    const result = (await consume(before(fromList(["a", "b", "c", "d", "e"]), "xyz"))).list()
    const expected = ["a", "b", "c", "d", "e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = (await consume(before(fromList([]), "abc"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item source with match", async () => {
    const result = (await consume(before(fromList(["abcdef"]), "cd"))).list()
    const expected = ["ab"]
    expect(result).toEqual(expected)
  })

  test("should handle single item source without match", async () => {
    const result = (await consume(before(fromList(["abcdef"]), "xyz"))).list()
    const expected = ["abcdef"]
    expect(result).toEqual(expected)
  })

  test("should handle separator match at exact end", async () => {
    const result = (await consume(before(fromList(["a", "b", "c"]), "abc"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = (await consume(before(fromList(["hello ", "world", " test"]), "world"))).list()
    const expected = ["hello "]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in source", async () => {
    const result = (await consume(before(fromList(["a", "", "b", "cd", "e"]), "cd"))).list()
    const expected = ["a", "", "b"]
    expect(result).toEqual(expected)
  })

  test("should handle empty separator", async () => {
    const result = (await consume(before(fromList(["a", "b", "c"]), ""))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle partial matches across chunks", async () => {
    const result = (await consume(before(fromList(["ab", "cd", "ef"]), "cde"))).list()
    const expected = ["ab"]
    expect(result).toEqual(expected)
  })
})
