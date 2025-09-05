import { describe, test, expect } from "vitest"
import { after } from "../src/transforms/after"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"
import { delayedStream, collectWithTimings, assertResultsEqualsWithTiming } from "./timing-helpers"

describe("after", () => {
  test("should emit everything after the separator match", async () => {
    const result = (await consume(after(fromList(["a", "b", "c", "d", "e"]), "bc"))).list()
    const expected = ["d", "e"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at the end", async () => {
    const result = (await consume(after(fromList(["abc", "def", "ghi"]), "hi"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should emit nothing if separator is not found", async () => {
    const result = (await consume(after(fromList(["a", "b", "c", "d", "e"]), "xyz"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = (await consume(after(fromList([]), "abc"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle single item source with match", async () => {
    const result = (await consume(after(fromList(["abcdef"]), "cd"))).list()
    const expected = ["ef"]
    expect(result).toEqual(expected)
  })

  test("should handle single item source without match", async () => {
    const result = (await consume(after(fromList(["abcdef"]), "xyz"))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle separator match at exact beginning", async () => {
    const result = (await consume(after(fromList(["abc", "def"]), "abc"))).list()
    const expected = ["def"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = (await consume(after(fromList(["hello ", "world", " test"]), "world"))).list()
    const expected = [" test"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in source", async () => {
    const result = (await consume(after(fromList(["a", "", "b", "cd", "e"]), "cd"))).list()
    const expected = ["e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty separator", async () => {
    const result = (await consume(after(fromList(["a", "b", "c"]), ""))).list()
    const expected = ["a", "b", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle partial matches across chunks", async () => {
    const result = (await consume(after(fromList(["ab", "cd", "ef"]), "cde"))).list()
    const expected = ["f"]
    expect(result).toEqual(expected)
  })

  test("should work with regex patterns", async () => {
    const result = (await consume(after(fromList(["foo123bar", "baz456qux"]), /\d+/))).list()
    const expected = ["bar", "baz456qux"]
    expect(result).toEqual(expected)
  })

  test("should handle complex regex patterns", async () => {
    const result = (await consume(after(fromList(["start", "data:", "value", "end"]), /data:\s*/))).list()
    const expected = ["value", "end"]
    expect(result).toEqual(expected)
  })

  test("should preserve timing when pattern matches early", async () => {
    const source = delayedStream(["a", "match", "c", "d"], 50)
    const filtered = after(source, "match")

    const results = await collectWithTimings(filtered)

    assertResultsEqualsWithTiming(results, [
      { item: "c", timestamp: 150 },
      { item: "d", timestamp: 200 },
    ])
  })

  test("should handle timing when pattern never matches", async () => {
    const source = delayedStream(["a", "b", "c"], 30)
    const filtered = after(source, "nomatch")

    const results = await collectWithTimings(filtered)

    expect(results).toEqual([])
  })
})
